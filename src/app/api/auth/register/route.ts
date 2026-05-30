import db, { hashPassword } from '@/lib/db';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 5 register attempts per 10 minutes
    const limiter = rateLimit(request, 'register', 5, 10 * 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limiter.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

    const { username, password, role, avatarEmoji, classId } = await request.json();

    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Username, password, and role are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // Validate username length and characters
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return NextResponse.json({ error: 'Username must be between 3 and 20 characters long' }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json({ error: 'Username must only contain alphanumeric characters and underscores' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

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

    const host = request.headers.get('host')?.split(':')[0] || '';
    const isIpOrLocalhost = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(host) || host === 'localhost';
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'https',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };
    if (!isIpOrLocalhost && host) {
      cookieOptions.domain = host;
    }

    response.cookies.set('session', sessionToken, cookieOptions);

    return response;
  } catch (error) {
    console.error('Registration failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
