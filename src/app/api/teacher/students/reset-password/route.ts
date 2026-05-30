import db, { hashPassword } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Authorize: only TEACHER or ADMIN can reset student passwords
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized: Teacher or Admin access required' }, { status: 403 });
    }

    const { studentId, newPassword } = await request.json();

    if (!studentId || !newPassword) {
      return NextResponse.json({ error: 'studentId and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    // 2. Hash password with new random salt
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(newPassword, salt);

    const result = db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?')
      .run(passwordHash, salt, studentId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
