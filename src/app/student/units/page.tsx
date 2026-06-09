import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import { query, queryOne, UnitRow, CategoryRow } from '@/lib/db-typed';

async function handleLogout() {
  'use server';
  (await cookies()).set('session', '', { maxAge: 0, path: '/' });
  redirect('/login');
}

export default async function UnitsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  // Fetch all units
  const units = query<UnitRow>('SELECT * FROM units ORDER BY order_num ASC');

  // For each unit, count total standard worksheets across all categories
  const unitStats = units.map((unit) => {
    const row = queryOne<{ total: number; completed: number }>(`
      SELECT 
        COUNT(DISTINCT w.id) as total,
        COUNT(DISTINCT CASE WHEN a.score >= 80 THEN w.id END) as completed
      FROM categories c
      JOIN worksheets w ON w.category_id = c.id AND w.tier != 'SUMMIT'
      LEFT JOIN attempts a ON a.worksheet_id = w.id AND a.student_id = ?
      WHERE c.unit_id = ?
    `, session.userId, unit.id);

    return {
      ...unit,
      totalWorksheets: row?.total || 0,
      completedWorksheets: row?.completed || 0,
    };
  });

  const totalAll = unitStats.reduce((sum, u) => sum + u.totalWorksheets, 0);
  const completedAll = unitStats.reduce((sum, u) => sum + u.completedWorksheets, 0);

  // Category icons
  const categoryIcons: Record<string, string> = {
    GRAMMAR: '📝',
    VOCABULARY: '📖',
    READING: '📚',
    WRITING: '✏️',
    LISTENING: '🎧',
  };

  // Fetch a summary of which categories each unit has
  const unitCategories = units.map((unit) => {
    const cats = query<CategoryRow>('SELECT name FROM categories WHERE unit_id = ? ORDER BY name', unit.id);
    return { unitId: unit.id, categories: cats.map((c) => c.name) };
  });

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
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <span className="text-3xl select-none">⛰️</span>
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

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-10 z-10">

        {/* Title Section */}
        <section className="mb-10 p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/40 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute right-6 bottom-[-20px] text-9xl text-indigo-500/5 font-extrabold select-none pointer-events-none">UNITS</div>
          <div className="flex items-center gap-4">
            <span className="text-5xl select-none bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 shadow-md">📚</span>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Learning Path</h2>
              <p className="text-slate-400 mt-1 text-sm md:text-base">
                {completedAll} of {totalAll} worksheets completed across {units.length} units
              </p>
            </div>
          </div>
        </section>

        {/* Unit Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {unitStats.map((unit) => {
            const cats = unitCategories.find((uc) => uc.unitId === unit.id)?.categories || [];
            const allDone = unit.totalWorksheets > 0 && unit.completedWorksheets >= unit.totalWorksheets;

            return (
              <Link
                key={unit.id}
                href={`/student/units/${unit.id}`}
                className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-md relative overflow-hidden block"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/5 to-transparent blur-md rounded-full pointer-events-none transition-all group-hover:scale-150" />

                {/* Unit number badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                    allDone
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                      : 'bg-indigo-600 text-white border-indigo-400/20'
                  }`}>
                    UNIT {unit.order_num}
                  </span>
                  {allDone && (
                    <span className="text-sm select-none">✅</span>
                  )}
                </div>

                {/* Unit title */}
                <h3 className="text-lg font-bold text-white tracking-tight mb-2 group-hover:text-indigo-200 transition-colors">
                  {unit.title}
                </h3>

                {/* Category chips */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {cats.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] bg-slate-950/60 border border-slate-800 font-bold px-2 py-0.5 rounded text-slate-400"
                    >
                      {categoryIcons[cat] || '📘'} {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </span>
                  ))}
                </div>

                {/* Progress */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-auto">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    {unit.totalWorksheets > 0
                      ? `${unit.completedWorksheets} / ${unit.totalWorksheets} done`
                      : 'Coming soon'}
                  </span>
                  <span className="text-xs text-indigo-400 group-hover:text-indigo-300 font-bold transition-colors">
                    Explore ➔
                  </span>
                </div>
              </Link>
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
