import { PrismaClient } from '@prisma/client';
import SelfReflectiveRAG from './rag/SelfReflectiveRAG';
// Update the import path if the file is in a different location or has a different name
import { PersistentMemoryBank, MemoryType, MemoryScope } from './persistentMemoryBank';

const prisma = new PrismaClient();
const memoryBank = new PersistentMemoryBank();

export async function amplifyContext(userId: string, prompt: string, options: {
  includeMemory?: boolean;
  includeDocuments?: boolean;
  includeCompliance?: boolean;
  projectId?: string;
} = {}) {
  try {
    let amplifiedPrompt = prompt;
    const contextAdded: string[] = [];

    // Add memory context
    if (options.includeMemory !== false) {
      const memories = await memoryBank.retrieveMemories({
        userId,
        projectId: options.projectId,
        types: [MemoryType.CODING_PATTERN, MemoryType.API_USAGE, MemoryType.DEBUGGING_SOLUTION],
        scopes: [MemoryScope.USER, MemoryScope.PROJECT],
        minConfidence: 0.7,
        limit: 5
      });

      if (memories.length > 0) {
        const memoryContext = memories.map((m: { title: string; content: any }) => `${m.title}: ${JSON.stringify(m.content)}`).join('\n');
        amplifiedPrompt = `Context from previous work:\n${memoryContext}\n\nCurrent request:\n${prompt}`;
        contextAdded.push(`Added ${memories.length} memory entries`);
      }
    }

    // Add document context
    if (options.includeDocuments !== false) {
      const relevantDocs = await retrieveRelevantDocs(userId, prompt, 3);
      if (relevantDocs.length > 0) {
        const docContext = relevantDocs.map((doc: { content: string }) => doc.content).join('\n');
        amplifiedPrompt = `Relevant documentation:\n${docContext}\n\n${amplifiedPrompt}`;
        contextAdded.push(`Added ${relevantDocs.length} document references`);
      }
    }

    // Add compliance context
    if (options.includeCompliance) {
      const complianceMemories = await memoryBank.retrieveMemories({
        userId,
        types: [MemoryType.COMPLIANCE_DECISION],
        scopes: [MemoryScope.TEAM, MemoryScope.GLOBAL],
        minConfidence: 0.8,
        limit: 3
      });

      if (complianceMemories.length > 0) {
        const complianceContext = complianceMemories.map((m: { title: string; content: any }) =>
          `Compliance rule: ${m.title} - ${JSON.stringify(m.content)}`
        ).join('\n');
        amplifiedPrompt = `Compliance requirements:\n${complianceContext}\n\n${amplifiedPrompt}`;
        contextAdded.push(`Added ${complianceMemories.length} compliance rules`);
      }
    }

    return {
      originalPrompt: prompt,
      amplifiedPrompt,
      contextAdded,
    };
  } catch (error) {
    console.error('Error amplifying context:', error);
    return {
      originalPrompt: prompt,
      amplifiedPrompt: prompt,
      contextAdded: ['Error retrieving context'],
    };
  }
}

export async function retrieveRelevantDocs(userId: string, query: string, topK: number = 5) {
  try {
    // Query documents from database
    const documents = await prisma.document.findMany({
      where: { userId },
      take: topK,
      orderBy: { createdAt: 'desc' }
    });

    return documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content || '',
      type: doc.type,
      createdAt: doc.createdAt
    }));
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
}