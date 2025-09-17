import OpenAI from 'openai';

export class OpenAIService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
      console.warn('OpenAI API key not configured, using mock responses');
      this.client = null as any;
    } else {
      this.client = new OpenAI({
        apiKey: apiKey,
      });
    }
  }

  async generateText(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    userId?: string;
  } = {}): Promise<{
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    model: string;
  }> {
    if (!this.client) {
      // Mock response when API key is not configured
      return {
        content: `Mock AI response for: "${prompt.substring(0, 50)}..."`,
        usage: {
          promptTokens: Math.floor(prompt.length / 4),
          completionTokens: 50,
          totalTokens: Math.floor(prompt.length / 4) + 50
        },
        model: options.model || 'gpt-3.5-turbo'
      };
    }

    try {
      const response = await this.client.chat.completions.create({
        model: options.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        user: options.userId
      });

      const choice = response.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      return {
        content: choice.message.content || '',
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        model: response.model
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateImage(prompt: string, options: {
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    userId?: string;
  } = {}): Promise<{
    url: string;
    revisedPrompt?: string;
  }> {
    if (!this.client) {
      // Mock response when API key is not configured
      return {
        url: `https://via.placeholder.com/${options.size?.replace('x', 'x') || '1024x1024'}/0066CC/FFFFFF?text=Mock+AI+Image`,
        revisedPrompt: `Mock revised prompt for: ${prompt}`
      };
    }

    try {
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'vivid',
        n: 1,
        user: options.userId
      });

      const image = response.data?.[0];
      if (!image || !image.url) {
        throw new Error('No image generated');
      }

      return {
        url: image.url,
        revisedPrompt: image.revised_prompt
      };
    } catch (error) {
      console.error('OpenAI Image API error:', error);
      throw new Error(`OpenAI Image API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    model?: string;
    language?: string;
    prompt?: string;
    userId?: string;
  } = {}): Promise<{
    text: string;
    language?: string;
  }> {
    if (!this.client) {
      // Mock response when API key is not configured
      return {
        text: 'Mock transcription: This is a sample transcribed text from the audio file.',
        language: options.language || 'en'
      };
    }

    try {
      // Create a File-like object from the buffer
      const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

      const response = await this.client.audio.transcriptions.create({
        file: file,
        model: options.model || 'whisper-1',
        language: options.language,
        prompt: options.prompt,
        // user: options.userId // Not supported in transcription API
      });

      return {
        text: response.text,
        language: options.language
      };
    } catch (error) {
      console.error('OpenAI Transcription API error:', error);
      throw new Error(`OpenAI Transcription API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateSpeech(text: string, options: {
    model?: 'tts-1' | 'tts-1-hd';
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
    userId?: string;
  } = {}): Promise<Buffer> {
    if (!this.client) {
      // Mock response when API key is not configured
      return Buffer.from('Mock audio data - this would be actual audio in production');
    }

    try {
      const response = await this.client.audio.speech.create({
        model: options.model || 'tts-1',
        voice: options.voice || 'alloy',
        input: text,
        speed: options.speed || 1.0,
        // user: options.userId // Not supported in speech API
      });

      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error('OpenAI Speech API error:', error);
      throw new Error(`OpenAI Speech API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEmbedding(text: string, options: {
    model?: string;
    userId?: string;
  } = {}): Promise<{
    embedding: number[];
    usage: {
      promptTokens: number;
      totalTokens: number;
    };
  }> {
    if (!this.client) {
      // Mock response when API key is not configured
      const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() - 0.5);
      return {
        embedding: mockEmbedding,
        usage: {
          promptTokens: Math.floor(text.length / 4),
          totalTokens: Math.floor(text.length / 4)
        }
      };
    }

    try {
      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-ada-002',
        input: text,
        user: options.userId
      });

      const embedding = response.data[0];
      if (!embedding) {
        throw new Error('No embedding generated');
      }

      return {
        embedding: embedding.embedding,
        usage: {
          promptTokens: response.usage.prompt_tokens,
          totalTokens: response.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('OpenAI Embedding API error:', error);
      throw new Error(`OpenAI Embedding API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check if the service is properly configured
  isConfigured(): boolean {
    return !!this.client;
  }

  // Get available models (mock for now)
  async getAvailableModels(): Promise<string[]> {
    if (!this.client) {
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    }

    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    }
  }
}

export default new OpenAIService();
