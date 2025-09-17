import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class KnowledgeBaseService {
  async getArticles(category?: string, search?: string) {
    const where: any = { published: true };
    
    if (category) {
      where.category = category;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    return await prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: { views: 'desc' }
    });
  }

  async getArticle(id: string) {
    const article = await prisma.knowledgeBaseArticle.findUnique({
      where: { id }
    });

    if (article) {
      // Increment view count
      await prisma.knowledgeBaseArticle.update({
        where: { id },
        data: { views: { increment: 1 } }
      });
    }

    return article;
  }

  async createArticle(title: string, content: string, category: string, tags: string[]) {
    return await prisma.knowledgeBaseArticle.create({
      data: {
        title,
        content,
        category,
        tags: tags.join(',')
      }
    });
  }

  async updateArticle(id: string, updates: any) {
    return await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: updates
    });
  }

  async deleteArticle(id: string) {
    return await prisma.knowledgeBaseArticle.delete({
      where: { id }
    });
  }

  async getCategories() {
    const articles = await prisma.knowledgeBaseArticle.findMany({
      where: { published: true },
      select: { category: true }
    });

    const categories = [...new Set(articles.map(a => a.category))];
    return categories;
  }

  async markHelpful(id: string) {
    return await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { helpful: { increment: 1 } }
    });
  }
}
