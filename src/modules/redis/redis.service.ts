import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_DB_NAME } from 'src/config/constants';

@Injectable()
export class RedisService {

    private readonly redisClient: Redis;
    constructor(){
        this.redisClient = new Redis({
            host: 'localhost',
            port: 6379,
            password: "ASD67adkjad76788ASD",
            name: REDIS_DB_NAME,
            db: Number(process.env.REDIS_DB)
          });
    }

    async setex(key: string, value: string, expiresInSeconds: number): Promise<void> {
        await this.redisClient.setex(key, expiresInSeconds, value);
      }

      async set(key: string, value: string): Promise<void> {
        await this.redisClient.set(key, value);
      }
    
      async get(key: string): Promise<string | null> {
        return await this.redisClient.get(key);
      }
    
      async del(key: string): Promise<void> {
        await this.redisClient.del(key);
      }
}
