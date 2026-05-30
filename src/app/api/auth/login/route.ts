import db, { hashPassword } from '@/lib/db';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting: 5 login requests per 1 minute
    const limiter = rateLimit(request, 'login', 5, 60 * 1000);
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((limiter.reset - Date.now()) / 1000).toString()
          }
        }
      );
    }

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
    if (user.password_salt === 'RESET_REQUIRED') {
      return NextResponse.json(
        { error: 'Security Upgrade Required: Please contact a teacher or administrator to reset your password.' },
        { status: 403 }
      );
    }

    let isPasswordCorrect = false;
    if (user.password_salt) {
      // Salted path (new PBKDF2)
      const incomingHash = hashPassword(password, user.password_salt);
      isPasswordCorrect = user.password_hash === incomingHash;
    } else {
      // Fallback if password_salt is null/missing (which is now blocked)
      return NextResponse.json(
        { error: 'Security Upgrade Required: Please contact a teacher or administrator to reset your password.' },
        { status: 403 }
      );
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
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
