import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';

async function handleLogout() {
  'use server';
  (await cookies()).set('session', '', { maxAge: 0, path: '/' });
  redirect('/login');
}

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  // Fetch student class details
  let className = 'No Class';
  if (session.classId) {
    const classRecord = db.prepare('SELECT name FROM classes WHERE id = ?').get(session.classId) as any;
    if (classRecord) className = classRecord.name;
  }

  // Fetch all units from SQLite
  const units = db.prepare('SELECT * FROM units ORDER BY order_num ASC').all() as any[];

  // Fetch categories for each unit
  const unitsWithCategories = units.map((unit) => {
    const categories = db.prepare('SELECT id, name FROM categories WHERE unit_id = ?').all(unit.id) as any[];
    return { ...unit, categories };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Premium Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none filter drop-shadow-[0_2px_8px_rgba(99,102,241,0.2)]">⛰️</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full ml-2 border border-indigo-500/10">ESL</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
              <span className="text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]">{session.avatarEmoji}</span>
              <div className="text-left leading-tight">
                <div className="text-sm font-bold text-white max-w-[120px] truncate">{session.username}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Class {className}</div>
              </div>
            </div>

            <form action={handleLogout}>
              <button
                type="submit"
                className="bg-slate-900/60 hover:bg-red-950/30 hover:border-red-500/30 text-slate-400 hover:text-red-200 border border-slate-800 hover:shadow-lg transition-all rounded-xl py-2 px-4 text-xs font-bold cursor-pointer"
              >
                Log Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Preview Banner for Teachers/Admins */}
      {(session.role === 'TEACHER' || session.role === 'ADMIN') && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
              <span>👁️</span>
              <span>Preview Mode — You are viewing the student interface.</span>
            </div>
            <a
              href="/teacher/dashboard"
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold px-3 py-1 rounded-lg border border-amber-500/20 transition-colors"
            >
              ← Back to Staff Portal
            </a>
          </div>
        </div>
      )}

      {/* Main Learning Space */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 z-10">
        
        {/* Welcome Section */}
        <section className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/40 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute right-6 bottom-[-20px] text-9xl text-indigo-500/5 font-extrabold select-none pointer-events-none">ESL</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Hi, {session.username}! {session.avatarEmoji}
          </h2>
          <p className="text-slate-400 mt-2 text-sm md:text-base max-w-xl">
            Welcome back to your English adventure. Ready to climb to the next peak? Select a category below to start practicing!
          </p>
        </section>

        {/* Special Learning Arenas */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="group bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-lg flex gap-5">
            <span className="text-4xl select-none bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/10 h-fit self-center">📚</span>
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Progressive Book Club</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Read interactive stories. Tap words to get instant definition/translations. Complete checkpoints to unlock chapters!
                </p>
              </div>
              <a
                href="/student/book-club"
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all w-fit cursor-pointer text-center shadow-md"
              >
                Enter Library
              </a>
            </div>
          </div>

          <div className="group bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-lg flex gap-5">
            <span className="text-4xl select-none bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/10 h-fit self-center">🤖</span>
            <div className="flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">AI Writing Coach</h3>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Write essays, stories, or reports. Submit drafts to get custom inline feedback and rubric evaluations from FelloFish AI.
                </p>
              </div>
              <a
                href="/student/writing"
                className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all w-fit cursor-pointer text-center shadow-md"
              >
                Start Writing
              </a>
            </div>
          </div>
        </section>

        {/* Learning Units Section */}
        <div className="space-y-12">
          {unitsWithCategories.map((unit, index) => (
            <section key={unit.id} className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-lg">
                  UNIT {unit.order_num}
                </span>
                <h3 className="text-xl font-bold text-white tracking-wide">{unit.title}</h3>
              </div>

              {/* Course categories inside unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unit.categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-md relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-md rounded-full pointer-events-none transition-all group-hover:scale-125" />
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                        {cat.name}
                      </span>
                      <span className="text-lg">🎒</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2">Practice {cat.name.toLowerCase()}</h4>
                    <p className="text-slate-400 text-xs leading-relaxed mb-6">
                      Explore vocabulary and practice grammar concepts with interactive exercises.
                    </p>

                    {/* Progress Road Link */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">0 / 4 Completed</span>
                      <a
                        href={`/student/units/${unit.id}/${cat.name.toLowerCase()}`}
                        className="bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-colors flex items-center gap-1 shadow-md cursor-pointer"
                      >
                        Let's Go ➔
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

      </main>

      {/* Simple PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
