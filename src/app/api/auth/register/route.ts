import db, { hashPassword } from '@/lib/db';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { username, password, role, avatarEmoji, classId } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE username = ?').get(cleanUsername);
    if (existingUser) {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
    }

    // 2. Hash password and generate UUID
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const userId = crypto.randomUUID();
    const finalRole = role === 'TEACHER' ? 'PENDING_TEACHER' : 'STUDENT';

    // Wait, if it is student, classId is required. Emojis can be default if missing.
    const finalEmoji = avatarEmoji || '🎒';
    const finalClassId = role === 'TEACHER' ? null : classId;

    if (role === 'STUDENT' && !finalClassId) {
      return NextResponse.json({ error: 'Class selection is required for students' }, { status: 400 });
    }

    // 3. Save to database (now including password_salt)
    db.prepare('INSERT INTO users (id, username, password_hash, password_salt, role, avatar_emoji, class_id) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(userId, cleanUsername, passwordHash, salt, finalRole, finalEmoji, finalClassId);

    // 4. Create and set session cookie
    const sessionToken = createSession({
      userId,
      username: cleanUsername,
      role: finalRole,
      avatarEmoji: finalEmoji,
      classId: finalClassId,
    });

    const response = NextResponse.json({ success: true, role: finalRole });
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
