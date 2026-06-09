import crypto from 'crypto';
import { SESSION_SECRET } from '@/lib/env';

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE_MS;
}

export interface UserSession {
  userId: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PENDING_TEACHER';
  avatarEmoji: string;
  classId: string | null;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Creates a signed session token.
 */
export function createSession(data: Omit<UserSession, 'expiresAt'>): string {
  const session: UserSession = {
    ...data,
    expiresAt: Date.now() + SESSION_MAX_AGE_MS,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verifies a signed session token and returns the session payload, or null if invalid or expired.
 */
export function verifySession(sessionStr: string): UserSession | null {
  if (!sessionStr) return null;
  const parts = sessionStr.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (signature !== expectedSignature) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as UserSession;
    // Reject expired sessions (unless they lack an expiresAt from pre-upgrade tokens — allow gracefully)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}
