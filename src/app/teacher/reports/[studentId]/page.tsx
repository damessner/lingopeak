import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    studentId: string;
  }>;
}

export default async function StudentReportPage({ params }: PageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  // Guard: Only allow Teachers and Admins to view progress reports
  if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  const { studentId } = await params;

  // 1. Fetch student info
  const student = db.prepare(`
    SELECT u.username, u.avatar_emoji, c.name as class_name 
    FROM users u 
    LEFT JOIN classes c ON u.class_id = c.id 
    WHERE u.id = ? AND u.role = 'STUDENT'
  `).get(studentId) as any;

  if (!student) {
    redirect('/teacher/dashboard');
  }

  // 2. Fetch statistics
  const totalBadgesObj = db.prepare('SELECT COUNT(*) as count FROM badges WHERE student_id = ?').get(studentId) as any;
  const totalAttemptsObj = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE student_id = ?').get(studentId) as any;
  const avgScoreObj = db.prepare('SELECT AVG(score) as avg_score FROM attempts WHERE student_id = ?').get(studentId) as any;

  const totalBadges = totalBadgesObj?.count || 0;
  const totalAttempts = totalAttemptsObj?.count || 0;
  const averageScore = avgScoreObj?.avg_score !== null && avgScoreObj?.avg_score !== undefined
    ? Math.round(avgScoreObj.avg_score)
    : 0;

  // 3. Fetch all syllabus categories and highest attempt scores
  const categories = db.prepare(`
    SELECT c.id, c.name, u.title as unit_title
    FROM categories c
    JOIN units u ON c.unit_id = u.id
    ORDER BY u.order_num ASC, c.name ASC
  `).all() as any[];

  const categoryProgress = categories.map((cat) => {
    const attempt = db.prepare(`
      SELECT MAX(score) as max_score 
      FROM attempts a 
      JOIN worksheets w ON a.worksheet_id = w.id 
      WHERE a.student_id = ? AND w.category_id = ?
    `).get(studentId, cat.id) as any;

    return {
      name: cat.name,
      unitTitle: cat.unit_title,
      score: attempt?.max_score || null
    };
  });

  // 4. Fetch Book Club attempts
  const bookClubAttempts = db.prepare(`
    SELECT a.score, a.completed_at, w.title as chapter_title
    FROM attempts a
    JOIN worksheets w ON a.worksheet_id = w.id
    WHERE a.student_id = ? AND w.tier = 'BOOK_CLUB'
    ORDER BY a.completed_at ASC
  `).all() as any[];

  // 5. Fetch Writing submissions
  const writingSubmissions = db.prepare(`
    SELECT ws.draft_version, ws.text, ws.feedback_json, ws.completed, ws.updated_at, wp.title as prompt_title
    FROM writing_submissions ws
    JOIN writing_prompts wp ON ws.prompt_id = wp.id
    WHERE ws.student_id = ?
    ORDER BY ws.updated_at DESC
  `).all() as any[];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative flex flex-col print:bg-white print:text-black">
      {/* Decorative background gradients (No-print) */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none no-print" />
      
      {/* Print Actions Bar (No-print) */}
      <div className="bg-slate-900/80 border-b border-slate-800 p-4 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center no-print">
        <Link
          href="/teacher/dashboard"
          className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          ← Back to Staff Dashboard
        </Link>
        <button
          onClick={() => {
            // Native print trigger
            if (typeof window !== 'undefined') {
              window.print();
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-400/20 shadow-md cursor-pointer transition-all"
        >
          🖨️ Print Progress Report (PDF)
        </button>
      </div>

      {/* Progress Report Sheet */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-10 z-10 space-y-8 print:p-0 print:text-black">
        
        {/* Header Block */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/80 pb-6 print:border-black print:pb-4">
          <div className="space-y-2">
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest print:bg-slate-200 print:text-black print:border-black">
              Official Progress Report
            </span>
            <div className="flex items-center gap-3">
              <span className="text-4xl select-none print:hidden">{student.avatar_emoji}</span>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight print:text-black">{student.username}</h1>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider print:text-slate-600">Class {student.class_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex gap-4">
            <div className="bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-2xl text-center shadow-md print:bg-transparent print:border-black">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Average Grade</span>
              <span className="text-lg font-black text-indigo-400 print:text-black">{averageScore}%</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-2xl text-center shadow-md print:bg-transparent print:border-black">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Worksheets</span>
              <span className="text-lg font-black text-white print:text-black">{totalAttempts}</span>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-2xl text-center shadow-md print:bg-transparent print:border-black">
              <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider">Badges Earned</span>
              <span className="text-lg font-black text-emerald-400 print:text-black">🥇 {totalBadges}</span>
            </div>
          </div>
        </section>

        {/* Section 1: Syllabus Mastery Heatmap */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900 pb-2 print:text-black print:border-black">
            Syllabus Unit Masteries
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryProgress.map((cat, idx) => {
              let scoreColor = 'text-slate-500';
              let scoreText = 'Not Started';

              if (cat.score !== null) {
                scoreText = `${Math.round(cat.score)}%`;
                if (cat.score >= 80) {
                  scoreColor = 'text-emerald-400 print:text-black font-black';
                } else if (cat.score >= 60) {
                  scoreColor = 'text-amber-400 print:text-black font-bold';
                } else {
                  scoreColor = 'text-red-400 print:text-black font-bold';
                }
              }

              return (
                <div
                  key={idx}
                  className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-4 flex justify-between items-center shadow-sm print:bg-transparent print:border-black"
                >
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase block">{cat.unitTitle}</span>
                    <span className="text-xs font-bold text-white print:text-black">{cat.name} Mastery</span>
                  </div>
                  <span className={`text-xs ${scoreColor}`}>{scoreText}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Book Club Chapters */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900 pb-2 print:text-black print:border-black">
            Book Club Chapter Verifications
          </h2>
          {bookClubAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No book club chapters completed yet.</p>
          ) : (
            <div className="overflow-hidden border border-slate-850 rounded-2xl print:border-black">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 text-slate-500 font-bold border-b border-slate-850 print:bg-slate-100 print:text-black print:border-black">
                    <th className="py-3 px-4">Chapter Title</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 print:divide-black">
                  {bookClubAttempts.map((attempt, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/10">
                      <td className="py-3 px-4 font-bold text-slate-300 print:text-black">{attempt.chapter_title}</td>
                      <td className={`py-3 px-4 text-center font-extrabold ${attempt.score >= 80 ? 'text-emerald-400 print:text-black' : 'text-amber-400 print:text-black'}`}>
                        {attempt.score}%
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 print:text-black">
                        {new Date(attempt.completed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 3: AI Writing Portfolio */}
        <section className="space-y-6">
          <h2 className="text-sm font-black text-white uppercase tracking-wider border-b border-slate-900 pb-2 print:text-black print:border-black">
            AI Writing Portfolio & Submissions
          </h2>

          {writingSubmissions.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No writing submissions logged yet.</p>
          ) : (
            <div className="space-y-6 print:space-y-8">
              {writingSubmissions.map((sub, idx) => {
                const feedback = JSON.parse(sub.feedback_json || '{}');
                const scores = feedback.scores || [];

                return (
                  <div
                    key={idx}
                    className="bg-slate-900/30 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md print:bg-transparent print:border-black print:p-0 print:shadow-none break-inside-avoid"
                  >
                    {/* Prompt Header */}
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3 print:border-black">
                      <div>
                        <h3 className="text-sm font-extrabold text-white print:text-black">{sub.prompt_title}</h3>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                          Last Revised: {new Date(sub.updated_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-slate-950 border border-slate-800 text-slate-400 font-black px-2 py-0.5 rounded uppercase tracking-wider print:bg-transparent print:border-black print:text-black">
                          Draft {sub.draft_version}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          sub.completed ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                        } print:text-black`}>
                          {sub.completed ? 'Completed' : 'Drafting'}
                        </span>
                      </div>
                    </div>

                    {/* Draft Text Content */}
                    <div className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl space-y-1.5 print:bg-transparent print:border-black">
                      <span className="text-[9px] text-slate-500 font-black uppercase">Submitted Text Content</span>
                      <p className="text-slate-300 font-serif text-sm leading-relaxed whitespace-pre-wrap print:text-black">
                        {sub.text}
                      </p>
                    </div>

                    {/* AI Feedback Comments */}
                    {feedback.overall && (
                      <div className="space-y-3">
                        <div className="bg-indigo-950/15 border border-indigo-900/20 p-4 rounded-2xl text-xs text-indigo-300 italic leading-relaxed print:bg-transparent print:border-black print:text-black">
                          <span className="block text-[8px] text-slate-500 font-black uppercase tracking-wider not-italic mb-1">AI Coach Overall assessment</span>
                          "{feedback.overall}"
                        </div>

                        {/* Scores grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {scores.map((score: any, sIdx: number) => (
                            <div key={sIdx} className="bg-slate-950/20 border border-slate-850 p-3 rounded-xl text-xs space-y-1 print:border-black">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-white print:text-black">{score.name}</span>
                                <span className="font-black text-indigo-400 print:text-black">{score.score} / {score.max}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 italic print:text-slate-700 leading-normal">{score.comment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* PWA Footer (No-print) */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto no-print">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
