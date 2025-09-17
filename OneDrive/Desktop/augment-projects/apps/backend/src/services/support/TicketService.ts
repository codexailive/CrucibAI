import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TicketService {
  async createTicket(userId: string, subject: string, message: string, category: string, priority: string = 'medium') {
    return await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        category,
        priority,
        status: 'open'
      },
      include: {
        user: true,
        replies: true
      }
    });
  }

  async getTickets(userId: string) {
    return await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        user: true,
        replies: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getTicket(ticketId: string, userId?: string) {
    const where: any = { id: ticketId };
    if (userId) {
      where.userId = userId;
    }

    return await prisma.supportTicket.findFirst({
      where,
      include: {
        user: true,
        replies: {
          include: {
            user: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  async addReply(ticketId: string, userId: string, message: string, isInternal: boolean = false) {
    return await prisma.ticketReply.create({
      data: {
        ticketId,
        userId,
        message,
        isInternal
      },
      include: {
        user: true
      }
    });
  }

  async assignTicket(ticketId: string, agentId: string) {
    return await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: agentId,
        status: 'in_progress'
      }
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status,
        updatedAt: new Date()
      }
    });
  }

  async getTicketsByCategory(category: string) {
    return await prisma.supportTicket.findMany({
      where: { category },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
