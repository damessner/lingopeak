import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const result = db.prepare("UPDATE users SET role = 'TEACHER' WHERE id = ? AND role = 'PENDING_TEACHER'").run(userId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'User not found or not in pending state' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Approve Teacher Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
