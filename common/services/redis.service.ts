import Redis from 'ioredis';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
    });
  }

  async get(key: string): Promise<string | null> {
    console.log(`Getting key: ${key}`);
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl: number): Promise<void> {
    console.log(`Setting key: ${key}, value: ${value}, ttl: ${ttl}`);
    await this.client.set(key, value, 'EX', ttl);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }
}