import db, { hashPassword, hashPasswordLegacy } from '@/lib/db';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Fetch user from DB (now fetching password_salt)
    const user = db.prepare('SELECT id, username, password_hash, password_salt, role, avatar_emoji, class_id FROM users WHERE username = ?')
      .get(cleanUsername) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 2. Validate password
    let isPasswordCorrect = false;
    if (user.password_salt) {
      // Salted path (new PBKDF2)
      const incomingHash = hashPassword(password, user.password_salt);
      isPasswordCorrect = user.password_hash === incomingHash;
    } else {
      // Legacy path (unsalted hash with hardcoded salt)
      const legacyHash = hashPasswordLegacy(password);
      isPasswordCorrect = user.password_hash === legacyHash;
      if (isPasswordCorrect) {
        // Upgrade legacy hash to new salted PBKDF2 hash immediately
        const newSalt = crypto.randomBytes(16).toString('hex');
        const newHash = hashPassword(password, newSalt);
        db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
          .run(newHash, newSalt, user.id);
      }
    }

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 3. Create and set session cookie
    const sessionToken = createSession({
      userId: user.id,
      username: user.username,
      role: user.role,
      avatarEmoji: user.avatar_emoji,
      classId: user.class_id,
    });

    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
