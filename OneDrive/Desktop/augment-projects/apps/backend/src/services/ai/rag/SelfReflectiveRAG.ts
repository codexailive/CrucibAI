import { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
const logger = console;

interface SelfReflectiveRAGOptions {
  baseRetriever: any; // LangChain retriever
  maxReflections: number;
  relevanceThreshold: number;
}

class SelfReflectiveRAG {
  private llm: ChatOpenAI;
  private baseRetriever: any;
  private maxReflections: number;
  private relevanceThreshold: number;
  private gradePrompt: PromptTemplate;
  private rerankPrompt: PromptTemplate;

  constructor(options: SelfReflectiveRAGOptions) {
    this.llm = new ChatOpenAI({
      model: 'gpt-4',
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0,
    });
    this.baseRetriever = options.baseRetriever;
    this.maxReflections = options.maxReflections || 3;
    this.relevanceThreshold = options.relevanceThreshold || 0.7;

    this.gradePrompt = new PromptTemplate({
      inputVariables: ['question', 'document'],
      template: `Grade the relevance of the following document to the question on a scale of 0-1.
Question: {question}
Document: {document}
Only respond with the score.`,
    });

    this.rerankPrompt = new PromptTemplate({
      inputVariables: ['question', 'documents'],
      template: `Rerank these documents by relevance to the question: {question}
Documents: {documents}
Respond with the top 3 documents separated by ---.`,
    });
  }

  async retrieve(query: string): Promise<Document[]> {
    let docs = await this.baseRetriever.getRelevantDocuments(query);
    let reflectionCount = 0;

    while (reflectionCount < this.maxReflections) {
      const chain = RunnableSequence.from([
        ({ question, document }: { question: string; document: string }) => this.gradePrompt.format({ question, document }),
        this.llm,
        new StringOutputParser(),
      ]);

      const scores = await Promise.all(
        docs.map((doc: Document) =>
          chain.invoke({ question: query, document: doc.pageContent }).then((rawScore: unknown) => {
            const cleaned = String(rawScore).replace(/[^0-9.-]/g, '');
            return parseFloat(cleaned) || 0;
          })
        )
      );

      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

      if (avgScore > this.relevanceThreshold) {
        logger.info(
          `SelfReflectiveRAG: High relevance (${avgScore}), returning ${docs.length} docs`
        );
        return docs;
      }

      // Rerank
      const rerankChain = RunnableSequence.from([
        ({ question, documents }) => this.rerankPrompt.format({ question, documents }),
        this.llm,
        new StringOutputParser(),
      ]);

      const rerankedText = await rerankChain.invoke({
        question: query,
        documents: docs.map((d: Document) => d.pageContent).join('\n\n'),
      });

      docs = rerankedText
        .split('---')
        .filter(text => text.trim().length > 0)
        .slice(0, 3)
        .map(text => new Document({ pageContent: text.trim() }));

      reflectionCount++;
      logger.warn(`SelfReflectiveRAG: Reflection ${reflectionCount}, low relevance, reranked`);
    }

    // Fallback to web search if needed (mock for now, integrate Tavily later)
    if (reflectionCount >= this.maxReflections) {
      logger.warn('SelfReflectiveRAG: Max reflections reached, using fallback');
      // TODO: Integrate TavilySearchResults
      docs = [new Document({ pageContent: 'Fallback web search result.' })];
    }

    return docs;
  }
}

export default SelfReflectiveRAG;
