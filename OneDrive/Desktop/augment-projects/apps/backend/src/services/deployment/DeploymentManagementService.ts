import { PrismaClient } from '@prisma/client';
import { deployToAWS, deployToNetlify, deployToVercel } from './deploymentProviders';

const prisma = new PrismaClient();

export class DeploymentManagementService {
  async createDeployment(userId: string, name: string, platform: string, config: any) {
    // Check if user has available deployments
    const purchases = await prisma.deploymentPurchase.findMany({
      where: { userId, status: 'active' }
    });

    const totalAvailable = purchases.reduce((sum, p) => sum + p.quantity, 0);
    const activeDeployments = await prisma.activeDeployment.count({ where: { userId } });

    if (activeDeployments >= totalAvailable) {
      throw new Error('No available deployments. Purchase additional deployments.');
    }

    // Create deployment record
    const deployment = await prisma.activeDeployment.create({
      data: {
        userId,
        name,
        platform,
        status: 'deploying',
        purchaseId: `purchase-${Date.now()}`
      }
    });

    // Deploy to platform
    try {
      let result;
      switch (platform) {
        case 'vercel':
          result = await deployToVercel('/tmp/project', config);
          break;
        case 'aws':
          result = await deployToAWS('/tmp/project', config);
          break;
        case 'netlify':
          result = await deployToNetlify('/tmp/project', config);
          break;
        default:
          throw new Error('Unsupported platform');
      }

      // Update deployment with URL
      await prisma.activeDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'active',
          url: result.url
        }
      });

      return { success: true, url: result.url };
    } catch (error) {
      await prisma.activeDeployment.update({
        where: { id: deployment.id },
        data: { status: 'failed' }
      });
      throw error;
    }
  }

  async getDeployments(userId: string) {
    return await prisma.activeDeployment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteDeployment(userId: string, deploymentId: string) {
    const deployment = await prisma.activeDeployment.findFirst({
      where: { id: deploymentId, userId }
    });

    if (!deployment) {
      throw new Error('Deployment not found');
    }

    // Remove from platform (implementation depends on platform)
    // ...

    await prisma.activeDeployment.delete({
      where: { id: deploymentId }
    });

    return { success: true };
  }
}
