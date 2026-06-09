import db from '@/lib/db';
import { verifySession } from '@/lib/session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { notifyStaff, createNotification } from '@/lib/notifications';
import { calculateScore } from '@/lib/scoring';
import { Question } from '@/lib/worksheet-types';

export async function POST(request: NextRequest) {
  try {
    // Authorize session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    const session = verifySession(sessionToken || '');

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
    }
    const { studentId, worksheetId, score: clientScore, answersJson } = await request.json();

    if (!studentId || !worksheetId || clientScore === undefined || !answersJson) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Students cannot submit attempts for other students
    if (session.role === 'STUDENT' && session.userId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Cannot submit attempts for another student' }, { status: 403 });
    }

    // 1. Fetch worksheet questions to validate score on server
    const worksheetData = db.prepare('SELECT questions_json, title, tier, category_id FROM worksheets WHERE id = ?').get(worksheetId) as any;
    if (!worksheetData) {
      return NextResponse.json({ error: 'Worksheet not found' }, { status: 404 });
    }

    let serverScore = 0;
    try {
      const questions = JSON.parse(worksheetData.questions_json) as Question[];
      const answers = JSON.parse(answersJson);
      serverScore = calculateScore(questions, answers);
    } catch (e) {
      console.error('Failed to calculate server score:', e);
      return NextResponse.json({ error: 'Invalid answers format' }, { status: 400 });
    }

    // Security check: If client score differs significantly from server score, log a warning or reject
    // We allow a 1% margin for rounding differences, though calculateScore uses Math.round
    if (Math.abs(serverScore - clientScore) > 1) {
      console.warn(`[SECURITY] Potential score tampering detected for student ${session.username}. Client: ${clientScore}%, Server: ${serverScore}%`);
      // We overwrite with the server-validated score
    }
    const score = serverScore;

    const attemptId = crypto.randomUUID();

    // Run database operations
    const result = db.transaction(() => {
      // 1. Insert attempt log
      db.prepare('INSERT INTO attempts (id, student_id, worksheet_id, score, answers_json) VALUES (?, ?, ?, ?, ?)')
        .run(attemptId, studentId, worksheetId, score, answersJson);

      // 2. Check if badge should be awarded
      const category = db.prepare('SELECT name, unit_id FROM categories WHERE id = ?').get(worksheetData.category_id) as any;

      let badgeAwarded = false;

      // Award badge if score is passing (>= 80%) AND the tier is SUMMIT
      if (worksheetData.tier === 'SUMMIT' && score >= 80 && category) {
        // Check if student already has this badge to avoid duplicates
        const existingBadge = db.prepare('SELECT id FROM badges WHERE student_id = ? AND category_name = ? AND unit_id = ?')
          .get(studentId, category.name, category.unit_id);

        if (!existingBadge) {
          const badgeId = crypto.randomUUID();
          db.prepare('INSERT INTO badges (id, student_id, category_name, unit_id) VALUES (?, ?, ?, ?)')
            .run(badgeId, studentId, category.name, category.unit_id);
          badgeAwarded = true;
        }
      }

      return { badgeAwarded, categoryName: category?.name };
    })();

    // Write last_reviewed_[category] memory entry
    if (result.categoryName) {
      try {
        const categoryKey = `last_reviewed_${result.categoryName.toLowerCase()}`;
        const todayStr = new Date().toISOString().split('T')[0];
        db.prepare(`
          INSERT INTO student_memories (student_id, key, value, updated_at)
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(student_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run(studentId, categoryKey, todayStr);
      } catch (err) {
        console.error('Failed to update last_reviewed memory:', err);
      }
    }

    // Notify staff of student worksheet completion
    try {
      const wsTitle = worksheetData.title || 'a worksheet';
      notifyStaff(
        'Worksheet Submitted 📈',
        `${session.username} completed "${wsTitle}" with a score of ${Math.round(score)}%.`
      );

      if (result.badgeAwarded) {
        const catName = result.categoryName || 'Subject';
        createNotification(
          studentId,
          'Badge Earned! 🥇',
          `Congratulations! You earned a ${catName} mastery badge for completing the Summit exercise!`
        );
      }
    } catch (e) {
      console.error('Failed to process submission notifications:', e);
    }

    return NextResponse.json({ success: true, attemptId, badgeAwarded: result.badgeAwarded });
  } catch (error) {
    console.error('Failed to submit attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

