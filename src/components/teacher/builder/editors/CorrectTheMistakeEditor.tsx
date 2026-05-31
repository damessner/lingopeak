'use client';

import { CorrectTheMistakeQuestion } from '@/lib/worksheet-types';
import { useState, useEffect } from 'react';

interface CorrectTheMistakeEditorProps {
  question: CorrectTheMistakeQuestion;
  onChange: (fields: Partial<CorrectTheMistakeQuestion>) => void;
}

export default function CorrectTheMistakeEditor({ question, onChange }: CorrectTheMistakeEditorProps) {
  // Reconstruct the raw inline text representation on mount/update
  const getInitialRaw = () => {
    if (question.raw_text) return question.raw_text;
    if (question.text && question.mistake && question.correction) {
      // Find the mistake word in the text and replace it with mistake#correction
      const regex = new RegExp(`\\b${question.mistake}\\b`);
      return question.text.replace(regex, `${question.mistake}#${question.correction}`);
    }
    return question.text || '';
  };

  const [rawText, setRawText] = useState(getInitialRaw());

  useEffect(() => {
    setRawText(getInitialRaw());
  }, [question.text, question.mistake, question.correction, question.raw_text]);

  const handleRawChange = (val: string) => {
    setRawText(val);

    // Matches e.g., "do#does" or "go#goes" (preserving apostrophes if any)
    const regex = /(\b[a-zA-Z0-9'’]+)#([a-zA-Z0-9'’]+)\b/;
    const match = val.match(regex);

    if (match) {
      const incorrect = match[1];
      const correct = match[2];
      const cleanText = val.replace(regex, incorrect); // Student sees incorrect sentence initially

      onChange({
        text: cleanText,
        mistake: incorrect,
        correction: correct,
        raw_text: val
      });
    } else {
      onChange({
        text: val,
        mistake: '',
        correction: '',
        raw_text: val
      });
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Mistake Sentence (Write inline using incorrect#correct)
        </label>
        <input
          type="text"
          value={rawText}
          onChange={(e) => handleRawChange(e.target.value)}
          placeholder="e.g. He do#does his homework."
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-350 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
        />
        <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
          Write the whole sentence and put mistake#correction together. E.g. `He do#does his homework.` 
          or `They is#are going home.`
        </p>
      </div>

      {/* Dynamic Extraction Preview */}
      {question.mistake && question.correction && (
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/40 border border-slate-900 rounded-xl animate-fadeIn">
          <div>
            <span className="block text-[8px] font-black text-red-400 uppercase tracking-wider">Wrong Word (Mistake)</span>
            <span className="text-xs font-bold text-red-200">{question.mistake}</span>
          </div>
          <div>
            <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-wider">Correct Word (Correction)</span>
            <span className="text-xs font-bold text-emerald-250">{question.correction}</span>
          </div>
        </div>
      )}
    </div>
  );
}
