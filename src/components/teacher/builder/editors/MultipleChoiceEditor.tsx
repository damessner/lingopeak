'use client';

import { MultipleChoiceQuestion } from '@/lib/worksheet-types';

interface MultipleChoiceEditorProps {
  question: MultipleChoiceQuestion;
  onChange: (fields: Partial<MultipleChoiceQuestion>) => void;
  qIdx: number;
}

export default function MultipleChoiceEditor({ question, onChange, qIdx }: MultipleChoiceEditorProps) {
  const options = question.options || ['', '', '', ''];

  const handleOptionChange = (optIdx: number, val: string) => {
    const updatedOptions = [...options];
    updatedOptions[optIdx] = val;
    onChange({ options: updatedOptions });
  };

  return (
    <div className="space-y-3 pt-2">
      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Choices & Correct Answer</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt, optIdx) => (
          <div key={optIdx} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
            <input
              type="radio"
              name={`answer_${question.id}`}
              checked={question.answer === opt && opt !== ''}
              onChange={() => onChange({ answer: opt })}
              disabled={opt === ''}
              className="w-4 h-4 text-indigo-650 border-slate-800 bg-slate-950 focus:ring-indigo-500 cursor-pointer"
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(optIdx, e.target.value)}
              placeholder={`Choice ${optIdx + 1}`}
              className="flex-grow bg-slate-950 border border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
