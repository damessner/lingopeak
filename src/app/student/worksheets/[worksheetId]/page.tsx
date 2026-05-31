import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import WorksheetContainer from '@/components/worksheets/WorksheetContainer';

interface WorksheetPageProps {
  params: Promise<{
    worksheetId: string;
  }>;
}

export default async function WorksheetPlayPage({ params }: WorksheetPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { worksheetId } = await params;

  // Fetch the worksheet and join with category/unit details
  const worksheet = db.prepare(`
    SELECT w.*, c.name as category_name, c.unit_id 
    FROM worksheets w
    LEFT JOIN categories c ON w.category_id = c.id
    WHERE w.id = ?
  `).get(worksheetId) as any;

  if (!worksheet) {
    redirect('/student/units');
  }

  const worksheetProps = {
    id: worksheet.id,
    title: worksheet.title,
    tier: worksheet.tier,
    categoryId: worksheet.category_id,
    questionsJson: worksheet.questions_json,
    audioUrl: worksheet.audio_url,
    imageUrl: worksheet.image_url,
    videoUrl: worksheet.video_url,
    transcript: worksheet.transcript,
    isDialogue: worksheet.is_dialogue,
  };

  const backLink = worksheet.unit_id && worksheet.category_name
    ? `/student/units/${worksheet.unit_id}/${worksheet.category_name.toLowerCase()}`
    : '/student/units';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex items-center justify-center relative">
      {/* Decorative background */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full">
        {/* Top Navigation */}
        <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href={backLink}
            className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
          >
            ← Back to Category Road
          </Link>
          {(session.role === 'TEACHER' || session.role === 'ADMIN') && (
            <a
              href="/teacher/dashboard"
              className="text-[10px] bg-amber-500/15 text-amber-400 font-bold px-2.5 py-1 rounded-lg border border-amber-500/15 hover:bg-amber-500/25 transition-colors"
            >
              👁️ Preview
            </a>
          )}
        </div>

        <WorksheetContainer worksheet={worksheetProps} studentId={session.userId} />
      </div>
    </div>
  );
}
