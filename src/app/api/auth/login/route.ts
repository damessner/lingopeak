import db, { hashPassword } from '@/lib/db';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();

    // 1. Fetch user from DB
    const user = db.prepare('SELECT id, username, password_hash, role, avatar_emoji, class_id FROM users WHERE username = ?')
      .get(cleanUsername) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 2. Validate password
    const incomingHash = hashPassword(password);
    if (user.password_hash !== incomingHash) {
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
