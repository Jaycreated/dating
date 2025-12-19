import { v4 as uuidv4 } from 'uuid';
import { redisClient } from '../config/redis';

interface OneTimeSession {
  userId: string;
  token: string;
  expiresAt: Date;
}

const SESSION_TTL = 300; // 5 minutes in seconds

/**
 * Creates a one-time session for web authentication
 * @param userId - The ID of the user to create a session for
 * @returns The session token
 */
export const createOneTimeSession = async (userId: string): Promise<string> => {
  const token = uuidv4();
  const session: OneTimeSession = {
    userId,
    token,
    expiresAt: new Date(Date.now() + SESSION_TTL * 1000)
  };

  // Store session in Redis with TTL
  await redisClient.set(`onetime:${token}`, JSON.stringify(session), {
    EX: SESSION_TTL,
    NX: true
  });

  return token;
};

/**
 * Consumes a one-time session token and returns the user ID if valid
 * @param token - The one-time session token
 * @returns The user ID if the token is valid, null otherwise
 */
export const consumeOneTimeSession = async (token: string): Promise<string | null> => {
  const sessionKey = `onetime:${token}`;
  const sessionString = await redisClient.get(sessionKey);
  
  if (!sessionString) {
    return null;
  }

  // Delete the token so it can't be used again
  await redisClient.del(sessionKey);
  
  try {
    const session = JSON.parse(sessionString) as OneTimeSession;
    return session.userId;
  } catch (error) {
    console.error('Error parsing session data:', error);
    return null;
  }
};
