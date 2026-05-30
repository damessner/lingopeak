import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';
import BookReader from '@/components/worksheets/BookReader';

interface BookPageProps {
  params: Promise<{
    bookId: string;
  }>;
  searchParams: Promise<{
    chapterId?: string;
  }>;
}

export default async function BookWorkspacePage({ params, searchParams }: BookPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  const { bookId } = await params;
  const { chapterId } = await searchParams;

  // 1. Fetch book details
  const book = db.prepare('SELECT title, description FROM books WHERE id = ?').get(bookId) as any;
  if (!book) {
    redirect('/student/book-club');
  }

  // 2. If a specific chapter is selected, render the reader workspace
  if (chapterId) {
    const activeChapter = db.prepare('SELECT id, title, content, questions_json FROM chapters WHERE id = ?')
      .get(chapterId) as any;

    if (activeChapter) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex items-center justify-center relative">
          <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
          
          <div className="w-full">
            {/* Top Navigation */}
            <div className="max-w-3xl mx-auto mb-6">
              <Link
                href={`/student/book-club/${bookId}`}
                className="text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors"
              >
                ← Back to {book.title} Chapters
              </Link>
            </div>

            <BookReader
              chapter={activeChapter}
              studentId={session.userId}
              onChapterPassed={async () => {
                'use server';
                redirect(`/student/book-club/${bookId}`);
              }}
            />
          </div>
        </div>
      );
    }
  }

  // 3. Fetch all chapters in the book
  const chapters = db.prepare('SELECT id, title, difficulty_order, questions_json FROM chapters WHERE book_id = ? ORDER BY difficulty_order ASC')
    .all(bookId) as any[];

  // Compute unlock states
  const chapterStatuses = chapters.map((ch, index) => {
    // Get student's highest score for this chapter (the chapterId matches the worksheetId in attempts!)
    const attempt = db.prepare('SELECT MAX(score) as max_score FROM attempts WHERE student_id = ? AND worksheet_id = ?')
      .get(session.userId, ch.id) as any;
    
    const highestScore = attempt?.max_score || 0;
    const passed = highestScore >= 80;

    return {
      ch,
      passed,
      score: highestScore,
      unlocked: false,
    };
  });

  // Calculate unlocks sequentially
  if (chapterStatuses.length > 0) {
    chapterStatuses[0].unlocked = true; // Chapter 1 is always unlocked
    for (let i = 1; i < chapterStatuses.length; i++) {
      if (chapterStatuses[i - 1].passed) {
        chapterStatuses[i].unlocked = true;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/book-club" className="flex items-center gap-3">
            <span className="text-3xl select-none">📚</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Bookshelf</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{session.avatarEmoji}</span>
            <span className="text-sm font-bold text-white">{session.username}</span>
          </div>
        </div>
      </header>

      {/* Chapters Roadmap */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-10 z-10 space-y-8">
        
        {/* Book summary card */}
        <section className="p-6 rounded-3xl bg-slate-900/40 border border-slate-850">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
            Mystery Series
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight mt-2 uppercase">{book.title}</h2>
          <p className="text-slate-400 mt-2 text-xs md:text-sm leading-relaxed">{book.description}</p>
        </section>

        {/* Chapters timeline list */}
        <div className="space-y-6 relative">
          <div className="absolute left-[36px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500 to-slate-800 pointer-events-none hidden md:block" />

          {chapterStatuses.map((status, index) => {
            const { ch, passed, score, unlocked } = status;

            return (
              <div
                key={ch.id}
                className={`flex flex-col md:flex-row items-start gap-4 md:gap-8 transition-all p-5 rounded-2xl border ${
                  passed
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : unlocked
                    ? 'bg-slate-900/40 border-slate-800'
                    : 'bg-slate-950/20 border-slate-900 opacity-55'
                }`}
              >
                {/* Timeline Indicator */}
                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border font-black text-sm z-10 mx-auto md:mx-0 select-none shadow-md">
                  {passed ? (
                    <span className="text-emerald-400 text-lg">✓</span>
                  ) : unlocked ? (
                    <span className="text-indigo-400">CH {ch.difficulty_order}</span>
                  ) : (
                    <span className="text-slate-600">🔒</span>
                  )}
                </div>

                {/* Chapter details */}
                <div className="flex-grow text-center md:text-left space-y-1">
                  <h4 className="text-base font-extrabold text-white tracking-tight">Chapter {ch.difficulty_order}: {ch.title}</h4>
                  <p className="text-slate-500 text-xs">
                    Read the chapter story, unlock vocabulary definitions, and complete the check to unlock subsequent chapters.
                  </p>
                </div>

                {/* Score and Read Button */}
                <div className="flex items-center gap-4 justify-between w-full md:w-auto mt-4 md:mt-0">
                  {score > 0 && (
                    <div className="text-right">
                      <span className="block text-[8px] text-slate-500 font-bold uppercase">Check Score</span>
                      <span className={`text-sm font-black ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {score}%
                      </span>
                    </div>
                  )}

                  {unlocked ? (
                    <Link
                      href={`/student/book-club/${bookId}?chapterId=${ch.id}`}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all cursor-pointer"
                    >
                      {passed ? 'Re-Read & Practice' : 'Start Reading'}
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
        </div>

      </main>

      {/* PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
