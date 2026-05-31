/**
 * GET /api/teacher/hermes/memory?studentId=...
 *
 * Returns the Hermes memory for a student (teacher view only).
 * Teachers can see what Hermes has learned about each student.
 *
 * DELETE /api/teacher/hermes/memory?studentId=...&key=...
 * Removes a single memory entry.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get('session')?.value ?? '');
  if (!session || !['TEACHER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  const entries = db
    .prepare('SELECT key, value, updated_at FROM student_memories WHERE student_id = ? ORDER BY updated_at DESC')
    .all(studentId) as Array<{ key: string; value: string; updated_at: string }>;

  const student = db
    .prepare('SELECT username, avatar_emoji FROM users WHERE id = ?')
    .get(studentId) as { username: string; avatar_emoji: string } | undefined;

  return NextResponse.json({ student, entries });
}

export async function DELETE(req: Request) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get('session')?.value ?? '');
  if (!session || !['TEACHER', 'ADMIN'].includes(session.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const key = searchParams.get('key');

  if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 });

  if (key) {
    db.prepare('DELETE FROM student_memories WHERE student_id = ? AND key = ?').run(studentId, key);
    return NextResponse.json({ success: true, deleted: key });
  }

  // No key = clear all memory for student
  db.prepare('DELETE FROM student_memories WHERE student_id = ?').run(studentId);
  return NextResponse.json({ success: true, deleted: 'all' });
}
