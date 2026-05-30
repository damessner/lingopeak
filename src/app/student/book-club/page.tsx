import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/session';
import db from '@/lib/db';
import Link from 'next/link';

export default async function BookClub() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const session = verifySession(sessionToken || '');

  if (!session) {
    redirect('/login');
  }

  // Fetch all books in SQLite
  const books = db.prepare('SELECT id, title, description, cover_image FROM books ORDER BY title ASC').all() as any[];

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

      {/* Bookshelf Arena */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-10 z-10 space-y-8">
        
        {/* Book Club Introduction */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-950 border border-slate-850 shadow-2xl relative overflow-hidden">
          <div className="absolute right-6 bottom-[-20px] text-9xl text-indigo-500/5 font-extrabold select-none pointer-events-none">BOOKS</div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">LingoPeak Book Club 📚</h2>
          <p className="text-slate-400 mt-2 text-sm max-w-xl">
            Explore sequential mystery and adventure books. Double-tap any word during reading to see its dictionary definition, and complete checks to unlock chapters!
          </p>
        </section>

        {/* Books Shelf Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-lg flex gap-6"
            >
              {/* Cover placeholder */}
              <div className="w-28 h-40 bg-gradient-to-br from-indigo-800 to-slate-950 border border-slate-800 rounded-2xl flex-shrink-0 flex items-center justify-center text-4xl shadow-md relative overflow-hidden select-none">
                <div className="absolute inset-0 bg-black/10 opacity-30" />
                📖
              </div>

              {/* Book Info */}
              <div className="flex flex-col justify-between py-1">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{book.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-sm line-clamp-3">
                    {book.description}
                  </p>
                </div>

                <Link
                  href={`/student/book-club/${book.id}`}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-5 rounded-xl border border-indigo-500/20 transition-all text-center w-fit cursor-pointer shadow-md"
                >
                  Open Book
                </Link>
              </div>
            </div>
          ))}
        </div>

      </main>

      {/* PWA Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
