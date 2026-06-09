import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { query } from '@/lib/db-typed';

export default async function StudentProfilePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  // 1. Fetch earned badges from database
  const badges = query<{ id: string; category_name: string; earned_at: string; unit_title: string }>(`
    SELECT b.id, b.category_name, b.earned_at, u.title as unit_title
    FROM badges b
    JOIN units u ON b.unit_id = u.id
    WHERE b.student_id = ?
    ORDER BY b.earned_at DESC
  `, session.userId);

  // 2. Fetch worksheet attempts history for progress timeline
  const attempts = query<{ id: string; score: number; worksheet_title: string; category_name: string; completed_at: string }>(`
    SELECT a.id, a.score, w.title as worksheet_title, c.name as category_name, a.completed_at
    FROM attempts a
    JOIN worksheets w ON a.worksheet_id = w.id
    JOIN categories c ON w.category_id = c.id
    WHERE a.student_id = ?
    ORDER BY a.completed_at DESC
    LIMIT 25
  `, session.userId);


  return (
    <StudentProfileClient
      sessionUsername={session.username}
      sessionAvatar={session.avatarEmoji}
      badges={badges}
      attempts={attempts}
    />
  );
}
