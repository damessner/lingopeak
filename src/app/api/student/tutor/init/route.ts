import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || session.role !== 'STUDENT') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const studentId = session.userId;

  try {
    // 1. Get total attempts
    const attemptsCount = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE student_id = ?')
      .get(studentId) as { count: number };

    // 2. Get average score
    const avgScoreRow = db.prepare('SELECT AVG(score) as avg FROM attempts WHERE student_id = ?')
      .get(studentId) as { avg: number | null };
    const avgScore = avgScoreRow.avg !== null ? Math.round(avgScoreRow.avg) : 0;

    // 3. Get badges earned
    const badgesCount = db.prepare('SELECT COUNT(*) as count FROM badges WHERE student_id = ?')
      .get(studentId) as { count: number };

    // 4. Get writing attempts count
    const writingCount = db.prepare('SELECT COUNT(*) as count FROM writing_submissions WHERE student_id = ?')
      .get(studentId) as { count: number };

    // 5. Get recent struggle areas (attempts with score < 80)
    const struggles = db.prepare(`
      SELECT a.score, w.title as worksheet_title, c.name as category_name
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ? AND a.score < 80
      ORDER BY a.completed_at DESC
      LIMIT 4
    `).all(studentId) as Array<{ score: number; worksheet_title: string; category_name: string }>;

    // 6. Get overall category mastery (average score per category)
    const categoryMastery = db.prepare(`
      SELECT c.name as category_name, AVG(a.score) as avg_score
      FROM attempts a
      JOIN worksheets w ON a.worksheet_id = w.id
      JOIN categories c ON w.category_id = c.id
      WHERE a.student_id = ?
      GROUP BY c.name
    `).all(studentId) as Array<{ category_name: string; avg_score: number }>;

    // 7. Fetch last 15 historical tutor messages
    const historyMessages = db.prepare(`
      SELECT role, content, created_at
      FROM tutor_messages
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 15
    `).all(studentId) as Array<{ role: string; content: string; created_at: string }>;

    const messageHistory = historyMessages.map(hm => ({
      role: hm.role as 'user' | 'assistant',
      content: hm.content,
      timestamp: new Date(hm.created_at + 'Z').getTime() // Append Z to clarify ISO UTC timezone
    })).reverse();

    return NextResponse.json({
      success: true,
      stats: {
        attempts: attemptsCount.count,
        avgScore,
        badges: badgesCount.count,
        writingSubmissions: writingCount.count
      },
      struggles: struggles.map(s => ({
        worksheetTitle: s.worksheet_title,
        category: s.category_name,
        score: s.score
      })),
      categoryMastery: categoryMastery.map(cm => ({
        category: cm.category_name,
        score: Math.round(cm.avg_score)
      })),
      history: messageHistory
    });
  } catch (err: any) {
    console.error('Tutor init error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
