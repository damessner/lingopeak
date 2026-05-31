'use client';

import { useState, useEffect } from 'react';
import { Question, Category, QuestionType, Worksheet } from '@/lib/worksheet-types';

import QuestionCard from './builder/QuestionCard';
import QuestionTypePicker from './builder/QuestionTypePicker';
import TemplatePicker from './builder/TemplatePicker';
import TestDriveModal from './builder/TestDriveModal';

import { useWorksheetBuilder } from './builder/useWorksheetBuilder';
import { validateQuestion } from './builder/WorksheetValidation';
import AICoPilotPanel from './builder/AICoPilotPanel';
import BadgeEmojiPicker from './builder/BadgeEmojiPicker';
import ErrorBoundary from './builder/ErrorBoundary';

interface WorksheetBuilderProps {
  categories: Category[];
  worksheet: Worksheet | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function WorksheetBuilder({ categories, worksheet, onSave, onCancel }: WorksheetBuilderProps) {
  // Leverage extracted custom state & actions hook
  const {
    title,
    setTitle,
    categoryId,
    setCategoryId,
    tier,
    setTier,
    badgeEmoji,
    setBadgeEmoji,
    questions,
    setQuestions,
    undo,
    redo,
    canUndo,
    canRedo,
    hasDraft,
    draftTime,
    recoverDraft,
    discardDraft,
    localStorageKey
  } = useWorksheetBuilder({ categories, worksheet });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & palette visibility states
  const [showTypePalette, setShowTypePalette] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Form helper: add a new question
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion = {
      id: `q_${Date.now()}_${questions.length}`,
      type,
      question: '',
      ...(type === 'multiple_choice' && {
        options: ['', '', '', ''],
        answer: ''
      }),
      ...(type === 'fill_in_gap' && {
        text: ''
      }),
      ...(type === 'sentence_unscramble' && {
        words: []
      }),
      ...(type === 'matching_pairs' && {
        pairs: { '': '' }
      }),
      ...(type === 'drag_and_drop' && {
        sentences: [''],
        distractors: [],
        distractors_raw: ''
      }),
      ...(type === 'category_sorting' && {
        categories: ['', ''],
        categories_raw: '',
        items: [{ text: '', category: '' }]
      }),
      ...(type === 'correct_the_mistake' && {
        text: '',
        mistake: '',
        correction: ''
      }),
      ...(type === 'choice_matrix' && {
        rows: [''],
        rows_raw: '',
        columns: [''],
        columns_raw: '',
        answers: {}
      }),
      ...(type === 'crossword' && {
        crossword_items: [{ word: '', clue: '' }],
        grid: [],
        clues: []
      }),
      ...(type === 'word_search' && {
        word_search_words: '',
        words: [],
        grid: []
      })
    } as any;
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, idx) => idx !== index));
  };

  const handleDuplicateQuestion = (index: number) => {
    const original = questions[index];
    const duplicate: Question = {
      ...JSON.parse(JSON.stringify(original)),
      id: `q_dup_${Date.now()}_${index}`
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicate);
    setQuestions(updated);
  };

  const handleQuestionChange = (index: number, updatedField: Partial<Question>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updatedField } as Question;
    setQuestions(updated);
  };

  const handleResetQuestion = (index: number) => {
    const type = questions[index].type;
    const defaultQuestion = {
      id: questions[index].id,
      type,
      question: '',
      ...(type === 'multiple_choice' && {
        options: ['', '', '', ''],
        answer: ''
      }),
      ...(type === 'fill_in_gap' && {
        text: ''
      }),
      ...(type === 'sentence_unscramble' && {
        words: []
      }),
      ...(type === 'matching_pairs' && {
        pairs: { '': '' }
      }),
      ...(type === 'drag_and_drop' && {
        sentences: [''],
        distractors: [],
        distractors_raw: ''
      }),
      ...(type === 'category_sorting' && {
        categories: ['', ''],
        categories_raw: '',
        items: [{ text: '', category: '' }]
      }),
      ...(type === 'correct_the_mistake' && {
        text: '',
        mistake: '',
        correction: ''
      }),
      ...(type === 'choice_matrix' && {
        rows: [''],
        rows_raw: '',
        columns: [''],
        columns_raw: '',
        answers: {}
      }),
      ...(type === 'crossword' && {
        crossword_items: [{ word: '', clue: '' }],
        grid: [],
        clues: []
      }),
      ...(type === 'word_search' && {
        word_search_words: '',
        words: [],
        grid: []
      })
    } as any;
    const updated = [...questions];
    updated[index] = defaultQuestion;
    setQuestions(updated);
  };

  const toggleCollapse = (qId: string) => {
    setCollapsedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  // Keyboard Shortcuts hook integrating undo/redo callbacks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Z: Undo
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      }
      
      // Ctrl + Y: Redo
      if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) redo();
      }

      // Ctrl + Enter or Ctrl + S to save
      if ((e.ctrlKey && e.key === 'Enter') || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        const btn = document.getElementById('worksheet-save-btn');
        if (btn) btn.click();
      }
      
      // Ctrl + Alt + N or Ctrl + I to toggle palette
      if ((e.ctrlKey && e.altKey && e.key === 'n') || (e.ctrlKey && e.key === 'i')) {
        e.preventDefault();
        setShowTypePalette(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Submit to API
  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Worksheet title is required.');
      return;
    }
    if (questions.length === 0) {
      setError('Please add at least one question to the worksheet.');
      return;
    }

    // Call pure validation helper
    for (let i = 0; i < questions.length; i++) {
      const errMessage = validateQuestion(questions[i], i);
      if (errMessage) {
        setError(errMessage);
        return;
      }
    }

    setSaving(true);
    setError(null);

    const processedQuestions = questions.map((q) => {
      const qCopy = { ...q } as any;
      if (q.type === 'drag_and_drop') {
        const correctWords: string[] = [];
        (q.sentences || []).forEach((s: string) => {
          const matches = s.match(/\[([^\]]+)\]/g) || [];
          matches.forEach(m => correctWords.push(m.slice(1, -1).trim()));
        });
        const dists = q.distractors || [];
        qCopy.words = Array.from(new Set([...correctWords, ...dists]));
      }
      return qCopy;
    });

    try {
      const res = await fetch('/api/teacher/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheet?.id,
          title: title.trim(),
          categoryId,
          tier,
          questions: processedQuestions,
          badgeEmoji
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save worksheet');
      }

      // Clear local draft upon successful save
      localStorage.removeItem(localStorageKey);

      onSave();
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 max-w-4xl mx-auto animate-scaleUp">
      
      {/* Draft Recovery Banner */}
      {hasDraft && (
        <div className="bg-indigo-950/80 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-300 animate-scaleUp">
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span>We found an unsaved local draft of this worksheet from {draftTime || 'recently'}.</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={recoverDraft}
              className="bg-indigo-600 hover:bg-indigo-550 text-white px-3.5 py-1.5 rounded-xl cursor-pointer font-extrabold text-[10px] transition-colors"
            >
              Recover Draft
            </button>
            <button
              type="button"
              onClick={discardDraft}
              className="bg-slate-900 hover:bg-slate-855 text-slate-400 px-3.5 py-1.5 rounded-xl cursor-pointer border border-slate-800 font-bold text-[10px] transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4 flex justify-between items-center">
        <div>
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
            {worksheet?.id ? 'Edit Custom Widget' : 'New Custom Widget'}
          </span>
          <h2 className="text-xl font-extrabold text-white tracking-tight mt-2 uppercase">
            {worksheet?.id ? 'Worksheet Editor' : 'Worksheet Creator'}
          </h2>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap">
          {/* Undo/Redo Buttons */}
          <div className="flex bg-slate-950 border border-slate-850 rounded-xl overflow-hidden mr-2">
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              className="text-xs hover:bg-slate-900 disabled:opacity-25 text-slate-350 font-bold px-3 py-2 cursor-pointer transition-colors border-r border-slate-855 select-none"
              title="Undo change (Ctrl+Z)"
            >
              ↩ Undo
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={!canRedo}
              className="text-xs hover:bg-slate-900 disabled:opacity-25 text-slate-355 font-bold px-3 py-2 cursor-pointer transition-colors select-none"
              title="Redo change (Ctrl+Y)"
            >
              ↪ Redo
            </button>
          </div>
          
          <button
            type="button"
            onClick={() => setShowTemplatePicker(true)}
            className="text-xs bg-slate-900 hover:bg-slate-855 text-indigo-400 hover:text-indigo-300 font-bold border border-slate-800 px-4 py-2 rounded-xl cursor-pointer transition-colors"
          >
            📋 Use Template
          </button>
          <button
            type="button"
            onClick={() => setShowTestDrive(true)}
            disabled={questions.length === 0}
            className="text-xs bg-emerald-600/10 hover:bg-emerald-600/25 disabled:bg-slate-900 text-emerald-400 disabled:text-slate-650 font-bold border border-emerald-500/20 px-4 py-2 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            🎮 Test Drive
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Extracted AI Co-Pilot Panel */}
      <AICoPilotPanel
        isOpen={aiPanelOpen}
        onToggle={() => setAiPanelOpen(!aiPanelOpen)}
        tier={tier}
        onGenerateQuestions={(newQuestions) => {
          setQuestions(newQuestions);
          displayMessage('AI Questions generated successfully!', 'success');
        }}
      />

      {/* Editor Form */}
      <form onSubmit={handleSaveSubmit} className="space-y-6">
        
        {/* Core details row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2 md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Worksheet Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Present Perfect Practice"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  [{cat.unit_title.slice(0, 15)}...] {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Difficulty Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="EXPLORER">EXPLORER (Easy)</option>
              <option value="VOYAGER">VOYAGER (Medium)</option>
              <option value="CHALLENGER">CHALLENGER (Hard)</option>
              <option value="SUMMIT">SUMMIT (Test)</option>
            </select>
          </div>

          {/* Curated reward badge popover grid picker */}
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward Badge</label>
            <BadgeEmojiPicker value={badgeEmoji} onChange={setBadgeEmoji} />
          </div>
        </div>

        {/* Questions Box */}
        <div className="space-y-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Questions List ({questions.length})</h3>
            
            {/* Quick add dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTypePalette(!showTypePalette)}
                className="bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-xs font-bold py-2 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 select-none"
              >
                <span>➕ Add Interactive Widget</span>
                <span className="text-[10px] opacity-75">{showTypePalette ? '▲' : '▼'}</span>
              </button>
              
              <QuestionTypePicker
                isOpen={showTypePalette}
                onClose={() => setShowTypePalette(false)}
                onSelect={handleAddQuestion}
              />
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-10 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-center">
              <span className="text-3xl block filter grayscale opacity-40 select-none mb-2">📋</span>
              <p className="text-slate-500 text-xs italic">No questions added yet. Use the button above to build your worksheet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => {
                const isCollapsed = !!collapsedQuestions[q.id];
                
                return (
                  <ErrorBoundary
                    key={q.id}
                    onReset={() => handleResetQuestion(idx)}
                    onDelete={() => handleRemoveQuestion(idx)}
                  >
                    <QuestionCard
                      question={q}
                      index={idx}
                      totalQuestions={questions.length}
                      isCollapsed={isCollapsed}
                      onToggleCollapse={() => toggleCollapse(q.id)}
                      onMoveUp={() => handleMoveQuestion(idx, 'up')}
                      onMoveDown={() => handleMoveQuestion(idx, 'down')}
                      onRemove={() => handleRemoveQuestion(idx)}
                      onDuplicate={() => handleDuplicateQuestion(idx)}
                      onChange={(fields) => handleQuestionChange(idx, fields)}
                      onDragStart={(e) => {
                        setDraggedIndex(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex === null || draggedIndex === idx) return;
                        const updated = [...questions];
                        const [draggedItem] = updated.splice(draggedIndex, 1);
                        updated.splice(idx, 0, draggedItem);
                        setQuestions(updated);
                        setDraggedIndex(null);
                      }}
                      onDragEnd={() => setDraggedIndex(null)}
                      isDragged={draggedIndex === idx}
                    />
                  </ErrorBoundary>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer save/cancel row */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80 font-bold">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-slate-300 border border-slate-800 text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
            style={{ minHeight: '40px' }}
          >
            Cancel
          </button>
          <button
            id="worksheet-save-btn"
            type="submit"
            disabled={saving}
            className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-indigo-500/20 cursor-pointer transition-all disabled:opacity-50"
            style={{ minHeight: '40px' }}
          >
            {saving ? 'Saving...' : 'Save & Publish Worksheet'}
          </button>
        </div>

      </form>

      {/* Modals */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={(newQuestions, badge) => {
          setQuestions([...questions, ...newQuestions]);
          setBadgeEmoji(badge);
        }}
      />

      <TestDriveModal
        isOpen={showTestDrive}
        onClose={() => setShowTestDrive(false)}
        title={title}
        tier={tier}
        questions={questions}
      />

    </div>
  );
}

// Inline helper fallback if not passed down via context
function displayMessage(text: string, type: 'success' | 'error') {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('lingopeak_message', { detail: { text, type } });
    window.dispatchEvent(event);
  }
}
