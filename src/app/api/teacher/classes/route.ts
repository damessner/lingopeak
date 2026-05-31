import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import crypto from 'crypto';

// Verify session is a teacher or admin
async function checkAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');
  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
    return null;
  }
  return session;
}

export async function POST(req: Request) {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name } = await req.json() as { name: string };
    const cleanName = name?.trim();

    if (!cleanName) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Check if name already exists
    const existing = db.prepare('SELECT id FROM classes WHERE name = ?').get(cleanName);
    if (existing) {
      return NextResponse.json({ error: 'Class name already exists' }, { status: 400 });
    }

    const id = `class_${crypto.randomUUID()}`;
    db.prepare('INSERT INTO classes (id, name) VALUES (?, ?)').run(id, cleanName);

    return NextResponse.json({ success: true, class: { id, name: cleanName } });
  } catch (err: any) {
    console.error('Create class error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name } = await req.json() as { id: string; name: string };
    const cleanName = name?.trim();

    if (!id || !cleanName) {
      return NextResponse.json({ error: 'ID and Class name are required' }, { status: 400 });
    }

    // Check if name already exists in another class
    const existing = db.prepare('SELECT id FROM classes WHERE name = ? AND id != ?').get(cleanName, id);
    if (existing) {
      return NextResponse.json({ error: 'Class name already exists' }, { status: 400 });
    }

    db.prepare('UPDATE classes SET name = ? WHERE id = ?').run(cleanName, id);

    return NextResponse.json({ success: true, class: { id, name: cleanName } });
  } catch (err: any) {
    console.error('Rename class error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await checkAuth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await req.json() as { id: string };

    if (!id) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    // Delete class (SQLite foreign keys with ON DELETE SET NULL handles users table class_id)
    db.prepare('DELETE FROM classes WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete class error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
