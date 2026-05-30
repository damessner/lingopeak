'use client';

import { useState, useEffect } from 'react';

interface SentenceUnscrambleProps {
  question: {
    id: string;
    question: string;
    words: string[]; // Correct order, e.g. ["The", "teacher", "is", "helping", "us"]
  };
  value: string[]; // Order selected by student
  onChange: (val: string[]) => void;
}

export default function SentenceUnscramble({ question, value, onChange }: SentenceUnscrambleProps) {
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const selectedList = value || [];

  // Shuffle the word pool once on mount or when words change
  useEffect(() => {
    const shuffle = () => {
      const items = [...question.words];
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      // If by chance the shuffled array matches the correct array, swap elements
      if (items.join(' ') === question.words.join(' ') && items.length > 1) {
        [items[0], items[1]] = [items[1], items[0]];
      }
      setShuffledWords(items);
    };
    shuffle();
  }, [question.words]);

  const handlePoolWordTap = (word: string, index: number) => {
    // Add word to selection list
    const updated = [...selectedList, word];
    onChange(updated);

    // Remove word instance from shuffled pool (only matching first index to avoid multi-instance bugs)
    const updatedPool = [...shuffledWords];
    updatedPool.splice(index, 1);
    setShuffledWords(updatedPool);
  };

  const handleSelectedWordTap = (word: string, index: number) => {
    // Remove from selection list
    const updated = [...selectedList];
    updated.splice(index, 1);
    onChange(updated);

    // Add back to pool
    setShuffledWords([...shuffledWords, word]);
  };

  const handleReset = () => {
    onChange([]);
    // Reshuffle original words
    const items = [...question.words];
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    setShuffledWords(items);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      {/* Assembled Sentence Arena */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Assembled Sentence</label>
        <div className="w-full min-h-[72px] p-4 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl flex flex-wrap gap-2.5 items-center">
          {selectedList.length === 0 ? (
            <span className="text-slate-600 text-xs italic m-auto select-none">Tap words in the pool below to arrange them</span>
          ) : (
            selectedList.map((word, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectedWordTap(word, idx)}
                className="bg-indigo-600 border border-indigo-500 text-white font-bold text-sm py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 animate-scaleUp select-none"
              >
                {word}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Words Pool */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Word Pool</label>
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-[10px] font-bold text-red-400 hover:text-red-300 uppercase tracking-widest cursor-pointer"
            >
              Reset ↺
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-900/20 border border-slate-800 rounded-2xl min-h-[72px] items-center justify-center">
          {shuffledWords.length === 0 && selectedList.length > 0 ? (
            <span className="text-indigo-400 text-xs font-bold animate-pulse">✨ Perfect order! Tapped all words.</span>
          ) : (
            shuffledWords.map((word, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePoolWordTap(word, idx)}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm py-2.5 px-4 rounded-xl transition-all cursor-pointer hover:scale-105 active:scale-95 select-none"
              >
                {word}
              </button>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
