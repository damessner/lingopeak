'use client';

import { CorrectTheMistakeQuestion } from '@/lib/worksheet-types';

interface CorrectTheMistakeEditorProps {
  question: CorrectTheMistakeQuestion;
  onChange: (fields: Partial<CorrectTheMistakeQuestion>) => void;
}

export default function CorrectTheMistakeEditor({ question, onChange }: CorrectTheMistakeEditorProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Mistake Sentence</label>
        <input
          type="text"
          value={question.text || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="e.g. There is five books on the table."
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Wrong Word (Mistake)</label>
          <input
            type="text"
            value={question.mistake || ''}
            onChange={(e) => onChange({ mistake: e.target.value })}
            placeholder="e.g. is"
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Correction Word</label>
          <input
            type="text"
            value={question.correction || ''}
            onChange={(e) => onChange({ correction: e.target.value })}
            placeholder="e.g. are"
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
          />
        </div>
      </div>
    </div>
  );
}
