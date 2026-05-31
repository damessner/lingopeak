import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import { getActiveNotes, addCoachNote, archiveNote } from '@/lib/coachNotes';

const ALLOWED_ROLES = ['TEACHER', 'ADMIN'];

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'Missing studentId' }, { status: 400 });
    }

    const notes = getActiveNotes(studentId, 20); // Get up to 20 active notes

    return NextResponse.json({
      success: true,
      notes
    });
  } catch (err: any) {
    console.error('Failed to GET coach notes:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { studentId, category, content, priority = 'normal' } = await req.json() as {
      studentId: string;
      category: string;
      content: string;
      priority?: 'low' | 'normal' | 'high';
    };

    if (!studentId || !category || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = addCoachNote(
      studentId,
      category,
      content,
      priority,
      'teacher' // Written manually by teacher
    );

    return NextResponse.json({
      success: true,
      id
    });
  } catch (err: any) {
    console.error('Failed to POST coach note:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing note id' }, { status: 400 });
    }

    archiveNote(id);

    return NextResponse.json({
      success: true
    });
  } catch (err: any) {
    console.error('Failed to DELETE coach note:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
