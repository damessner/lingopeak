'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Teacher page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 text-center">
        <span className="text-5xl block mb-4">⚠️</span>
        <h2 className="text-xl font-extrabold text-white mb-2">Dashboard Error</h2>
        <p className="text-slate-400 text-sm mb-6">
          Something went wrong loading the teacher dashboard. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-2.5 px-5 rounded-xl border border-indigo-400/20 transition-all cursor-pointer"
          >
            Try Again
          </button>
          <a
            href="/login"
            className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-sm py-2.5 px-5 rounded-xl border border-slate-700 transition-all cursor-pointer"
          >
            Log Out
          </a>
        </div>
      </div>
    </div>
  );
}
