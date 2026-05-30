'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TeacherPending() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 md:p-10 text-center z-10">
        <div className="text-5xl mb-4 select-none animate-pulse">⏳</div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Account Pending</h1>
        <h2 className="text-indigo-400 font-semibold text-sm mt-1 uppercase tracking-wider">Teacher Account Registration</h2>
        
        <p className="text-slate-300 mt-4 text-sm leading-relaxed">
          Your registration as a **Teacher** was successful! However, to protect student privacy, an administrator must manually approve your account before you can access the dashboard.
        </p>

        <p className="text-slate-400 mt-3 text-xs">
          Please notify your school administrator to activate your role in the system.
        </p>

        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            style={{ minHeight: '44px' }}
          >
            {loading ? 'Logging Out...' : 'Log Out & Check Later'}
          </button>
        </div>
      </div>
    </main>
  );
}
