import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Decide Redis URL based on environment
const REDIS_URL = isProduction
  ? process.env.REDIS_URL // Render injects this
  : 'redis://127.0.0.1:6379';

// Create Redis client
export const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('❌ Too many Redis retries. Connection terminated.');
        return new Error('Redis connection failed after max retries');
      }
      return Math.min(retries * 100, 5000);
    },
  },
});

// Event listeners
redisClient.on('connect', () => {
  console.log('✅ Redis client connected');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err.message);
});

// Connect on startup
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('⚠️ Failed to connect to Redis');

    // In production, Redis is required → crash
    if (isProduction) {
      process.exit(1);
    }

    // In development, continue without Redis
    console.warn('⚠️ Continuing without Redis (development mode)');
  }
})();
