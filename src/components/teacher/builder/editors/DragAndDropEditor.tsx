'use client';

import { DragAndDropQuestion } from '@/lib/worksheet-types';

interface DragAndDropEditorProps {
  question: DragAndDropQuestion;
  onChange: (fields: Partial<DragAndDropQuestion>) => void;
}

export default function DragAndDropEditor({ question, onChange }: DragAndDropEditorProps) {
  const sentences = question.sentences || [''];
  const distractors_raw = question.distractors_raw || '';

  const handleAddSentence = () => {
    onChange({ sentences: [...sentences, ''] });
  };

  const handleRemoveSentence = (sIdx: number) => {
    onChange({ sentences: sentences.filter((_, i) => i !== sIdx) });
  };

  const handleSentenceChange = (sIdx: number, val: string) => {
    const updatedSentences = [...sentences];
    updatedSentences[sIdx] = val;
    onChange({ sentences: updatedSentences });
  };

  const handleDistractorsChange = (val: string) => {
    onChange({
      distractors_raw: val,
      distractors: val.split(',').map(s => s.trim()).filter(Boolean)
    });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-center">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Sentences (Wrap draggable words in #)
        </label>
        <button
          type="button"
          onClick={handleAddSentence}
          className="text-[9px] font-black bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 py-1.5 px-3 rounded-lg border border-indigo-500/10 cursor-pointer transition-colors"
        >
          + Add Sentence
        </button>
      </div>
      <div className="space-y-2">
        {sentences.map((sentence, sIdx) => (
          <div key={sIdx} className="flex gap-2 items-center">
            <span className="text-slate-500 font-bold text-xs w-4">{sIdx + 1}.</span>
            <input
              type="text"
              value={sentence}
              onChange={(e) => handleSentenceChange(sIdx, e.target.value)}
              placeholder="e.g. Grass is #green# in summer."
              className="flex-grow bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
            />
            <button
              type="button"
              disabled={sentences.length <= 1}
              onClick={() => handleRemoveSentence(sIdx)}
              className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-30 font-bold px-2 py-1.5 border border-slate-900 bg-slate-950 rounded-xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Extra Distractor Words (comma separated)</label>
        <input
          type="text"
          value={distractors_raw}
          onChange={(e) => handleDistractorsChange(e.target.value)}
          placeholder="e.g. yellow, black, brown"
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
        />
      </div>
    </div>
  );
}
