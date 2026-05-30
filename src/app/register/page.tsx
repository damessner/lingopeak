'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const EMOJIS = ['🎒', '📝', '🦁', '🐼', '🚀', '🎨', '🦖', '🧩', '🛸', '🍕', '⚽', '🎸', '🧠', '🦉'];

interface ClassOption {
  id: string;
  name: string;
}

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER'>('STUDENT');
  const [classId, setClassId] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🎒');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch classes for students
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch('/api/classes');
        if (res.ok) {
          const data = await res.json();
          setClasses(data);
          if (data.length > 0) {
            setClassId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          role,
          avatarEmoji,
          classId: role === 'STUDENT' ? classId : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Successful registration redirects based on registered role
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

      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl p-8 md:p-10 z-10 transition-all duration-300 hover:border-indigo-500/30">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2 select-none filter drop-shadow-[0_4px_12px_rgba(99,102,241,0.3)]">🎒</div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-indigo-50 to-blue-200 tracking-tight">
            Join LingoPeak
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Start your language learning adventure today!</p>
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
              placeholder="Enter your username (e.g. johndoe)"
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
              placeholder="Create a secure password"
              className="w-full bg-slate-950/40 border border-slate-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4 outline-none transition-all placeholder-slate-600 text-sm"
            />
          </div>

          {/* Role Choice */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'STUDENT'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span>✏️</span> Student
              </button>
              <button
                type="button"
                onClick={() => setRole('TEACHER')}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'TEACHER'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                    : 'bg-slate-950/20 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <span>🦉</span> Teacher
              </button>
            </div>
          </div>

          {/* Class Select (Students only) */}
          {role === 'STUDENT' && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Class</label>
              {classes.length === 0 ? (
                <div className="w-full bg-slate-950/40 border border-slate-800 text-slate-500 rounded-xl py-3 px-4 text-sm">
                  Loading classes...
                </div>
              ) : (
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4 outline-none transition-all text-sm cursor-pointer"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                      Class {cls.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Avatar Emoji Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Choose your Avatar ({avatarEmoji})
            </label>
            <div className="grid grid-cols-7 gap-2 p-3 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`aspect-square text-2xl flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 cursor-pointer ${
                    avatarEmoji === emoji
                      ? 'bg-indigo-600/30 border border-indigo-500 shadow-md scale-105'
                      : 'border border-transparent hover:bg-slate-800/40'
                  }`}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
              <>Register</>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
