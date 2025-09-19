import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SupportService {
  async createTicket(userId: string, subject: string, message: string, priority: string = 'medium', category: string = 'general') {
    return await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        message,
        priority,
        category,
        status: 'open',
      },
    });
  }

  async getTicket(ticketId: string) {
    return await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async getUserTickets(userId: string) {
    return await prisma.supportTicket.findMany({
      where: { userId },
      include: {
        replies: {
          select: { id: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status },
    });
  }

  async addReply(ticketId: string, userId: string, message: string, isInternal: boolean = false) {
    return await prisma.ticketReply.create({
      data: {
        ticketId,
        userId,
        message,
        isInternal,
      },
    });
  }

  async getKnowledgeBaseArticles(category?: string, searchTerm?: string) {
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        { tags: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return await prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: [
        { helpful: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async getArticle(articleId: string) {
    return await prisma.knowledgeBaseArticle.findUnique({
      where: { id: articleId },
    });
  }

  async markArticleHelpful(articleId: string) {
    return await prisma.knowledgeBaseArticle.update({
      where: { id: articleId },
      data: {
        helpful: { increment: 1 },
      },
    });
  }

  async getTicketStats() {
    const [total, open, inProgress, resolved] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { status: 'resolved' } }),
    ]);

    return {
      total,
      open,
      inProgress,
      resolved,
    };
  }

  async closeTicket(ticketId: string, userId: string) {
    return await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closedBy: 'user'
      }
    });
  }

  async reopenTicket(ticketId: string, userId: string, message?: string) {
    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'open',
        closedAt: null,
        closedBy: null
      }
    });

    if (message) {
      await this.addReply(ticketId, userId, message, false);
    }

    return ticket;
  }

  async searchKnowledgeBase(query: string, category?: string) {
    return await this.getKnowledgeBaseArticles(category, query);
  }

  async getSupportMetrics(period: string = '30d') {
    // Mock implementation - in real app would calculate based on period
    return {
      totalTickets: 100,
      resolvedTickets: 85,
      averageResponseTime: '2h 30m',
      customerSatisfaction: 4.2
    };
  }

  async rateTicket(ticketId: string, userId: string, rating: number) {
    return await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { satisfactionRating: rating }
    });
  }
}
