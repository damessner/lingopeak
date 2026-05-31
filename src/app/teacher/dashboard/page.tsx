import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import TeacherDashboardClient from './TeacherDashboardClient';

async function handleLogout() {
  'use server';
  (await cookies()).set('session', '', { maxAge: 0, path: '/' });
  redirect('/login');
}

export default async function TeacherDashboard() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  // 1. Fetch Classes
  const classes = db.prepare('SELECT id, name FROM classes ORDER BY name ASC').all() as any[];

  // 2. Fetch Categories with Unit context
  const categories = db.prepare(`
    SELECT c.id, c.name, u.title as unit_title, u.order_num as unit_order 
    FROM categories c 
    JOIN units u ON c.unit_id = u.id 
    ORDER BY u.order_num ASC, c.name ASC
  `).all() as any[];

  // 3. Fetch Student directory
  const students = db.prepare(`
    SELECT u.id, u.username, u.avatar_emoji, u.class_id, c.name as class_name 
    FROM users u 
    LEFT JOIN classes c ON u.class_id = c.id 
    WHERE u.role = 'STUDENT' 
    ORDER BY c.name ASC, u.username ASC
  `).all() as any[];

  // 4. Fetch Pending Staff accounts
  const pendings = db.prepare(`
    SELECT id, username, avatar_emoji 
    FROM users 
    WHERE role = 'PENDING_TEACHER' 
    ORDER BY username ASC
  `).all() as any[];

  // 4.5 Fetch all active Staff members for class assignments
  const staff = db.prepare(`
    SELECT u.id, u.username, u.avatar_emoji, u.class_id, c.name as class_name, u.role
    FROM users u
    LEFT JOIN classes c ON u.class_id = c.id
    WHERE u.role = 'TEACHER' OR u.role = 'ADMIN'
    ORDER BY u.username ASC
  `).all() as any[];

  // 5. Pre-compile Heatmap highest score metrics
  const heatmapRows = db.prepare(`
    SELECT a.student_id, w.category_id, MAX(a.score) as max_score
    FROM attempts a
    JOIN worksheets w ON a.worksheet_id = w.id
    WHERE w.category_id IS NOT NULL
    GROUP BY a.student_id, w.category_id
  `).all() as any[];

  const heatmapScores: Record<string, number> = {};
  for (const row of heatmapRows) {
    heatmapScores[`${row.student_id}_${row.category_id}`] = row.max_score;
  }

  return (
    <TeacherDashboardClient
      initialStudents={students}
      initialPendings={pendings}
      initialStaff={staff}
      classes={classes}
      categories={categories}
      heatmapScores={heatmapScores}
      sessionUsername={session.username}
      sessionAvatar={session.avatarEmoji}
      sessionRole={session.role}
      handleLogoutAction={handleLogout}
    />
  );
}
