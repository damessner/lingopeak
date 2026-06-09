'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-sm">
        <span className="text-6xl block select-none mb-4">🌋</span>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Something went wrong!</h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          We encountered an unexpected error. Don't worry, your progress is safe. You can try refreshing the page or head back to the dashboard.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl border border-indigo-400/20 transition-all shadow-lg active:scale-95"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold py-3 rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            Go to Home
          </Link>
        </div>
        
        <div className="pt-4 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
            Error Digest: {error.digest || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
