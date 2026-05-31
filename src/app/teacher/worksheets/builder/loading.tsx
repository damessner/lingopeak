export default function BuilderLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header Skeleton */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl select-none animate-pulse">⛰️</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Staff Portal</span>
            </div>
          </div>
          <div className="w-24 h-9 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
        </div>
      </header>

      {/* Main Skeleton */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-10 z-10 animate-pulse">
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-8 max-w-4xl mx-auto">
          {/* Top Title/Info Block */}
          <div className="border-b border-slate-800/80 pb-4 flex justify-between items-center flex-wrap gap-4">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-indigo-500/20 rounded-md" />
              <div className="h-6 w-48 bg-slate-850 rounded-md" />
            </div>
            <div className="flex gap-2">
              <div className="w-24 h-8 bg-slate-950 border border-slate-855 rounded-xl" />
              <div className="w-24 h-8 bg-slate-950 border border-slate-855 rounded-xl" />
              <div className="w-24 h-8 bg-slate-950 border border-slate-855 rounded-xl" />
            </div>
          </div>

          {/* Form details block */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-1">
              <div className="h-3 w-20 bg-slate-800 rounded-md" />
              <div className="h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-800 rounded-md" />
              <div className="h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-800 rounded-md" />
              <div className="h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-slate-800 rounded-md" />
              <div className="h-10 bg-slate-950 border border-slate-800 rounded-xl" />
            </div>
          </div>

          {/* Question placeholder */}
          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 bg-slate-850 rounded-md" />
              <div className="w-36 h-9 bg-slate-900 border border-slate-800 rounded-xl" />
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-slate-950/20 border border-slate-800 rounded-2xl h-24 flex items-center justify-center">
                <div className="h-4 w-1/3 bg-slate-850 rounded-md" />
              </div>
            </div>
          </div>

          {/* Bottom buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80">
            <div className="w-24 h-10 bg-slate-900 border border-slate-800 rounded-xl" />
            <div className="w-44 h-10 bg-indigo-900 border border-indigo-750 rounded-xl" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
