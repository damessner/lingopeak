import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession, createSession } from '@/lib/session';
import db from '@/lib/db';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { avatarEmoji } = await req.json() as { avatarEmoji: string };

    if (!avatarEmoji) {
      return NextResponse.json({ error: 'Avatar is required' }, { status: 400 });
    }

    // 1. Update database
    db.prepare('UPDATE users SET avatar_emoji = ? WHERE id = ?')
      .run(avatarEmoji, session.userId);

    // 2. Regenerate session cookie with updated avatar
    const updatedSession = {
      ...session,
      avatarEmoji
    };
    const newToken = createSession(updatedSession);

    // Write updated session cookie back
    cookieStore.set('session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      success: true,
      avatarEmoji
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
