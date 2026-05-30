import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import WorksheetContainer from '@/components/worksheets/WorksheetContainer';
import SummitGeneratorButton from '@/components/worksheets/SummitGeneratorButton';

interface CategoryPageProps {
  params: Promise<{
    unitId: string;
    category: string;
  }>;
  searchParams: Promise<{
    play?: string;
  }>;
}

export default async function UnitCategoryPage({ params, searchParams }: CategoryPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { unitId, category } = await params;
  const { play: playId } = await searchParams;
  const uppercaseCategory = category.toUpperCase();

  // 1. Fetch unit details
  const unit = db.prepare('SELECT title, order_num FROM units WHERE id = ?').get(unitId) as any;
  if (!unit) {
    redirect('/student/dashboard');
  }

  // 2. Fetch category record
  const categoryRecord = db.prepare('SELECT id FROM categories WHERE unit_id = ? AND name = ?')
    .get(unitId, uppercaseCategory) as any;

  if (!categoryRecord) {
    redirect('/student/dashboard');
  }

  // 3. If a worksheet is being played, fetch it and render the player
  if (playId) {
    const worksheetToPlay = db.prepare('SELECT * FROM worksheets WHERE id = ?')
      .get(playId) as any;

    if (worksheetToPlay) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex items-center justify-center relative">
          <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
          
          <div className="w-full">
            {/* Top Navigation */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
              <Link
                href={`/student/units/${unitId}/${category}`}
                className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← Back to {uppercaseCategory} Road
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

            <WorksheetContainer worksheet={worksheetToPlay} studentId={session.userId} />
          </div>
        </div>
      );
    }
  }

  // 4. Fetch all standard worksheets in this category (Explorer, Voyager, Challenger)
  // We exclude SUMMIT here as it is generated dynamically or fetched individually
  const worksheets = db.prepare(`
    SELECT * 
    FROM worksheets 
    WHERE category_id = ? AND tier != 'SUMMIT'
  `).all(categoryRecord.id) as any[];

  // Organize by tier order: EXPLORER, VOYAGER, CHALLENGER
  const tiersOrder = ['EXPLORER', 'VOYAGER', 'CHALLENGER'];
  const orderedWorksheets = tiersOrder.map((tierName) => {
    return worksheets.find((w) => w.tier === tierName) || null;
  });

  // Check if an AI Summit worksheet already exists for this student in this category
  let summitWorksheet: any = null;
  try {
    summitWorksheet = db.prepare(`
      SELECT id, title, tier 
      FROM worksheets 
      WHERE category_id = ? AND tier = 'SUMMIT' 
      LIMIT 1
    `).get(categoryRecord.id) as any;
  } catch (e) {
    console.error('Failed to fetch summit worksheet:', e);
  }

  // Check attempts for each worksheet to compute unlocks and scores
  const worksheetStatuses = orderedWorksheets.map((ws, index) => {
    if (!ws) return { ws: null, passed: false, score: 0, unlocked: false };

    // Get student's highest score for this worksheet
    let highestScore = 0;
    try {
      const attempt = db.prepare('SELECT MAX(score) as max_score FROM attempts WHERE student_id = ? AND worksheet_id = ?')
        .get(session.userId, ws.id) as any;
      highestScore = attempt?.max_score || 0;
    } catch (e) {
      console.error('Failed to fetch attempt score:', e);
    }
    
    const passed = highestScore >= 80;

    return {
      ws,
      passed,
      score: highestScore,
      unlocked: false, // will calculate below
    };
  });

  // Calculate unlocks sequentially
  const isPreview = session.role === 'TEACHER' || session.role === 'ADMIN';
  worksheetStatuses[0].unlocked = true; // Explorer is always unlocked
  if (isPreview) {
    // Teachers/admins see all tiers unlocked in preview mode
    for (let i = 1; i < worksheetStatuses.length; i++) {
      worksheetStatuses[i].unlocked = !!worksheetStatuses[i]?.ws;
    }
  } else {
    for (let i = 1; i < worksheetStatuses.length; i++) {
      if (worksheetStatuses[i - 1].passed) {
        worksheetStatuses[i].unlocked = true;
      }
    }
  }

  // Calculate Summit Unlock: Unlocks if Challenger is passed (or always for preview)
  const isChallengerPassed = worksheetStatuses[2]?.passed || false || isPreview;
  const isSummitGenerated = !!summitWorksheet;
  const isSummitPassed = summitWorksheet
    ? ((db.prepare('SELECT MAX(score) as max_score FROM attempts WHERE student_id = ? AND worksheet_id = ?')
        .get(session.userId, summitWorksheet.id) as any)?.max_score || 0) >= 80
    : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

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

      {/* Content Space */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10 z-10 space-y-10">
        
        {/* Title Card */}
        <section className="text-center md:text-left md:flex items-center justify-between p-6 rounded-3xl bg-slate-900/40 border border-slate-850">
          <div>
            <span className="text-xs bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
              Unit {unit.order_num}: {unit.title}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-2 uppercase">
              {uppercaseCategory} ROADMAP
            </h2>
            <p className="text-slate-400 mt-2 text-xs md:text-sm max-w-xl">
              Complete each tier sequentially to unlock the AI Summit challenge and earn your category Gold Badge!
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex justify-center">
            {isSummitPassed ? (
              <div className="flex flex-col items-center animate-bounce">
                <span className="text-5xl filter drop-shadow-md">🥇</span>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">Gold Badge Earned</span>
              </div>
            ) : (
              <div className="text-4xl opacity-30 select-none">🏅</div>
            )}
          </div>
        </section>

        {/* The Roadmap Trails */}
        <div className="flex flex-col gap-6 relative">
          
          {/* Timeline Connector Line */}
          <div className="absolute left-[36px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 to-slate-800 pointer-events-none hidden md:block" />

          {/* Render 3 main tiers */}
          {worksheetStatuses.map((status, index) => {
            const { ws, passed, score, unlocked } = status;
            if (!ws) return null;

            return (
              <div
                key={ws.id}
                className={`flex flex-col md:flex-row items-start gap-4 md:gap-8 transition-all p-5 rounded-2xl border ${
                  passed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : unlocked
                    ? 'bg-slate-900/40 border-slate-800'
                    : 'bg-slate-950/20 border-slate-900 opacity-55'
                }`}
              >
                {/* Timeline Circle */}
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border font-black text-sm z-10 mx-auto md:mx-0 select-none shadow-md">
                  {passed ? (
                    <span className="text-emerald-400 text-lg">✓</span>
                  ) : unlocked ? (
                    <span className="text-indigo-400">0{index + 1}</span>
                  ) : (
                    <span className="text-slate-600">🔒</span>
                  )}
                </div>

                {/* Info & Action Panel */}
                <div className="flex-grow text-center md:text-left space-y-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1.5 justify-center md:justify-start">
                    <h4 className="text-base font-extrabold text-white tracking-tight">{ws.title}</h4>
                    <span className="text-[10px] bg-slate-950/60 border border-slate-800 font-bold px-2 py-0.5 rounded text-slate-400 w-fit mx-auto md:mx-0">
                      {ws.tier}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Complete this level with a score of 80% or higher to progress.
                  </p>
                </div>

                {/* Score & Play Button */}
                <div className="flex items-center gap-4 justify-between w-full md:w-auto mt-4 md:mt-0">
                  {score > 0 && (
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-500 font-bold uppercase">Best Score</span>
                      <span className={`text-sm font-black ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {score}%
                      </span>
                    </div>
                  )}

                  {unlocked ? (
                    <Link
                      href={`/student/units/${unitId}/${category}?play=${ws.id}`}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                    >
                      {passed ? 'Practice Again' : 'Start Challenge'}
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="bg-slate-900 border border-slate-800 text-slate-600 font-bold text-xs py-2 px-5 rounded-xl cursor-not-allowed select-none"
                    >
                      Locked
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Summit Finisher Level */}
          <div
            className={`flex flex-col md:flex-row items-start gap-4 md:gap-8 transition-all p-5 rounded-2xl border ${
              isSummitPassed
                ? 'bg-emerald-950/20 border-emerald-500/30'
                : isChallengerPassed
                ? 'bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-500/30 animate-pulse-border'
                : 'bg-slate-950/20 border-slate-900 opacity-55'
            }`}
          >
            {/* Timeline Circle */}
            <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border font-black text-sm z-10 mx-auto md:mx-0 select-none shadow-md">
              {isSummitPassed ? (
                <span className="text-emerald-400 text-lg">✓</span>
              ) : isChallengerPassed ? (
                <span className="text-amber-400 text-lg">👑</span>
              ) : (
                <span className="text-slate-600">🔒</span>
              )}
            </div>

            {/* Info Panel */}
            <div className="flex-grow text-center md:text-left space-y-1">
              <div className="flex flex-col md:flex-row md:items-center gap-1.5 justify-center md:justify-start">
                <h4 className="text-base font-extrabold text-white tracking-tight">AI Summit Finisher</h4>
                <span className="text-[10px] bg-indigo-500/20 border border-indigo-500/10 font-bold px-2 py-0.5 rounded text-indigo-300 w-fit mx-auto md:mx-0">
                  SUMMIT
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                An individualized challenge generated by AI focusing only on the specific grammar elements you struggled with.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 justify-between w-full md:w-auto mt-4 md:mt-0">
              {isChallengerPassed ? (
                isSummitGenerated ? (
                  <Link
                    href={`/student/units/${unitId}/${category}?play=${summitWorksheet.id}`}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                  >
                    {isSummitPassed ? 'Practice Again' : 'Start Summit'}
                  </Link>
                ) : (
                  <span className="text-[10px] text-indigo-400 font-bold animate-pulse">👑 Complete Explorer, Voyager &amp; Challenger first to unlock the AI Summit</span>
                )
              ) : (
                <button
                  disabled
                  className="bg-slate-900 border border-slate-800 text-slate-600 font-bold text-xs py-2 px-5 rounded-xl cursor-not-allowed select-none"
                >
                  Locked
                </button>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
