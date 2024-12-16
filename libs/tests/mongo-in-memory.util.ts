import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

export class MongoInMemory {
  private static mongoServer: MongoMemoryServer;

  static async connect(): Promise<void> {
    this.mongoServer = await MongoMemoryServer.create();
    const uri = await this.mongoServer.getUri();
    await mongoose.connect(uri);
  }

  static getUri(): string {
    return this.mongoServer.getUri();
  }

  static async close(): Promise<void> {
    await mongoose.disconnect();
    await this.mongoServer.stop();
  }

  static async clear(): Promise<void> {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}