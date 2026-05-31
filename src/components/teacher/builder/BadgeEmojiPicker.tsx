'use client';

import { useState, useRef, useEffect } from 'react';

interface BadgeEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const CuratedEmojis = [
  { emoji: '🥇', label: 'Gold Medal' },
  { emoji: '🥈', label: 'Silver Medal' },
  { emoji: '🥉', label: 'Bronze Medal' },
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '🎖️', label: 'Military Medal' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💡', label: 'Idea Bulb' },
  { emoji: '🧠', label: 'Brain' },
  { emoji: '🧩', label: 'Puzzle' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '👑', label: 'Crown' },
  { emoji: '🦉', label: 'Owl' },
  { emoji: '🎒', label: 'Backpack' },
  { emoji: '📚', label: 'Books' },
  { emoji: '🎓', label: 'Graduation Cap' },
  { emoji: '🔍', label: 'Magnifier' }
];

export default function BadgeEmojiPicker({ value, onChange }: BadgeEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeLabel = CuratedEmojis.find(item => item.emoji === value)?.label || 'Badge';

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none hover:border-slate-700 transition-colors cursor-pointer select-none"
      >
        <span className="flex items-center gap-2">
          <span className="text-base select-none">{value}</span>
          <span>{activeLabel}</span>
        </span>
        <span className="text-[10px] text-slate-500">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[105%] z-30 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl w-60 animate-scaleUp">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Select Reward Badge</div>
          <div className="grid grid-cols-5 gap-1.5">
            {CuratedEmojis.map(({ emoji, label }) => (
              <button
                key={emoji}
                type="button"
                title={label}
                onClick={() => {
                  onChange(emoji);
                  setIsOpen(false);
                }}
                className={`w-9 h-9 flex items-center justify-center text-lg rounded-xl transition-all cursor-pointer select-none border ${
                  value === emoji
                    ? 'bg-indigo-600/35 border-indigo-500 text-white font-black'
                    : 'bg-slate-950/40 border-slate-900 text-slate-350 hover:bg-slate-800 hover:text-white hover:scale-105'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
