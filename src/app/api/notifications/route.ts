import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');
  if (!session) return null;
  return session;
}

export async function GET() {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const alerts = db.prepare(`
      SELECT id, title, message, read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(session.userId) as any[];

    return NextResponse.json({ success: true, notifications: alerts });
  } catch (err: any) {
    console.error('Fetch notifications error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, all } = await req.json() as { id?: string; all?: boolean };

    if (all) {
      db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?')
        .run(session.userId);
    } else if (id) {
      db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?')
        .run(session.userId, id);
    } else {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Mark notification error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
