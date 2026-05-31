'use client';

import { useState, useEffect } from 'react';

interface OrderSentencesProps {
  question: {
    id: string;
    question: string;
    sentences: string[];
  };
  value: string[];
  onChange: (val: string[]) => void;
}

export default function OrderSentences({ question, value, onChange }: OrderSentencesProps) {
  const [shuffled, setShuffled] = useState<string[]>([]);

  useEffect(() => {
    if (value && Array.isArray(value) && value.length === question.sentences.length) {
      setShuffled(value);
    } else {
      let arr = [...question.sentences];
      // Shuffle at least until it is different from the correct order (if length > 1)
      let attempts = 0;
      while (attempts < 10 && arr.length > 1 && JSON.stringify(arr) === JSON.stringify(question.sentences)) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        attempts++;
      }
      setShuffled(arr);
      onChange(arr);
    }
  }, [question.id, question.sentences, value]);

  const moveSentence = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === shuffled.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...shuffled];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setShuffled(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      <div className="space-y-2.5 mt-4">
        {shuffled.map((sentence, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all shadow-sm"
          >
            <span className="text-slate-500 font-bold text-xs select-none w-5 text-right">
              {idx + 1}.
            </span>
            <p className="flex-grow text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed">
              {sentence}
            </p>
            <div className="flex gap-1.5 select-none">
              <button
                type="button"
                onClick={() => moveSentence(idx, 'up')}
                disabled={idx === 0}
                className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850/80 text-xs text-slate-400 disabled:opacity-20 hover:text-indigo-400 disabled:cursor-not-allowed hover:border-slate-750 transition-all flex items-center justify-center font-bold cursor-pointer"
                title="Move Up"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveSentence(idx, 'down')}
                disabled={idx === shuffled.length - 1}
                className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850/80 text-xs text-slate-400 disabled:opacity-20 hover:text-indigo-400 disabled:cursor-not-allowed hover:border-slate-750 transition-all flex items-center justify-center font-bold cursor-pointer"
                title="Move Down"
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
