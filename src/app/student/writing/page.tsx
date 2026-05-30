import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';

export default async function StudentWritingPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  // Fetch all writing prompts
  const prompts = db.prepare('SELECT id, title, description, rubrics_json FROM writing_prompts ORDER BY created_at DESC').all() as any[];

  // Fetch student's submissions to check draft version and status
  const submissions = db.prepare('SELECT prompt_id, draft_version, completed FROM writing_submissions WHERE student_id = ?')
    .all(session.userId) as any[];

  // Map submissions by prompt_id for easy lookup
  const submissionMap = new Map(submissions.map((sub) => [sub.prompt_id, sub]));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <span className="text-3xl select-none">✍️</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Dashboard</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{session.avatarEmoji}</span>
            <span className="text-sm font-bold text-white">{session.username}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-10 z-10 space-y-8">
        
        {/* Intro Banner */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-950 border border-slate-850 shadow-2xl relative overflow-hidden">
          <div className="absolute right-6 bottom-[-20px] text-9xl text-indigo-500/5 font-extrabold select-none pointer-events-none">COACH</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">AI Writing Coach 🤖</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">
            Choose a writing prompt and work on drafts with your personal AI Coach. Get helpful highlights, grammar hints, and vocabulary suggestions to improve your writing step by step!
          </p>
        </section>

        {/* Prompt List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {prompts.map((prompt) => {
            const submission = submissionMap.get(prompt.id);
            const rubrics = JSON.parse(prompt.rubrics_json || '[]');

            let statusText = 'Not Started';
            let statusStyle = 'bg-slate-500/10 text-slate-400 border-slate-500/20';

            if (submission) {
              if (submission.completed) {
                statusText = 'Completed';
                statusStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20';
              } else {
                statusText = `Draft ${submission.draft_version} - In Progress`;
                statusStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/20';
              }
            }

            return (
              <div
                key={prompt.id}
                className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Status header */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${statusStyle}`}>
                      {statusText}
                    </span>
                    <span className="text-xs text-slate-500 font-bold uppercase">
                      Writing Prompt
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{prompt.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1">
                      {prompt.description}
                    </p>
                  </div>

                  {/* Rubrics checklist */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 space-y-2">
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-wider">Evaluation Rubrics</span>
                    <ul className="space-y-1.5">
                      {rubrics.map((r: any, idx: number) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-indigo-500 mt-0.5">🔹</span>
                          <div>
                            <span className="font-bold text-white">{r.name}:</span>{' '}
                            <span className="text-slate-400 text-[11px]">{r.criteria}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Button actions */}
                <div className="pt-6 border-t border-slate-800/80 mt-6 flex justify-end">
                  <Link
                    href={`/student/writing/${prompt.id}`}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-indigo-500/20 transition-all text-center cursor-pointer shadow-md"
                  >
                    {submission ? 'Open Workspace' : 'Start Writing'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
