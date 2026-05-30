import db from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }

    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    // Fetch submission to check ownership
    const submission = db.prepare('SELECT student_id, completed FROM writing_submissions WHERE id = ?')
      .get(submissionId) as any;

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Students cannot finalize writing for other students
    if (session.role === 'STUDENT' && session.userId !== submission.student_id) {
      return NextResponse.json({ error: 'Forbidden: Cannot finalize writing for another student' }, { status: 403 });
    }

    // Only students, teachers, or admins are allowed to finalize
    if (session.role === 'PENDING_TEACHER') {
      return NextResponse.json({ error: 'Forbidden: Unauthorized role' }, { status: 403 });
    }

    db.prepare('UPDATE writing_submissions SET completed = 1 WHERE id = ?').run(submissionId);

    const updatedSubmission = db.prepare('SELECT id, draft_version, text, feedback_json, version_history_json, feedback_history_json, completed FROM writing_submissions WHERE id = ?')
      .get(submissionId) as any;

    if (!updatedSubmission) {
      return NextResponse.json({ error: 'Submission not found after update' }, { status: 404 });
    }

    return NextResponse.json(updatedSubmission);
  } catch (error: any) {
    console.error('Finalize Writing Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
