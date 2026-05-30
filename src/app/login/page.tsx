'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Successful login redirects based on user role
      if (data.role === 'PENDING_TEACHER') {
        router.push('/teacher/pending');
      } else if (data.role === 'TEACHER' || data.role === 'ADMIN') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 px-4 py-8 relative overflow-hidden font-sans">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 md:p-10 z-10 transition-all duration-300 hover:border-indigo-500/30">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2 select-none filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.3)]">⛰️</div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-50 to-blue-200 tracking-tight">
            LingoPeak
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Welcome back! Sign in to continue learning.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-950/40 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-center gap-2 animate-shake">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder-slate-600 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder-slate-600 text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-400/20"
            style={{ minHeight: '48px' }}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Sign In</>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            New to LingoPeak?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
