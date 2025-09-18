import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';

export enum MemoryType {
  CODING_PATTERN = 'CODING_PATTERN',
  API_USAGE = 'API_USAGE',
  DEBUGGING_SOLUTION = 'DEBUGGING_SOLUTION',
  PROJECT_CONTEXT = 'PROJECT_CONTEXT',
  USER_PREFERENCE = 'USER_PREFERENCE',
  ERROR_RESOLUTION = 'ERROR_RESOLUTION',
  BEST_PRACTICE = 'BEST_PRACTICE',
  WORKFLOW = 'WORKFLOW'
}

export enum MemoryScope {
  USER = 'USER',           // Personal to the user
  PROJECT = 'PROJECT',     // Shared within project
  TEAM = 'TEAM',          // Shared within team
  GLOBAL = 'GLOBAL'       // Shared globally
}

export interface Memory {
  id: string;
  userId: string;
  projectId?: string;
  type: MemoryType;
  scope: MemoryScope;
  title: string;
  content: any;
  context: any;
  metadata: any;
  confidence: number;
  accessCount: number;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryQuery {
  userId: string;
  projectId?: string;
  types?: MemoryType[];
  scopes?: MemoryScope[];
  searchTerm?: string;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

export class PersistentMemoryBank extends EventEmitter {
  private prisma: PrismaClient;
  private memoryCache: Map<string, Memory> = new Map();
  private readonly CACHE_SIZE = 1000;

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  async storeMemory(
    userId: string,
    type: MemoryType,
    scope: MemoryScope,
    title: string,
    content: any,
    context: any = {},
    metadata: any = {}
  ): Promise<string> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    const memory: Memory = {
      id: memoryId,
      userId,
      projectId: context.projectId,
      type,
      scope,
      title,
      content,
      context,
      metadata,
      confidence: this.calculateConfidence(content, context),
      accessCount: 0,
      lastAccessedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store in cache
    this.addToCache(memory);

    // Store in database (mock for now - would use actual Prisma model)
    try {
      // In a real implementation, you'd have a Memory model in Prisma
      // await this.prisma.memory.create({ data: memory });
      
      // For now, store in audit log as a workaround
      await this.prisma.auditLogEntry.create({
        data: {
          eventId: `memory_${memoryId}`,
          action: 'memory_stored',
          userId,
          data: JSON.stringify({
            memoryId,
            type,
            scope,
            title,
            contentPreview: typeof content === 'string' ? content.substring(0, 100) : JSON.stringify(content).substring(0, 100)
          })
        }
      });
    } catch (error) {
      console.error('Failed to store memory in database:', error);
    }

    this.emit('memoryStored', {
      memoryId,
      userId,
      type,
      scope,
      title
    });

    return memoryId;
  }

  async retrieveMemories(query: MemoryQuery): Promise<Memory[]> {
    const memories: Memory[] = [];

    // Search in cache first
    for (const memory of this.memoryCache.values()) {
      if (this.matchesQuery(memory, query)) {
        memories.push(memory);
        // Update access count and timestamp
        memory.accessCount++;
        memory.lastAccessedAt = new Date();
      }
    }

    // Sort by relevance (confidence + recency + access count)
    memories.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });

    // Apply limit
    const limit = query.limit || 10;
    const result = memories.slice(query.offset || 0, (query.offset || 0) + limit);

    this.emit('memoriesRetrieved', {
      userId: query.userId,
      count: result.length,
      query
    });

    return result;
  }

  async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<boolean> {
    const memory = this.memoryCache.get(memoryId);
    if (!memory) {
      return false;
    }

    // Update memory
    Object.assign(memory, updates, { updatedAt: new Date() });

    // Recalculate confidence if content changed
    if (updates.content) {
      memory.confidence = this.calculateConfidence(memory.content, memory.context);
    }

    this.emit('memoryUpdated', {
      memoryId,
      userId: memory.userId,
      updates
    });

    return true;
  }

  async deleteMemory(memoryId: string): Promise<boolean> {
    const memory = this.memoryCache.get(memoryId);
    if (!memory) {
      return false;
    }

    this.memoryCache.delete(memoryId);

    this.emit('memoryDeleted', {
      memoryId,
      userId: memory.userId
    });

    return true;
  }

  async getMemoryStats(userId: string): Promise<{
    totalMemories: number;
    memoriesByType: { [key in MemoryType]?: number };
    memoriesByScope: { [key in MemoryScope]?: number };
    averageConfidence: number;
    mostAccessedMemories: Memory[];
  }> {
    const userMemories = Array.from(this.memoryCache.values())
      .filter(memory => memory.userId === userId);

    const memoriesByType: { [key in MemoryType]?: number } = {};
    const memoriesByScope: { [key in MemoryScope]?: number } = {};
    let totalConfidence = 0;

    for (const memory of userMemories) {
      memoriesByType[memory.type] = (memoriesByType[memory.type] || 0) + 1;
      memoriesByScope[memory.scope] = (memoriesByScope[memory.scope] || 0) + 1;
      totalConfidence += memory.confidence;
    }

    const mostAccessedMemories = userMemories
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5);

    return {
      totalMemories: userMemories.length,
      memoriesByType,
      memoriesByScope,
      averageConfidence: userMemories.length > 0 ? totalConfidence / userMemories.length : 0,
      mostAccessedMemories
    };
  }

  private calculateConfidence(content: any, context: any): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence based on content quality
    if (typeof content === 'string') {
      if (content.length > 100) confidence += 0.2;
      if (content.includes('function') || content.includes('class')) confidence += 0.1;
    } else if (typeof content === 'object' && content !== null) {
      const keys = Object.keys(content);
      if (keys.length > 3) confidence += 0.2;
    }

    // Increase confidence based on context richness
    if (context && typeof context === 'object') {
      const contextKeys = Object.keys(context);
      if (contextKeys.length > 2) confidence += 0.1;
      if (context.projectId) confidence += 0.1;
      if (context.tags && Array.isArray(context.tags)) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  private matchesQuery(memory: Memory, query: MemoryQuery): boolean {
    // Check user
    if (memory.userId !== query.userId && memory.scope === MemoryScope.USER) {
      return false;
    }

    // Check project
    if (query.projectId && memory.projectId !== query.projectId && memory.scope === MemoryScope.PROJECT) {
      return false;
    }

    // Check types
    if (query.types && !query.types.includes(memory.type)) {
      return false;
    }

    // Check scopes
    if (query.scopes && !query.scopes.includes(memory.scope)) {
      return false;
    }

    // Check minimum confidence
    if (query.minConfidence && memory.confidence < query.minConfidence) {
      return false;
    }

    // Check search term
    if (query.searchTerm) {
      const searchTerm = query.searchTerm.toLowerCase();
      const titleMatch = memory.title.toLowerCase().includes(searchTerm);
      const contentMatch = typeof memory.content === 'string' && 
                          memory.content.toLowerCase().includes(searchTerm);
      
      if (!titleMatch && !contentMatch) {
        return false;
      }
    }

    return true;
  }

  private calculateRelevanceScore(memory: Memory, query: MemoryQuery): number {
    let score = memory.confidence * 0.4; // Base score from confidence

    // Recency bonus (more recent = higher score)
    const daysSinceUpdate = (Date.now() - memory.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, (30 - daysSinceUpdate) / 30) * 0.3;

    // Access count bonus
    score += Math.min(memory.accessCount / 10, 1) * 0.2;

    // Exact type match bonus
    if (query.types && query.types.includes(memory.type)) {
      score += 0.1;
    }

    return score;
  }

  private addToCache(memory: Memory): void {
    // Remove oldest if cache is full
    if (this.memoryCache.size >= this.CACHE_SIZE) {
      const oldestKey = Array.from(this.memoryCache.keys())[0];
      this.memoryCache.delete(oldestKey);
    }

    this.memoryCache.set(memory.id, memory);
  }

  // Initialize with some sample memories for testing
  async initializeSampleMemories(userId: string): Promise<void> {
    const sampleMemories = [
      {
        type: MemoryType.CODING_PATTERN,
        scope: MemoryScope.USER,
        title: 'React Hook Pattern',
        content: 'const [state, setState] = useState(initialValue);',
        context: { language: 'typescript', framework: 'react' }
      },
      {
        type: MemoryType.API_USAGE,
        scope: MemoryScope.USER,
        title: 'Prisma Query Pattern',
        content: 'await prisma.user.findMany({ where: { active: true } })',
        context: { orm: 'prisma', database: 'postgresql' }
      },
      {
        type: MemoryType.DEBUGGING_SOLUTION,
        scope: MemoryScope.USER,
        title: 'TypeScript Import Error Fix',
        content: 'Add "esModuleInterop": true to tsconfig.json',
        context: { error: 'import_error', language: 'typescript' }
      }
    ];

    for (const sample of sampleMemories) {
      await this.storeMemory(
        userId,
        sample.type,
        sample.scope,
        sample.title,
        sample.content,
        sample.context
      );
    }
  }
}
