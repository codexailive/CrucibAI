import { PrismaClient } from '@prisma/client';
import { AdvancedCreditsService, CreditUsageType } from '../credits/AdvancedCreditsService';

const prisma = new PrismaClient();
const creditsService = new AdvancedCreditsService();

export interface ARVRSession {
  id: string;
  userId: string;
  type: 'AR' | 'VR';
  sceneData: any; // 3D code visualization data
  taskGraphId?: string;
  createdAt: Date;
  updatedAt?: Date;
  active: boolean;
}

export class ARVREnvironmentService {
  private sessions: Map<string, ARVRSession> = new Map();

  constructor() {}

  async initSession(userId: string, type: 'AR' | 'VR' = 'VR'): Promise<ARVRSession> {
    try {
      // Consume credits for XR session
      await creditsService.consumeCredits(userId, CreditUsageType.AI_CALL, 10); // 10 credits for session

      const sessionId = `xr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: ARVRSession = {
        id: sessionId,
        userId,
        type,
        sceneData: {
          codeViz: {}, // Placeholder for 3D code visualization (Three.js scene)
          taskNodes: [], // Visual task nodes in 3D space
          interactions: [] // AR/VR interaction points
        },
        createdAt: new Date(),
        active: true
      };

      this.sessions.set(sessionId, session);

      // Store in DB if needed
      await prisma.arVRSession.create({
        data: {
          id: sessionId,
          userId,
          type,
          sceneData: JSON.stringify(session.sceneData),
          active: true,
        }
      });

      return session;
    } catch (error) {
      console.error('XR session init error:', error);
      throw error;
    }
  }

  async updateScene(sessionId: string, sceneData: any): Promise<ARVRSession | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.sceneData = { ...session.sceneData, ...sceneData };
    session.updatedAt = new Date();

    // Update DB
    await prisma.arVRSession.update({
      where: { id: sessionId },
      data: {
        sceneData: JSON.stringify(session.sceneData),
        updatedAt: new Date(),
      }
    });

    return session;
  }

  async endSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.active = false;

    // Update DB
    await prisma.arVRSession.update({
      where: { id: sessionId },
      data: {
        active: false,
      }
    });

    this.sessions.delete(sessionId);
    return true;
  }

  getSession(sessionId: string): ARVRSession | null {
    return this.sessions.get(sessionId) || null;
  }
}