'use client';

import { QuestionType } from '@/lib/worksheet-types';

export const QUESTION_TYPES_META = [
  { id: 'multiple_choice', name: 'Multiple Choice (MCQ)', icon: '🔘', desc: 'Single correct answer from up to 4 choices.' },
  { id: 'fill_in_gap', name: 'Fill in the Gap', icon: '📝', desc: 'Enter words into brackets [like] this.' },
  { id: 'drag_and_drop', name: 'Drag & Drop Text', icon: '🖐️', desc: 'Drag answers into bracketed sentence slots.' },
  { id: 'category_sorting', name: 'Category Sorting', icon: '🗂️', desc: 'Sort items into defined category bins.' },
  { id: 'correct_the_mistake', name: 'Correct the Mistake', icon: '❌', desc: 'Identify a wrong word and type correction.' },
  { id: 'choice_matrix', name: 'Choice Matrix Grid', icon: '📊', desc: 'Map row options to correct columns.' },
  { id: 'sentence_unscramble', name: 'Sentence Unscramble', icon: '🧩', desc: 'Rearrange mixed-up words in order.' },
  { id: 'matching_pairs', name: 'Matching Pairs', icon: '🔗', desc: 'Link corresponding item pairs together.' },
  { id: 'crossword', name: 'Crossword Puzzle', icon: '🔠', desc: 'Spelling puzzle generated from clues.' },
  { id: 'word_search', name: 'Word Search Grid', icon: '🔍', desc: 'Find words hidden in a letter grid.' }
] as const;

interface QuestionTypePickerProps {
  onSelect: (type: QuestionType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuestionTypePicker({ onSelect, isOpen, onClose }: QuestionTypePickerProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 grid grid-cols-1 gap-2 z-50 max-h-[400px] overflow-y-auto">
      <div className="flex justify-between items-center px-2 pb-1 border-b border-slate-850">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Select Widget Type</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-xs font-bold"
        >
          ✕
        </button>
      </div>
      {QUESTION_TYPES_META.map(meta => (
        <button
          key={meta.id}
          type="button"
          onClick={() => {
            onSelect(meta.id as QuestionType);
            onClose();
          }}
          className="flex gap-3 text-left p-2 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-xl transition-all cursor-pointer"
        >
          <span className="text-2xl p-1.5 bg-slate-950/60 rounded-lg select-none">{meta.icon}</span>
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-tight">{meta.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5 leading-normal">{meta.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
