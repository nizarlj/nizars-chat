import Redis, { RedisOptions } from 'ioredis';

// Singleton Redis client
let redisInstance: Redis | null = null;

interface RedisError extends Error {
  code?: string;
}

function createRedisClient(): Redis {
  if (redisInstance) {
    return redisInstance;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  // Automatically detect Upstash and apply TLS settings
  const isUpstash = redisUrl.includes('upstash');
  
  const redisOptions: RedisOptions = {
    // More robust connection settings for cloud environments
    maxRetriesPerRequest: 5,
    connectTimeout: 20000,
    commandTimeout: 10000,
    retryStrategy: (times: number) => {
      if (times > 5) {
        console.error('Redis: Exceeded max retries. Giving up.');
        return null; // Stop retrying
      }
      // Exponential backoff
      const delay = Math.min(times * 500, 3000);
      return delay;
    },
    enableOfflineQueue: true,
    keepAlive: 30000,
    // Fix for Upstash/Vercel environments
    family: 4, 
  };
  
  let finalUrl = redisUrl;

  if (isUpstash) {
    finalUrl = redisUrl.replace(/^redis:/, 'rediss:');
    redisOptions.tls = {
      rejectUnauthorized: false,
    };
    console.log('Upstash detected, enabling TLS...');
  }
  
  redisInstance = new Redis(finalUrl, redisOptions);

  // Handle Redis connection events
  let isConnected = false;

  redisInstance.on('error', (error: RedisError) => {
    // Avoid logging errors during reconnection attempts
    if (error.code !== 'ECONNRESET' || isConnected) {
      console.warn('Redis connection error:', error.message);
    }
  });

  redisInstance.on('connect', () => {
    if (!isConnected) {
      console.log('Redis connected successfully');
      isConnected = true;
    }
  });

  redisInstance.on('ready', () => {
    console.log('Redis ready for commands');
  });

  redisInstance.on('close', () => {
    if (isConnected) {
      console.log('Redis connection closed.');
      isConnected = false;
    }
  });

  redisInstance.on('reconnecting', (time: number) => {
    console.log(`Redis reconnecting in ${time}ms...`);
  });

  redisInstance.on('end', () => {
    console.log('Redis connection permanently ended.');
    isConnected = false;
  });

  return redisInstance;
}

const redis = createRedisClient();

// Graceful cleanup on process exit
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    try {
      if (redisInstance) {
        await redisInstance.disconnect();
      }
    } catch (error) {
      console.warn('Error during cleanup:', error);
    }
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

export default redis; 