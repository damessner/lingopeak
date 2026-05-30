'use client';

export default function Offline() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 relative overflow-hidden font-sans text-slate-100">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 md:p-10 text-center z-10">
        <div className="text-5xl mb-4 select-none">🔌</div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">You're Offline</h1>
        
        <p className="text-slate-300 mt-4 text-sm leading-relaxed">
          LingoPeak requires an active internet connection to download worksheets and check your progress.
        </p>

        <p className="text-slate-400 mt-3 text-xs">
          Please check your iPad's Wi-Fi connection and reload the page when you're back online.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl border border-indigo-400/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ minHeight: '44px' }}
          >
            Try Reconnecting
          </button>
        </div>
      </div>
    </main>
  );
}
