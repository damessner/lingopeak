import db from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { studentId, worksheetId, score, answersJson } = await request.json();

    if (!studentId || !worksheetId || score === undefined || !answersJson) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const attemptId = crypto.randomUUID();

    // Run database operations
    const result = db.transaction(() => {
      // 1. Insert attempt log
      db.prepare('INSERT INTO attempts (id, student_id, worksheet_id, score, answers_json) VALUES (?, ?, ?, ?, ?)')
        .run(attemptId, studentId, worksheetId, score, answersJson);

      // 2. Fetch worksheet information to check if badge should be awarded
      const worksheet = db.prepare(`
        SELECT w.tier, c.name as category_name, c.unit_id 
        FROM worksheets w 
        JOIN categories c ON w.category_id = c.id 
        WHERE w.id = ?
      `).get(worksheetId) as any;

      let badgeAwarded = false;

      // Award badge if score is passing (>= 80%) AND the tier is SUMMIT
      if (worksheet && worksheet.tier === 'SUMMIT' && score >= 80) {
        // Check if student already has this badge to avoid duplicates
        const existingBadge = db.prepare('SELECT id FROM badges WHERE student_id = ? AND category_name = ? AND unit_id = ?')
          .get(studentId, worksheet.category_name, worksheet.unit_id);

        if (!existingBadge) {
          const badgeId = crypto.randomUUID();
          db.prepare('INSERT INTO badges (id, student_id, category_name, unit_id) VALUES (?, ?, ?, ?)')
            .run(badgeId, studentId, worksheet.category_name, worksheet.unit_id);
          badgeAwarded = true;
        }
      }

      return { badgeAwarded };
    })();

    return NextResponse.json({ success: true, attemptId, badgeAwarded: result.badgeAwarded });
  } catch (error) {
    console.error('Failed to submit attempt:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
