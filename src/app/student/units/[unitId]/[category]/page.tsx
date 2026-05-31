import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import SummitGeneratorButton from '@/components/worksheets/SummitGeneratorButton';

interface CategoryPageProps {
  params: Promise<{
    unitId: string;
    category: string;
  }>;
}

export default async function UnitCategoryPage({ params }: CategoryPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { unitId, category } = await params;
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

  // 3. Fetch all standard worksheets in this category (excluding SUMMIT)
  // Sorted by tier rank first, then by creation date
  const worksheets = db.prepare(`
    SELECT * 
    FROM worksheets 
    WHERE category_id = ? AND tier != 'SUMMIT'
    ORDER BY 
      CASE tier 
        WHEN 'EXPLORER' THEN 1 
        WHEN 'VOYAGER' THEN 2 
        WHEN 'CHALLENGER' THEN 3 
        ELSE 4 
      END, 
      created_at ASC
  `).all(categoryRecord.id) as any[];

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
  const worksheetStatuses = worksheets.map((ws) => {
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
      unlocked: false,
    };
  });

  // Calculate unlocks based on difficulty tiers
  const isPreview = session.role === 'TEACHER' || session.role === 'ADMIN';
  
  const explorerWorksheets = worksheetStatuses.filter(s => s.ws.tier === 'EXPLORER');
  const voyagerWorksheets = worksheetStatuses.filter(s => s.ws.tier === 'VOYAGER');
  const challengerWorksheets = worksheetStatuses.filter(s => s.ws.tier === 'CHALLENGER');

  const isExplorerUnlocked = true;
  const isVoyagerUnlocked = isPreview || explorerWorksheets.length === 0 || explorerWorksheets.some(s => s.passed);
  const isChallengerUnlocked = isPreview || (isVoyagerUnlocked && (voyagerWorksheets.length === 0 || voyagerWorksheets.some(s => s.passed)));
  const isSummitUnlocked = isPreview || (isChallengerUnlocked && (challengerWorksheets.length === 0 || challengerWorksheets.some(s => s.passed)));

  worksheetStatuses.forEach((status) => {
    if (status.ws.tier === 'EXPLORER') {
      status.unlocked = isExplorerUnlocked;
    } else if (status.ws.tier === 'VOYAGER') {
      status.unlocked = isVoyagerUnlocked;
    } else if (status.ws.tier === 'CHALLENGER') {
      status.unlocked = isChallengerUnlocked;
    } else {
      status.unlocked = true;
    }
  });

  const isSummitGenerated = !!summitWorksheet;
  const isSummitPassed = summitWorksheet
    ? ((db.prepare('SELECT MAX(score) as max_score FROM attempts WHERE student_id = ? AND worksheet_id = ?')
        .get(session.userId, summitWorksheet.id) as any)?.max_score || 0) >= 80
    : false;

  const renderWorksheetRow = (status: typeof worksheetStatuses[0]) => {
    const { ws, passed, score, unlocked } = status;
    if (!ws) return null;
    return (
      <div
        key={ws.id}
        className={`flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 transition-all p-5 rounded-2xl border ${
          passed
            ? 'bg-emerald-950/15 border-emerald-500/20'
            : unlocked
            ? 'bg-slate-900/40 border-slate-800/80 hover:border-indigo-500/25'
            : 'bg-slate-950/10 border-slate-900/60 opacity-50'
        }`}
      >
        {/* Status circle/badge */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border font-black text-xs select-none shadow-md bg-slate-950 border-slate-850">
          {passed ? (
            <span className="text-lg filter drop-shadow-sm select-none">{ws.badge_emoji || '🥇'}</span>
          ) : unlocked ? (
            <span className="text-indigo-400 font-extrabold">▶️</span>
          ) : (
            <span className="text-slate-600">🔒</span>
          )}
        </div>

        {/* Info panel */}
        <div className="flex-grow text-left space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-extrabold text-white tracking-tight">{ws.title}</h4>
            {passed && (
              <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                ✓ Completed
              </span>
            )}
          </div>
          <p className="text-slate-500 text-[11px] font-medium">
            {passed 
              ? 'Passed! Feel free to practice again to review.' 
              : 'Earn a score of 80% or higher to unlock the next level.'}
          </p>
        </div>

        {/* Score & Start Button */}
        <div className="flex items-center gap-4 justify-between w-full md:w-auto mt-2 md:mt-0">
          {score > 0 && (
            <div className="text-right flex-shrink-0">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Best Score</span>
              <span className={`text-xs font-black ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                {score}%
              </span>
            </div>
          )}

          {unlocked ? (
            <Link
              href={`/student/worksheets/${ws.id}`}
              className="bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl border border-indigo-500/20 transition-all cursor-pointer select-none text-center"
            >
              {passed ? 'Practice' : 'Start'}
            </Link>
          ) : (
            <button
              disabled
              className="bg-slate-900 border border-slate-850 text-slate-600 font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl cursor-not-allowed select-none text-center"
            >
              Locked
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/units" className="flex items-center gap-3">
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
              Complete each worksheet sequentially to unlock the AI Summit challenge and earn your category Gold Badge!
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col items-center gap-3">
            {isSummitPassed ? (
              <div className="flex flex-col items-center animate-bounce">
                <span className="text-5xl filter drop-shadow-md">🥇</span>
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest mt-1">Gold Badge Earned</span>
              </div>
            ) : (
              <div className="text-4xl opacity-30 select-none">🏅</div>
            )}

            {/* Direct creation button for teachers */}
            {(session.role === 'TEACHER' || session.role === 'ADMIN') && (
              <Link
                href={`/teacher/worksheets/builder?categoryId=${categoryRecord.id}`}
                className="mt-2 text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-2 rounded-xl border border-indigo-400/20 transition-all flex items-center gap-1 shadow-md uppercase tracking-wider"
              >
                ➕ Create Worksheet
              </Link>
            )}
          </div>
        </section>

        {/* The Roadmap Trails */}
        <div className="flex flex-col gap-6 relative">
          
          {worksheetStatuses.length === 0 ? (
            <div className="p-16 bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl text-center">
              <span className="text-4xl block filter grayscale opacity-45 select-none mb-3">📋</span>
              <p className="text-slate-400 text-sm font-bold">No worksheets found</p>
              <p className="text-slate-500 text-xs mt-1">There are no worksheets created under this unit category yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. EXPLORER TIER (EASY) */}
              <div className="space-y-3 bg-slate-900/10 border border-slate-900/60 rounded-3xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 select-none">🟢</span>
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Explorer (Easy)</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                    Unlocked
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {explorerWorksheets.length === 0 ? (
                    <p className="text-[11px] text-slate-500 font-semibold italic pl-1">No Explorer level worksheets available.</p>
                  ) : (
                    explorerWorksheets.map(renderWorksheetRow)
                  )}
                </div>
              </div>

              {/* 2. VOYAGER TIER (MEDIUM) */}
              <div className={`space-y-3 bg-slate-900/10 border border-slate-900/60 rounded-3xl p-5 shadow-sm transition-all ${
                !isVoyagerUnlocked ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 select-none">🔵</span>
                    <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Voyager (Medium)</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isVoyagerUnlocked
                      ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      : 'bg-slate-900 text-slate-550 border-slate-850'
                  }`}>
                    {isVoyagerUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {voyagerWorksheets.length === 0 ? (
                    <p className="text-[11px] text-slate-500 font-semibold italic pl-1">No Voyager level worksheets available.</p>
                  ) : (
                    voyagerWorksheets.map(renderWorksheetRow)
                  )}
                </div>
              </div>

              {/* 3. CHALLENGER TIER (HARD) */}
              <div className={`space-y-3 bg-slate-900/10 border border-slate-900/60 rounded-3xl p-5 shadow-sm transition-all ${
                !isChallengerUnlocked ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 select-none">🔴</span>
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Challenger (Hard)</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isChallengerUnlocked
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-900 text-slate-550 border-slate-850'
                  }`}>
                    {isChallengerUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {challengerWorksheets.length === 0 ? (
                    <p className="text-[11px] text-slate-500 font-semibold italic pl-1">No Challenger level worksheets available.</p>
                  ) : (
                    challengerWorksheets.map(renderWorksheetRow)
                  )}
                </div>
              </div>

              {/* 4. SUMMIT FINISHER LEVEL */}
              <div className={`space-y-3 bg-slate-900/10 border border-slate-900/60 rounded-3xl p-5 shadow-sm transition-all ${
                !isSummitUnlocked ? 'opacity-50' : ''
              }`}>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-violet-400 select-none">👑</span>
                    <span className="text-xs font-black text-violet-400 uppercase tracking-widest">AI Summit Challenge</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${
                    isSummitUnlocked
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 animate-pulse'
                      : 'bg-slate-900 text-slate-550 border-slate-850'
                  }`}>
                    {isSummitUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div
                  className={`flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 transition-all p-5 rounded-2xl border ${
                    isSummitPassed
                      ? 'bg-emerald-950/15 border-emerald-500/20 shadow-md shadow-emerald-950/5'
                      : isSummitUnlocked
                      ? 'bg-gradient-to-r from-slate-900/60 via-indigo-950/15 to-slate-900/60 border-indigo-500/25 shadow-md'
                      : 'bg-slate-950/10 border-slate-900/60 opacity-55'
                  }`}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border font-black text-sm z-10 select-none shadow-md bg-slate-950 border-slate-850">
                    {isSummitPassed ? (
                      <span className="text-lg filter drop-shadow-sm select-none">🏆</span>
                    ) : isSummitUnlocked ? (
                      <span className="text-amber-400 text-lg">👑</span>
                    ) : (
                      <span className="text-slate-600">🔒</span>
                    )}
                  </div>

                  <div className="flex-grow text-left space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-white tracking-tight">AI Summit Finisher</h4>
                      {isSummitPassed && (
                        <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 rounded">
                          🏆 Gold Badge Awarded
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                      An individualized challenge generated by AI focusing only on the specific elements you struggled with.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 justify-between w-full md:w-auto mt-2 md:mt-0 flex-shrink-0">
                    {isSummitUnlocked ? (
                      isSummitGenerated ? (
                        <Link
                          href={`/student/worksheets/${summitWorksheet.id}`}
                          className="bg-indigo-650 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl border border-indigo-500/20 transition-all cursor-pointer text-center select-none"
                        >
                          {isSummitPassed ? 'Practice' : 'Start'}
                        </Link>
                      ) : (
                        <SummitGeneratorButton
                          studentId={session.userId}
                          categoryId={categoryRecord.id}
                          unitId={unitId}
                          categoryName={category}
                        />
                      )
                    ) : (
                      <button
                        disabled
                        className="bg-slate-900 border border-slate-850 text-slate-650 font-extrabold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl cursor-not-allowed select-none text-center"
                      >
                        Locked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="text-center pt-4">
          <Link
            href={`/student/units/${unitId}`}
            className="text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors"
          >
            ← Back to Unit Overview
          </Link>
        </div>

      </main>

      {/* PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
