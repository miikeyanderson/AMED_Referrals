
import { createClient } from 'redis';
import logger from './logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => {
  logger.error('Redis Client Error', { error: err });
});

redisClient.on('connect', () => {
  logger.info('Redis Client Connected');
});

export async function connectRedis() {
  try {
    await redisClient.connect();
  } catch (error) {
    logger.error('Redis Connection Error', { error });
  }
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error('Redis Get Error', { error, key });
    return null;
  }
}

export async function setCachedData(key: string, data: any, ttl = 300): Promise<void> {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(data));
  } catch (error) {
    logger.error('Redis Set Error', { error, key });
  }
}

export async function clearCache(pattern: string): Promise<void> {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.error('Redis Clear Cache Error', { error, pattern });
  }
}

export default redisClient;
