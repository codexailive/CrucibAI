import { describe, it, expect, vi, beforeEach } from 'vitest';
import { amplifyContext, retrieveRelevantDocs } from '../../../../services/ai/contextAmplifier';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client');
vi.mock('../../../../../../services/rag-service/src/database', () => ({
  queryDocuments: vi.fn(),
}));

const { PrismaClient: MockPrismaClient } = vi.mocked(require('@prisma/client'));
const { queryDocuments } = vi.mocked(require('../../../../../../services/rag-service/src/database'));

describe('Context Amplifier', () => {
  let mockPrismaInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaInstance = {
      document: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
    };
    MockPrismaClient.mockImplementation(() => mockPrismaInstance);
  });

  describe('amplifyContext', () => {
    it('should return original prompt if no user documents', async () => {
      mockPrismaInstance.document.findMany.mockResolvedValue([]);

      const result = await amplifyContext('user1', 'Test prompt');

      expect(result).toEqual({
        originalPrompt: 'Test prompt',
        amplifiedPrompt: 'Test prompt',
        contextAdded: [],
      });
      expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        select: { id: true, title: true, content: true },
      });
    });

    it('should amplify prompt with relevant documents', async () => {
      const mockDocs = [
        { id: 'doc1', title: 'Doc1', content: 'Content1' },
        { id: 'doc2', title: 'Doc2', content: 'Content2' },
      ];
      mockPrismaInstance.document.findMany.mockResolvedValueOnce(mockDocs); // for userDocs
      queryDocuments.mockResolvedValue([
        { id: 'doc1', score: 0.9, metadata: { title: 'Doc1' } },
        { id: 'doc2', score: 0.8, metadata: { title: 'Doc2' } },
      ]);
      mockPrismaInstance.document.findMany.mockResolvedValueOnce([
        { id: 'doc1', title: 'Doc1', content: 'Full Content1' },
        { id: 'doc2', title: 'Doc2', content: 'Full Content2' },
      ]); // for relevantDocs

      const result = await amplifyContext('user1', 'Test prompt');

      expect(queryDocuments).toHaveBeenCalledWith('Test prompt', 'user1', 3);
      expect(result.contextAdded).toEqual([
        'Doc1: Full Content1'.slice(0, 200) + '...',
        'Doc2: Full Content2'.slice(0, 200) + '...',
      ]);
      expect(result.amplifiedPrompt).toContain('Context from user documents');
      expect(result.amplifiedPrompt).toContain('Original prompt: Test prompt');
      expect(mockPrismaInstance.document.findMany).toHaveBeenCalledTimes(2);
    });

    it('should sort relevant docs by score and handle error gracefully', async () => {
      const mockDocs = [
        { id: 'doc1', title: 'Doc1', content: 'Content1' },
      ];
      mockPrismaInstance.document.findMany.mockResolvedValue(mockDocs);
      queryDocuments.mockResolvedValue([
        { id: 'doc1', score: 0.5, metadata: { title: 'Doc1' } },
      ]);
      mockPrismaInstance.document.findMany.mockRejectedValue(new Error('DB error'));

      const result = await amplifyContext('user1', 'Test prompt');

      expect(result).toEqual({
        originalPrompt: 'Test prompt',
        amplifiedPrompt: 'Test prompt',
        contextAdded: [],
      });
    });
  });

  describe('retrieveRelevantDocs', () => {
    it('should retrieve and sort relevant docs by score', async () => {
      const mockMatches = [
        { id: 'doc1', score: 0.9, metadata: { title: 'Doc1' } },
        { id: 'doc2', score: 0.8, metadata: { title: 'Doc2' } },
      ];
      queryDocuments.mockResolvedValue(mockMatches);

      const mockDocs = [
        { id: 'doc1', title: 'Doc1', content: 'Content1', userId: 'user1' },
        { id: 'doc2', title: 'Doc2', content: 'Content2', userId: 'user1' },
      ];
      mockPrismaInstance.document.findMany.mockResolvedValue(mockDocs);

      const result = await retrieveRelevantDocs('user1', 'Test query');

      expect(queryDocuments).toHaveBeenCalledWith('Test query', 'user1', 5);
      expect(result).toEqual([
        { id: 'doc1', title: 'Doc1', content: 'Content1', userId: 'user1' },
        { id: 'doc2', title: 'Doc2', content: 'Content2', userId: 'user1' },
      ]);
      expect(mockPrismaInstance.document.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['doc1', 'doc2'] } },
        select: { id: true, title: true, content: true, userId: true },
      });
    });

    it('should return empty array on error', async () => {
      queryDocuments.mockRejectedValue(new Error('RAG error'));

      const result = await retrieveRelevantDocs('user1', 'Test query');

      expect(result).toEqual([]);
    });
  });
});