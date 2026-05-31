'use client';

import { OrderSentencesQuestion } from '@/lib/worksheet-types';
import { useState, useEffect } from 'react';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface OrderSentencesEditorProps {
  question: OrderSentencesQuestion;
  onChange: (fields: Partial<OrderSentencesQuestion>) => void;
}

export default function OrderSentencesEditor({ question, onChange }: OrderSentencesEditorProps) {
  const getInitialRaw = () => {
    return question.sentences ? question.sentences.join('\n') : '';
  };

  const [rawText, setRawText] = useState(getInitialRaw());

  useEffect(() => {
    setRawText(getInitialRaw());
  }, [question.sentences]);

  const handleRawChange = (text: string) => {
    setRawText(text);
    const sentencesList = text.split('\n').map(s => s.trim()).filter(Boolean);
    onChange({
      sentences: sentencesList
    });
  };

  const sentences = question.sentences || [];

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Sentences in Correct Order (one per line)
        </label>
        <AutoExpandingTextarea
          value={rawText}
          onChange={(e) => handleRawChange(e.target.value)}
          placeholder="e.g.&#10; Dublin is the capital of Ireland.&#10;It has a population of over one million people.&#10;Many tourists visit the city every year."
          rows={3}
          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-350 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
        />
        <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
          Write the sentences in their correct logical/chronological sequence. The application will automatically shuffle them for pupils.
        </p>
      </div>

      {sentences.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
            Correct Sequence Preview ({sentences.length} sentences)
          </label>
          <div className="space-y-1.5 p-3.5 bg-slate-950/45 border border-slate-900 rounded-xl max-h-[220px] overflow-y-auto">
            {sentences.map((sent, idx) => (
              <div key={idx} className="flex gap-3 text-xs font-semibold text-slate-300">
                <span className="text-indigo-400 font-bold w-4 text-right select-none">{idx + 1}.</span>
                <p className="flex-1">{sent}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
