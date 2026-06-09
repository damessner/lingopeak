export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
      <div className="text-center space-y-6">
        <div className="relative">
          <span className="text-6xl block select-none animate-pulse">⛰️</span>
          <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full scale-150 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Climbing the Peak...</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">
            Loading your journey
          </p>
        </div>

        <div className="w-48 h-1 bg-slate-900 rounded-full mx-auto overflow-hidden border border-slate-800">
          <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-violet-600 origin-left animate-loadingBar" />
        </div>
      </div>
    </div>
  );
}
