import { EventEmitter } from 'events';

export interface ModelProvider {
  id: string;
  name: string;
  apiKey?: string;
  baseUrl?: string;
  models: string[];
}

export interface ModelRequest {
  userId: string;
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface ModelResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
}

export class ModelFlexibilityHub extends EventEmitter {
  private providers: Map<string, ModelProvider> = new Map();
  private userKeys: Map<string, Map<string, string>> = new Map(); // userId -> providerId -> apiKey

  constructor() {
    super();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize default providers
    this.providers.set('openai', {
      id: 'openai',
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
    });

    this.providers.set('anthropic', {
      id: 'anthropic',
      name: 'Anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
    });

    this.providers.set('groq', {
      id: 'groq',
      name: 'Groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      models: ['llama2-70b-4096', 'mixtral-8x7b-32768']
    });
  }

  async setUserApiKey(userId: string, providerId: string, apiKey: string): Promise<void> {
    if (!this.userKeys.has(userId)) {
      this.userKeys.set(userId, new Map());
    }
    this.userKeys.get(userId)!.set(providerId, apiKey);
    this.emit('userKeySet', { userId, providerId });
  }

  async getUserApiKey(userId: string, providerId: string): Promise<string | undefined> {
    return this.userKeys.get(userId)?.get(providerId);
  }

  async callModel(request: ModelRequest): Promise<ModelResponse> {
    const providerId = this.getProviderForModel(request.model);
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider not found for model: ${request.model}`);
    }

    // Check for user's API key first
    const userKey = await this.getUserApiKey(request.userId, providerId);
    const apiKey = userKey || provider.apiKey || process.env[`${providerId.toUpperCase()}_API_KEY`];

    if (!apiKey) {
      throw new Error(`No API key available for provider: ${providerId}`);
    }

    // Mock response for now - in production, make actual API calls
    const mockResponse: ModelResponse = {
      content: `Mock response from ${request.model} for prompt: ${request.prompt.substring(0, 50)}...`,
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: 100,
        totalTokens: Math.floor(request.prompt.length / 4) + 100
      },
      model: request.model,
      provider: providerId
    };

    this.emit('modelCalled', {
      userId: request.userId,
      model: request.model,
      provider: providerId,
      tokens: mockResponse.usage.totalTokens
    });

    return mockResponse;
  }

  private getProviderForModel(model: string): string {
    for (const [providerId, provider] of this.providers) {
      if (provider.models.includes(model)) {
        return providerId;
      }
    }
    throw new Error(`No provider found for model: ${model}`);
  }

  getAvailableModels(userId?: string): { [providerId: string]: string[] } {
    const result: { [providerId: string]: string[] } = {};
    
    for (const [providerId, provider] of this.providers) {
      // Only include models if user has API key or provider has default key
      const hasKey = userId ? this.userKeys.get(userId)?.has(providerId) : false;
      const hasDefaultKey = provider.apiKey || process.env[`${providerId.toUpperCase()}_API_KEY`];
      
      if (hasKey || hasDefaultKey) {
        result[providerId] = provider.models;
      }
    }
    
    return result;
  }

  getProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }
}
