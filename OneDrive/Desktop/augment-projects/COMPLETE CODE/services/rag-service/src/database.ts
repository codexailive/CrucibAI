import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './vector';

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const index = pinecone.index(process.env.PINECONE_INDEX_NAME || 'rag-index');

interface DocumentMetadata {
  [key: string]: string;
  id: string;
  userId: string;
  title: string;
}

export async function upsertDocuments(docs: { id: string; text: string; metadata: DocumentMetadata }[]) {
  try {
    const vectors = await Promise.all(
      docs.map(async (doc) => {
        const embedding = await generateEmbedding(doc.text);
        return {
          id: doc.id,
          values: embedding,
          metadata: doc.metadata,
        };
      })
    );

  await index.upsert(vectors);
    console.log(`Upserted ${vectors.length} vectors`);
  } catch (error) {
    console.error('Error upserting documents:', error);
    throw error;
  }
}

export async function queryDocuments(queryText: string, userId: string, topK: number = 5): Promise<{ id: string; score: number; metadata: DocumentMetadata }[]> {
  try {
    const embedding = await generateEmbedding(queryText);
    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter: { userId: { $eq: userId } },
    });

    return (results.matches || []).map((match) => ({
      id: match.id,
      score: match.score!,
      metadata: {
        id: (match.metadata as any)?.id ?? '',
        userId: (match.metadata as any)?.userId ?? '',
        title: (match.metadata as any)?.title ?? '',
      },
    }));
  } catch (error) {
    console.error('Error querying documents:', error);
    throw error;
  }
}