'use client';

import { useState, useEffect } from 'react';
import { SentenceUnscrambleQuestion } from '@/lib/worksheet-types';

interface SentenceUnscrambleEditorProps {
  question: SentenceUnscrambleQuestion;
  onChange: (fields: Partial<SentenceUnscrambleQuestion>) => void;
}

export default function SentenceUnscrambleEditor({ question, onChange }: SentenceUnscrambleEditorProps) {
  const [rawText, setRawText] = useState(question.words ? question.words.join(' ') : '');

  useEffect(() => {
    setRawText(question.words ? question.words.join(' ') : '');
  }, [question.words]);

  const handleRawChange = (text: string) => {
    setRawText(text);
    const words = text.trim().split(/\s+/).filter(Boolean);
    onChange({ words });
  };

  return (
    <div className="space-y-2 pt-2">
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Unscramble Correct Sentence</label>
      <input
        type="text"
        value={rawText}
        onChange={(e) => handleRawChange(e.target.value)}
        placeholder="e.g. Liam found an old map in the attic"
        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
      />
    </div>
  );
}
