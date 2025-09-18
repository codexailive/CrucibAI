import Redis, { Cluster } from 'ioredis';
export class RedisService {
  private client: Cluster;

  constructor() {
    this.client = new Redis.Cluster([
      'redis-0.redis:6379',
      'redis-1.redis:6379',
      'redis-2.redis:6379'
    ]);
  }

  async connect() {
    await this.client.connect();
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await this.client.set(key, value, 'EX', ttl);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<any> {
    return (await this.client.get(key as any)) as any;
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hset(key: string, field: string, value: string) {
    await this.client.hset(key, field, value);
  }

  async cacheAIResponse(userId: string, taskId: string, response: any, ttl = 300) {
    const key = `${userId}:${taskId}`;
    await this.set(key, JSON.stringify(response), ttl);
    // Cache set after AI execution, credits already consumed
  }

  async getAICache(userId: string, taskId: string): Promise<any> {
    const key = `${userId}:${taskId}`;
    const data = await this.get(key);
    if (data) {
      console.log(`Cache hit for ${key}, no credits consumed, compliant with usage policy`);
      return JSON.parse(data);
    }
    return null;
  }

  async disconnect() {
    await this.client.quit();
  }
}
