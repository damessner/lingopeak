'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Badge {
  id: string;
  category_name: string;
  earned_at: string;
  unit_title: string;
}

interface Attempt {
  id: string;
  score: number;
  worksheet_title: string;
  category_name: string;
  completed_at: string;
}

interface StudentProfileClientProps {
  sessionUsername: string;
  sessionAvatar: string;
  badges: Badge[];
  attempts: Attempt[];
}

const CURATED_AVATARS = [
  '🎒', '🎓', '🦊', '🐯', '🦁', '🐨', '🦖', '🦄', '🚀',
  '👾', '🎨', '🎸', '🛹', '🏀', '🍕', '🍦', '🌈', '🌟'
];

const CATEGORY_ICONS: Record<string, string> = {
  GRAMMAR: '📝',
  VOCABULARY: '⚡',
  READING: '📚',
  WRITING: '🖊️',
  LISTENING: '🎧'
};

export default function StudentProfileClient({
  sessionUsername,
  sessionAvatar,
  badges,
  attempts
}: StudentProfileClientProps) {
  const [avatar, setAvatar] = useState(sessionAvatar);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleAvatarSelect = async (emoji: string) => {
    if (emoji === avatar || updating) return;

    setUpdating(true);
    setMessage(null);

    try {
      const res = await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarEmoji: emoji })
      });

      if (res.ok) {
        setAvatar(emoji);
        setMessage({ text: 'Avatar updated successfully!', type: 'success' });
        // Refresh the browser window to propagate the avatar cookie change to page headers
        window.location.reload();
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update avatar.');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating avatar.', type: 'error' });
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
      {/* Decorative background gradients */}
      <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[60%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-600/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3">
            <span className="text-3xl select-none">🎒</span>
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">LingoPeak</span>
              <span className="text-xs text-slate-400 font-bold ml-2">← Back to Student Hub</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl px-4 py-1.5 shadow-sm">
            <span className="text-2xl">{avatar}</span>
            <span className="text-sm font-bold text-white">{sessionUsername}</span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Customizer */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-6">
            <div className="text-center space-y-3">
              <span className="text-7xl block filter drop-shadow-md select-none p-4 bg-indigo-500/10 border border-indigo-500/20 w-fit mx-auto rounded-3xl animate-scaleUp">
                {avatar}
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-white">{sessionUsername}</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">LingoPeak Pupil</p>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-xl border text-xs font-bold text-center ${
                message.type === 'success' ? 'bg-emerald-950/40 border-emerald-500/25 text-emerald-400' : 'bg-red-950/40 border-red-500/25 text-red-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="space-y-3">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block border-b border-slate-800/80 pb-2">Change Avatar Emoji</span>
              <div className="grid grid-cols-6 gap-2">
                {CURATED_AVATARS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAvatarSelect(emoji)}
                    disabled={updating}
                    className={`text-2xl p-2 rounded-xl border hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                      emoji === avatar 
                        ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg' 
                        : 'bg-slate-950/60 border-slate-850 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Achievements and Timeline */}
        <section className="lg:col-span-2 space-y-8">
          
          {/* Achievements / Badges Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight uppercase">Earned Badges & Achievements</h3>
              <p className="text-xs text-slate-400 mt-0.5">Badges earned by completing worksheets with 80%+ scores.</p>
            </div>

            {badges.length === 0 ? (
              <div className="p-8 bg-slate-950/40 border border-slate-850 border-dashed rounded-2xl text-center space-y-2">
                <span className="text-4xl filter grayscale opacity-45 select-none block">🥇</span>
                <p className="text-slate-500 text-xs italic">You haven't earned any badges yet. Complete worksheets on your learning path with a score of 80%+ to unlock them!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {badges.map((badge) => {
                  const cleanCat = badge.category_name.toUpperCase();
                  const icon = CATEGORY_ICONS[cleanCat] || '🥇';
                  
                  return (
                    <div
                      key={badge.id}
                      className="bg-slate-950/60 border border-slate-850 hover:border-slate-800 p-4 rounded-2xl flex items-center gap-3 transition-colors shadow-sm"
                    >
                      <span className="text-3xl p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl select-none">{icon}</span>
                      <div className="leading-tight">
                        <div className="text-xs font-black text-indigo-400 uppercase tracking-widest">{badge.category_name}</div>
                        <div className="text-sm font-extrabold text-white mt-0.5 truncate max-w-[170px]" title={badge.unit_title}>{badge.unit_title}</div>
                        <div className="text-[10px] text-slate-500 mt-1">Earned {new Date(badge.earned_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Progress Timeline Panel */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 backdrop-blur-sm shadow-xl space-y-6">
            <div>
              <h3 className="text-lg font-extrabold text-white tracking-tight uppercase">Progress Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Your chronological history of worksheet attempts.</p>
            </div>

            {attempts.length === 0 ? (
              <div className="p-8 bg-slate-950/40 border border-slate-850 border-dashed rounded-2xl text-center space-y-2">
                <span className="text-4xl filter grayscale opacity-45 select-none block">📈</span>
                <p className="text-slate-500 text-xs italic">No worksheet attempts recorded yet. Start learning to build your timeline!</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-slate-800 space-y-6">
                {attempts.map((attempt) => {
                  const passed = attempt.score >= 80;
                  const date = new Date(attempt.completed_at);
                  const icon = CATEGORY_ICONS[attempt.category_name.toUpperCase()] || '📋';

                  return (
                    <div key={attempt.id} className="relative space-y-1">
                      {/* Timeline dot */}
                      <span className={`absolute left-[-29px] top-1.5 w-3 h-3 rounded-full border-2 ${
                        passed 
                          ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                          : attempt.score >= 60 
                            ? 'bg-amber-500 border-amber-400' 
                            : 'bg-red-500 border-red-400'
                      }`} />

                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-white leading-tight">{attempt.worksheet_title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                              <span>{icon}</span> {attempt.category_name}
                            </span>
                            <span className="text-[10px] text-slate-600 font-bold">•</span>
                            <span className="text-[10px] text-slate-500 font-bold">{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>

                        <div className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                          passed 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : attempt.score >= 60 
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                          {Math.round(attempt.score)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-auto">
        <p>© 2026 LingoPeak. All rights reserved. Self-hosted school platform.</p>
      </footer>
    </div>
  );
}
