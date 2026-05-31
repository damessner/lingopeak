import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, classId } = await req.json() as { userId: string; classId: string | null };

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists and check role
    const targetUser = db.prepare('SELECT id, role, username FROM users WHERE id = ?').get(userId) as any;
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update class assignment in database
    db.prepare('UPDATE users SET class_id = ? WHERE id = ?').run(classId || null, userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        username: targetUser.username,
        role: targetUser.role,
        classId: classId || null
      }
    });
  } catch (err: any) {
    console.error('Roster assignment error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
