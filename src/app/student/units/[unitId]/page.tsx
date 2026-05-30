import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';

interface UnitPageProps {
  params: Promise<{
    unitId: string;
  }>;
}

export default async function UnitDetailPage({ params }: UnitPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { unitId } = await params;

  // Fetch unit
  const unit = db.prepare('SELECT * FROM units WHERE id = ?').get(unitId) as any;
  if (!unit) {
    redirect('/student/units');
  }

  // Fetch categories with progress for this student
  const categories = db.prepare(`
    SELECT 
      c.id,
      c.name,
      COUNT(DISTINCT w.id) as total_worksheets,
      COUNT(DISTINCT CASE WHEN a.score >= 80 THEN w.id END) as completed_worksheets
    FROM categories c
    JOIN worksheets w ON w.category_id = c.id AND w.tier != 'SUMMIT'
    LEFT JOIN attempts a ON a.worksheet_id = w.id AND a.student_id = ?
    WHERE c.unit_id = ?
    GROUP BY c.id, c.name
    ORDER BY c.name
  `).all(session.userId, unitId) as any[];

  // Category display config
  const categoryMeta: Record<string, { icon: string; color: string; desc: string }> = {
    GRAMMAR:   { icon: '📝', color: 'from-indigo-500/10 to-indigo-600/5', desc: 'Master sentence structure and verb tenses' },
    VOCABULARY:{ icon: '📖', color: 'from-emerald-500/10 to-emerald-600/5', desc: 'Build your word bank with topic words' },
    READING:   { icon: '📚', color: 'from-amber-500/10 to-amber-600/5', desc: 'Read and understand short texts' },
    WRITING:   { icon: '✏️', color: 'from-rose-500/10 to-rose-600/5', desc: 'Practice forming correct sentences' },
    LISTENING: { icon: '🎧', color: 'from-cyan-500/10 to-cyan-600/5', desc: 'Understand spoken English through dialogues' },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Preview Banner for Teachers/Admins */}
      {(session.role === 'TEACHER' || session.role === 'ADMIN') && (
        <div className="bg-amber-500/10 border-b border-amber-500/20">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
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

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/units" className="flex items-center gap-3">
            <span className="text-3xl select-none">⛰️</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← All Units</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{session.avatarEmoji}</span>
            <span className="text-sm font-bold text-white">{session.username}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 z-10">

        {/* Unit Header */}
        <section className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/40 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute right-6 bottom-[-20px] text-9xl text-indigo-500/5 font-extrabold select-none pointer-events-none">UNIT {unit.order_num}</div>
          <div className="flex items-center gap-4">
            <span className="text-5xl select-none bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 shadow-md">🎯</span>
            <div>
              <span className="text-xs bg-indigo-600 text-white font-black px-2.5 py-1 rounded-lg inline-block mb-2">
                UNIT {unit.order_num}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{unit.title}</h2>
              <p className="text-slate-400 mt-1 text-sm">
                Select a category below to start practicing
              </p>
            </div>
          </div>
        </section>

        {/* Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat: any) => {
            const meta = categoryMeta[cat.name] || { icon: '📘', color: 'from-slate-500/10 to-slate-600/5', desc: '' };
            const allDone = cat.total_worksheets > 0 && cat.completed_worksheets >= cat.total_worksheets;

            return (
              <Link
                key={cat.id}
                href={`/student/units/${unitId}/${cat.name.toLowerCase()}`}
                className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-md relative overflow-hidden block"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-40 pointer-events-none`} />
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-md rounded-full pointer-events-none transition-all group-hover:scale-125" />

                {/* Header row */}
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                    {cat.name}
                  </span>
                  <span className="text-2xl select-none">{meta.icon}</span>
                </div>

                {/* Title & Description */}
                <h4 className="text-lg font-bold text-white mb-1 relative z-10 group-hover:text-indigo-200 transition-colors">
                  Practice {cat.name.toLowerCase()}
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed mb-6 relative z-10">
                  {meta.desc}
                </p>

                {/* Progress Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 relative z-10">
                  {cat.total_worksheets > 0 ? (
                    <>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">
                        {allDone
                          ? '✅ Completed'
                          : `${cat.completed_worksheets} / ${cat.total_worksheets} done`}
                      </span>
                      <span className="bg-indigo-600 group-hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-4 rounded-lg transition-colors shadow-md">
                        {cat.completed_worksheets > 0 ? 'Continue ➔' : 'Start ➔'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Coming soon</span>
                      <span className="bg-slate-800 text-slate-500 font-bold text-xs py-1.5 px-4 rounded-lg cursor-not-allowed">
                        Locked
                      </span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Back link */}
        <div className="mt-10 text-center">
          <Link
            href="/student/units"
            className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
          >
            ← Back to all units
          </Link>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
