'use client';

import { FillInGapQuestion } from '@/lib/worksheet-types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface FillInGapEditorProps {
  question: FillInGapQuestion;
  onChange: (fields: Partial<FillInGapQuestion>) => void;
}

export default function FillInGapEditor({ question, onChange }: FillInGapEditorProps) {
  return (
    <div className="space-y-2 pt-2">
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
        Gap Text Block (Wrap gap-words in #)
      </label>
      <AutoExpandingTextarea
        value={question.text || ''}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Write the sentence. e.g. She #drives# (drive) to work."
        rows={3}
        className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-350 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
      />
      <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
        Wrap correct answers in hash marks like `#drives#`. Optional: provide base form hints in parentheses, e.g., `(drive)`.
      </p>
    </div>
  );
}
