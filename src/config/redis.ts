import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

// Create Redis client
export const redisClient: RedisClientType = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD || undefined,
  database: parseInt(process.env.REDIS_DB || '0')
});

// Redis connection events
redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
  logger.info('Redis client disconnected');
});

// Connect to Redis
export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

// Disconnect from Redis
export const disconnectRedis = async (): Promise<void> => {
  try {
    await redisClient.quit();
    logger.info('Disconnected from Redis successfully');
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
    throw error;
  }
};

// Redis Cache helper functions
export class RedisCache {
  private static keyPrefix = 'hotel:';

  // Set cache with TTL
  static async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(`${this.keyPrefix}${key}`, ttl, serializedValue);
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      throw error;
    }
  }

  // Get cache value
  static async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redisClient.get(`${this.keyPrefix}${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  // Delete cache key
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(`${this.keyPrefix}${key}`);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      throw error;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const exists = await redisClient.exists(`${this.keyPrefix}${key}`);
      return exists === 1;
    } catch (error) {
      logger.error(`Error checking existence for key ${key}:`, error);
      return false;
    }
  }

  // Set with no expiration
  static async setPersistent(key: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await redisClient.set(`${this.keyPrefix}${key}`, serializedValue);
    } catch (error) {
      logger.error(`Error setting persistent cache for key ${key}:`, error);
      throw error;
    }
  }

  // Get all keys matching pattern
  static async getKeys(pattern: string): Promise<string[]> {
    try {
      const keys = await redisClient.keys(`${this.keyPrefix}${pattern}`);
      return keys.map(key => key.replace(this.keyPrefix, ''));
    } catch (error) {
      logger.error(`Error getting keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  // Clear all cache with prefix
  static async clearAll(): Promise<void> {
    try {
      const keys = await redisClient.keys(`${this.keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Error clearing all cache:', error);
      throw error;
    }
  }
}
