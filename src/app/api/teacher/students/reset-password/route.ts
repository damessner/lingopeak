import db, { hashPassword } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { studentId, newPassword } = await request.json();

    if (!studentId || !newPassword) {
      return NextResponse.json({ error: 'studentId and newPassword are required' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 });
    }

    const passwordHash = hashPassword(newPassword);

    const result = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, studentId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
