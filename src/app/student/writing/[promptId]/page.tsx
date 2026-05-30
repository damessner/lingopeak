import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import WritingWorkspace from './WritingWorkspace';

interface PageProps {
  params: Promise<{
    promptId: string;
  }>;
}

export default async function StudentWritingWorkspacePage({ params }: PageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { promptId } = await params;

  // 1. Fetch writing prompt
  const prompt = db.prepare('SELECT id, title, description, rubrics_json FROM writing_prompts WHERE id = ?')
    .get(promptId) as any;

  if (!prompt) {
    redirect('/student/writing');
  }

  // 2. Fetch student submission
  const submission = db.prepare('SELECT id, draft_version, text, feedback_json, version_history_json, feedback_history_json, completed FROM writing_submissions WHERE student_id = ? AND prompt_id = ?')
    .get(session.userId, promptId) as any;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/writing" className="flex items-center gap-3">
            <span className="text-3xl select-none">🤖</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">AI Writing Coach</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Prompts</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{session.avatarEmoji}</span>
            <span className="text-sm font-bold text-white">{session.username}</span>
          </div>
        </div>
      </header>

      {/* Writing Arena */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 z-10">
        <WritingWorkspace
          studentId={session.userId}
          prompt={prompt}
          initialSubmission={submission || null}
        />
      </main>
    </div>
  );
}
