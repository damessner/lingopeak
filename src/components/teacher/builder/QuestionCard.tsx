'use client';

import { useState } from 'react';
import { Question } from '@/lib/worksheet-types';

// Import Editors
import MultipleChoiceEditor from './editors/MultipleChoiceEditor';
import FillInGapEditor from './editors/FillInGapEditor';
import DragAndDropEditor from './editors/DragAndDropEditor';
import CategorySortingEditor from './editors/CategorySortingEditor';
import CorrectTheMistakeEditor from './editors/CorrectTheMistakeEditor';
import ChoiceMatrixEditor from './editors/ChoiceMatrixEditor';
import SentenceUnscrambleEditor from './editors/SentenceUnscrambleEditor';
import MatchingPairsEditor from './editors/MatchingPairsEditor';
import CrosswordEditor from './editors/CrosswordEditor';
import WordSearchEditor from './editors/WordSearchEditor';

// Import Student Widgets
import MultipleChoice from '@/components/worksheets/MultipleChoice';
import FillInGap from '@/components/worksheets/FillInGap';
import DragAndDrop from '@/components/worksheets/DragAndDrop';
import CategorySorting from '@/components/worksheets/CategorySorting';
import CorrectTheMistake from '@/components/worksheets/CorrectTheMistake';
import ChoiceMatrix from '@/components/worksheets/ChoiceMatrix';
import Crossword from '@/components/worksheets/Crossword';
import SentenceUnscramble from '@/components/worksheets/SentenceUnscramble';
import MatchingPairs from '@/components/worksheets/MatchingPairs';
import WordSearch from '@/components/worksheets/WordSearch';

interface QuestionCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onChange: (fields: Partial<Question>) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragged: boolean;
}

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  isCollapsed,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
  onChange,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragged
}: QuestionCardProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const [previewVal, setPreviewVal] = useState<any>(null);
  const [smartFilling, setSmartFilling] = useState(false);
  const [flash, setFlash] = useState(false);

  const handleSmartFill = async () => {
    setSmartFilling(true);
    try {
      const res = await fetch('/api/teacher/worksheets/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'smart_fill', question })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.question) {
          onChange(data.question);
          setFlash(true);
          setTimeout(() => setFlash(false), 1200);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Smart Fill failed.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error. Failed to run smart fill.');
    } finally {
      setSmartFilling(false);
    }
  };

  const renderEditor = () => {
    switch (question.type) {
      case 'multiple_choice':
        return <MultipleChoiceEditor question={question} onChange={onChange as any} qIdx={index} />;
      case 'fill_in_gap':
        return <FillInGapEditor question={question} onChange={onChange as any} />;
      case 'drag_and_drop':
        return <DragAndDropEditor question={question} onChange={onChange as any} />;
      case 'category_sorting':
        return <CategorySortingEditor question={question} onChange={onChange as any} />;
      case 'correct_the_mistake':
        return <CorrectTheMistakeEditor question={question} onChange={onChange as any} />;
      case 'choice_matrix':
        return <ChoiceMatrixEditor question={question} onChange={onChange as any} />;
      case 'sentence_unscramble':
        return <SentenceUnscrambleEditor question={question} onChange={onChange as any} />;
      case 'matching_pairs':
        return <MatchingPairsEditor question={question} onChange={onChange as any} />;
      case 'crossword':
        return <CrosswordEditor question={question} onChange={onChange as any} />;
      case 'word_search':
        return <WordSearchEditor question={question} onChange={onChange as any} />;
      default:
        return null;
    }
  };

  const renderStudentPreview = () => {
    // Standard mock onChange props for student view rendering
    const props = {
      question: question as any,
      value: previewVal,
      onChange: setPreviewVal
    };

    switch (question.type) {
      case 'multiple_choice':
        return <MultipleChoice {...props} />;
      case 'fill_in_gap':
        return <FillInGap {...props} />;
      case 'drag_and_drop':
        return <DragAndDrop {...props} />;
      case 'category_sorting':
        return <CategorySorting {...props} />;
      case 'correct_the_mistake':
        return <CorrectTheMistake {...props} />;
      case 'choice_matrix':
        return <ChoiceMatrix {...props} />;
      case 'sentence_unscramble':
        return <SentenceUnscramble {...props} />;
      case 'matching_pairs':
        return <MatchingPairs {...props} />;
      case 'crossword':
        return <Crossword {...props} />;
      case 'word_search':
        return <WordSearch {...props} />;
      default:
        return null;
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`bg-slate-950/40 border p-5 rounded-2xl space-y-4 relative transition-all duration-500 ${
        isDragged ? 'opacity-40 border-dashed border-indigo-500' : ''
      } ${
        flash ? 'border-emerald-500 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/25' : 'border-slate-850'
      }`}
    >
      {/* Header: Click to collapse / expand, reorder, delete */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
        <div
          onClick={onToggleCollapse}
          className="flex items-center gap-2 cursor-pointer select-none flex-grow"
        >
          <span className="cursor-grab text-slate-650 hover:text-slate-400 px-1 text-base select-none">☰</span>
          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300">
            {index + 1}
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {question.type.replace(/_/g, ' ')}
          </span>
          {isCollapsed && question.question && (
            <span className="text-xs text-slate-500 truncate font-semibold max-w-sm ml-2">
              - {question.question}
            </span>
          )}
          <span className="text-[10px] text-indigo-400 font-bold ml-2">
            {isCollapsed ? '[Expand]' : '[Collapse]'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 rounded hover:text-indigo-400 cursor-pointer"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
            className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 rounded hover:text-indigo-400 cursor-pointer"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="text-[10px] font-bold px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 hover:text-indigo-400 rounded cursor-pointer transition-all ml-1.5"
          >
            Duplicate 👥
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="text-[10px] font-bold px-2.5 py-1 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded cursor-pointer transition-all ml-4"
          >
            Delete ✕
          </button>
        </div>
      </div>

      {/* Question Content (hidden when collapsed) */}
      {!isCollapsed && (
        <div className="space-y-4 animate-scaleUp">
          
          {/* Action Row: Preview Toggle, AI Smart Fill */}
          <div className="flex justify-between items-center gap-4 bg-slate-950/30 p-2 border border-slate-900 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">View Mode:</span>
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`text-[10px] font-extrabold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  !previewMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                ✏️ Edit Mode
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`text-[10px] font-extrabold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  previewMode ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                👁️ Student Preview
              </button>
            </div>

            <button
              type="button"
              onClick={handleSmartFill}
              disabled={smartFilling || previewMode}
              className="bg-indigo-500/10 hover:bg-indigo-500/25 disabled:bg-slate-900 text-indigo-300 disabled:text-slate-650 border border-indigo-500/10 text-[10px] font-black py-1.5 px-3.5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all uppercase tracking-wider flex items-center gap-1.5"
            >
              <span>{smartFilling ? '✨ Auto-Filling...' : '✨ AI Smart Fill'}</span>
            </button>
          </div>

          {previewMode ? (
            <div className="p-4 bg-slate-950/20 border border-slate-900 rounded-2xl">
              {renderStudentPreview()}
            </div>
          ) : (
            <>
              {/* Shared prompt/instructions field */}
              <div className="space-y-1">
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Question prompt / Instruction text</label>
                <input
                  type="text"
                  value={question.question}
                  onChange={(e) => onChange({ question: e.target.value })}
                  placeholder="e.g. Choose the correct past tense form"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              {renderEditor()}
            </>
          )}

        </div>
      )}

    </div>
  );
}
