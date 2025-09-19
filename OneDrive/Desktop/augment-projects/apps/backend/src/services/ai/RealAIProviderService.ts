import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { HfInference } from '@huggingface/inference';
import { PrismaClient } from '@prisma/client';
import { CohereClient } from 'cohere-ai';
import OpenAI from 'openai';
import Replicate from 'replicate';

const prisma = new PrismaClient();

export interface AIProvider {
  name: string;
  models: string[];
  costPerToken: number;
  maxTokens: number;
  supportsStreaming: boolean;
}

export class RealAIProviderService {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private google: GoogleGenerativeAI;
  private huggingface: HfInference;
  private cohere: CohereClient;
  private replicate: Replicate;

  private providers: Map<string, AIProvider> = new Map();

  constructor() {
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Initialize Anthropic
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Initialize Google AI
    this.google = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

    // Initialize Hugging Face
    this.huggingface = new HfInference(process.env.HUGGINGFACE_API_KEY);

    // Initialize Cohere
    this.cohere = new CohereClient({
      token: process.env.COHERE_API_KEY
    });

    // Initialize Replicate
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN
    });

    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.providers.set('openai', {
      name: 'OpenAI',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'dall-e-3'],
      costPerToken: 0.00003,
      maxTokens: 128000,
      supportsStreaming: true
    });

    this.providers.set('anthropic', {
      name: 'Anthropic',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      costPerToken: 0.000015,
      maxTokens: 200000,
      supportsStreaming: true
    });

    this.providers.set('google', {
      name: 'Google',
      models: ['gemini-pro', 'gemini-pro-vision'],
      costPerToken: 0.0000005,
      maxTokens: 32000,
      supportsStreaming: true
    });

    this.providers.set('huggingface', {
      name: 'Hugging Face',
      models: ['microsoft/DialoGPT-large', 'facebook/blenderbot-400M-distill'],
      costPerToken: 0.000001,
      maxTokens: 4096,
      supportsStreaming: false
    });

    this.providers.set('cohere', {
      name: 'Cohere',
      models: ['command', 'command-light', 'command-nightly'],
      costPerToken: 0.000015,
      maxTokens: 4096,
      supportsStreaming: true
    });

    this.providers.set('replicate', {
      name: 'Replicate',
      models: ['meta/llama-2-70b-chat', 'stability-ai/stable-diffusion'],
      costPerToken: 0.00065,
      maxTokens: 4096,
      supportsStreaming: false
    });
  }

  async generateText(
    provider: string,
    model: string,
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
      stream?: boolean;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      const startTime = Date.now();
      let response: string = '';
      let tokensUsed = 0;

      switch (provider) {
        case 'openai':
          const openaiResponse = await this.openai.chat.completions.create({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            stream: options.stream || false
          });
          
          if ('choices' in openaiResponse) {
            response = openaiResponse.choices[0]?.message?.content || '';
            tokensUsed = openaiResponse.usage?.total_tokens || 0;
          }
          break;

        case 'anthropic':
          const anthropicResponse = await this.anthropic.messages.create({
            model,
            max_tokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7,
            messages: [{ role: 'user', content: prompt }]
          });
          
          response = anthropicResponse.content[0]?.type === 'text' 
            ? anthropicResponse.content[0].text 
            : '';
          tokensUsed = anthropicResponse.usage.input_tokens + anthropicResponse.usage.output_tokens;
          break;

        case 'google':
          const googleModel = this.google.getGenerativeModel({ model });
          const googleResponse = await googleModel.generateContent(prompt);
          response = googleResponse.response.text();
          tokensUsed = 100; // Estimate, Google doesn't provide exact token count
          break;

        case 'cohere':
          const cohereResponse = await this.cohere.generate({
            model,
            prompt,
            maxTokens: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
          });
          response = cohereResponse.generations[0]?.text || '';
          tokensUsed = cohereResponse.meta?.billedUnits?.inputTokens || 0;
          break;

        case 'replicate':
          const replicateResponse = await this.replicate.run(model as any, {
            input: { prompt }
          });
          response = Array.isArray(replicateResponse) 
            ? replicateResponse.join('') 
            : String(replicateResponse);
          tokensUsed = 100; // Estimate
          break;

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }

      // Track usage
      if (options.userId) {
        await this.trackUsage(options.userId, provider, model, tokensUsed, Date.now() - startTime);
      }

      return response;
    } catch (error) {
      console.error(`Error with ${provider} ${model}:`, error);
      throw new Error(`Failed to generate text with ${provider}`);
    }
  }

  async generateImage(
    provider: string,
    model: string,
    prompt: string,
    options: {
      size?: string;
      quality?: string;
      userId?: string;
    } = {}
  ): Promise<string> {
    try {
      const startTime = Date.now();
      let imageUrl = '';

      switch (provider) {
        case 'openai':
          if (model === 'dall-e-3') {
            const response = await this.openai.images.generate({
              model: 'dall-e-3',
              prompt,
              size: (options.size as any) || '1024x1024',
              quality: (options.quality as any) || 'standard',
              n: 1
            });
            imageUrl = response.data?.[0]?.url || '';
          }
          break;

        case 'replicate':
          if (model.includes('stable-diffusion')) {
            const response = await this.replicate.run(model as any, {
              input: { prompt }
            });
            imageUrl = Array.isArray(response) ? response[0] : String(response);
          }
          break;

        default:
          throw new Error(`Image generation not supported for provider: ${provider}`);
      }

      // Track usage
      if (options.userId) {
        await this.trackUsage(options.userId, provider, model, 1, Date.now() - startTime);
      }

      return imageUrl;
    } catch (error) {
      console.error(`Error generating image with ${provider}:`, error);
      throw new Error(`Failed to generate image with ${provider}`);
    }
  }

  async getOptimalProvider(
    task: 'text' | 'image' | 'code',
    requirements: {
      maxCost?: number;
      minQuality?: number;
      needsStreaming?: boolean;
    } = {}
  ): Promise<{ provider: string; model: string; estimatedCost: number }> {
    const candidates = [];

    for (const [providerName, provider] of this.providers) {
      if (requirements.maxCost && provider.costPerToken > requirements.maxCost) {
        continue;
      }

      if (requirements.needsStreaming && !provider.supportsStreaming) {
        continue;
      }

      // Simple scoring based on cost and capabilities
      let score = 1 / provider.costPerToken; // Lower cost = higher score
      
      if (task === 'image' && !provider.models.some(m => m.includes('dall-e') || m.includes('stable-diffusion'))) {
        continue;
      }

      candidates.push({
        provider: providerName,
        model: provider.models[0], // Use first model as default
        estimatedCost: provider.costPerToken * 1000, // Estimate for 1000 tokens
        score
      });
    }

    if (candidates.length === 0) {
      throw new Error('No suitable provider found for requirements');
    }

    // Sort by score (highest first)
    candidates.sort((a, b) => b.score - a.score);

    return candidates[0];
  }

  private async trackUsage(
    userId: string,
    provider: string,
    model: string,
    tokensUsed: number,
    responseTime: number
  ): Promise<void> {
    try {
      const providerInfo = this.providers.get(provider);
      const cost = providerInfo ? tokensUsed * providerInfo.costPerToken : 0;

      await prisma.usageTracking.create({
        data: {
          userId,
          month: new Date().toISOString().slice(0, 7), // YYYY-MM format
          service: 'ai_text_generation',
          provider,
          type: 'text',
          amount: tokensUsed,
          cost,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  getProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  getProviderModels(provider: string): string[] {
    const providerInfo = this.providers.get(provider);
    return providerInfo ? providerInfo.models : [];
  }
}
