import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { submissionId } = await request.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
    }

    db.prepare('UPDATE writing_submissions SET completed = 1 WHERE id = ?').run(submissionId);

    const submission = db.prepare('SELECT id, draft_version, text, feedback_json, version_history_json, feedback_history_json, completed FROM writing_submissions WHERE id = ?')
      .get(submissionId) as any;

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found after update' }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Finalize Writing Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
