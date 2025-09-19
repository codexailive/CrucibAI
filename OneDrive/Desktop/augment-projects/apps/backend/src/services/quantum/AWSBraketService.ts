import { BraketClient, GetDeviceCommand, GetQuantumTaskCommand } from "@aws-sdk/client-braket";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from 'uuid';

export class AWSBraketService {
  private braketClient: BraketClient;
  private s3Client: S3Client;
  private resultsBucket: string;

  constructor() {
    this.braketClient = new BraketClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.resultsBucket = process.env.AWS_BRAKET_BUCKET || 'otolo-app-braket';
  }

  async checkDeviceAvailability(deviceArn: string): Promise<boolean> {
    try {
      const command = new GetDeviceCommand({ deviceArn });
      const response = await this.braketClient.send(command);
      return response.deviceStatus === 'ONLINE';
    } catch (error) {
      console.error('Error checking device availability:', error);
      return false;
    }
  }

  async submitQuantumJob(
    deviceArn: string,
    circuit: any,
    shots: number = 1000
  ): Promise<{ taskId: string; status: string }> {
    try {
      // Create a unique task ID
      const taskId = uuidv4();

      // Upload the circuit definition to S3
      const circuitKey = `circuits/${taskId}.json`;
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.resultsBucket,
          Key: circuitKey,
          Body: JSON.stringify(circuit),
          ContentType: 'application/json'
        }
      });

      await upload.done();

      // Create the quantum task using the Braket API
      // Note: This is a simplified example. Real implementation would use AWS Braket SDK
      const taskResponse = await fetch(`https://braket.${process.env.AWS_REGION}.amazonaws.com/quantum-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Amz-Target': 'Braket.CreateQuantumTask'
        },
        body: JSON.stringify({
          deviceArn,
          action: {
            type: 'braket.ir.jaqcd.program',
            source: circuitKey
          },
          outputS3Bucket: this.resultsBucket,
          outputS3KeyPrefix: `results/${taskId}`,
          shots
        })
      });

      const taskData = await taskResponse.json();

      return {
        taskId: taskData.quantumTaskArn,
        status: taskData.status
      };
    } catch (error) {
      console.error('Error submitting quantum job:', error);
      throw new Error('Failed to submit quantum job');
    }
  }

  async getJobStatus(taskId: string): Promise<{ status: string; outputS3Path?: string }> {
    try {
      const command = new GetQuantumTaskCommand({ quantumTaskArn: taskId });
      const response = await this.braketClient.send(command);

      return {
        status: response.status || 'UNKNOWN',
        outputS3Path: response.outputS3Directory
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new Error('Failed to get job status');
    }
  }

  async getJobResults(taskId: string): Promise<any> {
    try {
      // First get the job status to find the S3 path
      const { status, outputS3Path } = await this.getJobStatus(taskId);

      if (status !== 'COMPLETED') {
        throw new Error(`Job not completed. Current status: ${status}`);
      }

      if (!outputS3Path) {
        throw new Error('No output S3 path found');
      }

      // Extract the bucket and key from the S3 path
      const s3Parts = outputS3Path.replace('s3://', '').split('/');
      const bucket = s3Parts[0];
      const key = s3Parts.slice(1).join('/');

      // Get the results from S3
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: `${key}/results.json`
      });

      const response = await this.s3Client.send(command);
      const resultsString = await response.Body?.transformToString();

      if (!resultsString) {
        throw new Error('No results found');
      }

      return JSON.parse(resultsString);
    } catch (error) {
      console.error('Error getting job results:', error);
      throw new Error('Failed to get job results');
    }
  }
}
