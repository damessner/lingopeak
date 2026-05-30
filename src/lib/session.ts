import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'lingopeak_secret_default_key_change_me_12345';

export interface UserSession {
  userId: string;
  username: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'PENDING_TEACHER';
  avatarEmoji: string;
  classId: string | null;
}

/**
 * Creates a signed session token.
 */
export function createSession(data: UserSession): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

/**
 * Verifies a signed session token and returns the session payload, or null if invalid.
 */
export function verifySession(sessionStr: string): UserSession | null {
  if (!sessionStr) return null;
  const parts = sessionStr.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  if (signature !== expectedSignature) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf8')) as UserSession;
  } catch (e) {
    return null;
  }
}
