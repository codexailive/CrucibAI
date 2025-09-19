import { DeleteMessageCommand, ReceiveMessageCommand, SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { PrismaClient } from '@prisma/client';
import { AWSBraketService } from './AWSBraketService';

const prisma = new PrismaClient();

export class QuantumJobQueue {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private braketService: AWSBraketService;
  private isProcessing: boolean = false;

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.queueUrl = process.env.AWS_QUANTUM_JOB_QUEUE_URL || '';
    this.braketService = new AWSBraketService();
  }

  async addJobToQueue(jobData: {
    userId: string;
    circuitId: string;
    deviceArn: string;
    circuit: any;
    shots: number;
  }): Promise<string> {
    try {
      const messageBody = JSON.stringify({
        ...jobData,
        timestamp: new Date().toISOString(),
        priority: this.calculatePriority(jobData.deviceArn)
      });

      const command = new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: messageBody,
        DelaySeconds: 0
      });

      const response = await this.sqsClient.send(command);
      return response.MessageId || '';
    } catch (error) {
      console.error('Error adding job to queue:', error);
      throw new Error('Failed to add job to queue');
    }
  }

  async startJobProcessor(): Promise<void> {
    if (this.isProcessing) {
      console.log('Job processor is already running');
      return;
    }

    this.isProcessing = true;
    console.log('Starting quantum job processor...');

    while (this.isProcessing) {
      try {
        await this.processNextJob();
        // Wait 5 seconds before checking for next job
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error('Error in job processor:', error);
        // Wait 30 seconds before retrying on error
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }

  stopJobProcessor(): void {
    console.log('Stopping quantum job processor...');
    this.isProcessing = false;
  }

  private async processNextJob(): Promise<void> {
    try {
      // Receive message from queue
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20, // Long polling
        VisibilityTimeout: 300 // 5 minutes
      });

      const response = await this.sqsClient.send(command);

      if (!response.Messages || response.Messages.length === 0) {
        return; // No messages to process
      }

      const message = response.Messages[0];
      const jobData = JSON.parse(message.Body || '{}');

      console.log(`Processing quantum job for user ${jobData.userId}`);

      // Check if device is available
      const isAvailable = await this.braketService.checkDeviceAvailability(jobData.deviceArn);
      
      if (!isAvailable) {
        console.log(`Device ${jobData.deviceArn} is not available, requeueing job`);
        // Don't delete the message, let it become visible again after timeout
        return;
      }

      // Submit job to Braket
      const { taskId, status } = await this.braketService.submitQuantumJob(
        jobData.deviceArn,
        jobData.circuit,
        jobData.shots
      );

      // Update database with task ID
      await prisma.quantumJob.update({
        where: { id: jobData.circuitId },
        data: {
          status: 'submitted',
          startedAt: new Date()
        }
      });

      // Delete message from queue
      await this.sqsClient.send(new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle
      }));

      console.log(`Successfully submitted quantum job ${taskId}`);

      // Start monitoring this job
      this.monitorJob(taskId, jobData.circuitId);

    } catch (error) {
      console.error('Error processing job:', error);
      // Message will become visible again after visibility timeout
    }
  }

  private async monitorJob(taskId: string, circuitId: string): Promise<void> {
    try {
      const checkInterval = setInterval(async () => {
        try {
          const { status } = await this.braketService.getJobStatus(taskId);

          await prisma.quantumJob.update({
            where: { id: circuitId },
            data: { status: status.toLowerCase() }
          });

          if (status === 'COMPLETED') {
            // Get results and store them
            const results = await this.braketService.getJobResults(taskId);
            
            await prisma.quantumJob.update({
              where: { id: circuitId },
              data: {
                status: 'completed',
                result: JSON.stringify(results),
                completedAt: new Date()
              }
            });

            clearInterval(checkInterval);
            console.log(`Quantum job ${taskId} completed successfully`);

          } else if (status === 'FAILED' || status === 'CANCELLED') {
            await prisma.quantumJob.update({
              where: { id: circuitId },
              data: {
                status: status.toLowerCase(),
                completedAt: new Date()
              }
            });

            clearInterval(checkInterval);
            console.log(`Quantum job ${taskId} ${status.toLowerCase()}`);
          }

        } catch (error) {
          console.error(`Error monitoring job ${taskId}:`, error);
        }
      }, 30000); // Check every 30 seconds

      // Stop monitoring after 1 hour
      setTimeout(() => {
        clearInterval(checkInterval);
      }, 3600000);

    } catch (error) {
      console.error('Error setting up job monitoring:', error);
    }
  }

  private calculatePriority(deviceArn: string): number {
    // Higher priority for simulators (faster execution)
    if (deviceArn.includes('simulator')) {
      return 1;
    }
    // Lower priority for real quantum devices
    return 5;
  }
}
