'use client';

import { useState, useEffect } from 'react';
import { Question, Category, QuestionType, Worksheet } from '@/lib/worksheet-types';

import QuestionCard from './builder/QuestionCard';
import { QUESTION_TYPES_META } from './builder/QuestionTypePicker';
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
  onDirtyChange?: (isDirty: boolean) => void;
}

export default function WorksheetBuilder({
  categories,
  worksheet,
  onSave,
  onCancel,
  onDirtyChange
}: WorksheetBuilderProps) {
  // Leverage custom state & actions hook, now tracking media URLs as well
  const {
    title,
    setTitle,
    categoryId,
    setCategoryId,
    tier,
    setTier,
    badgeEmoji,
    setBadgeEmoji,
    audioUrl,
    setAudioUrl,
    imageUrl,
    setImageUrl,
    videoUrl,
    setVideoUrl,
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
    localStorageKey,
    isDirty
  } = useWorksheetBuilder({ categories, worksheet });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modal & panel states
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  // Trigger onDirtyChange callback
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Window beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Form helper: add a new question
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion = {
      id: `q_${Date.now()}_${questions.length}`,
      type,
      question: '',
      ...(type === 'multiple_choice' && {
        options: ['', '', '', ''],
        answer: '',
        answers: [],
        isMulti: false
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
        items: []
      }),
      ...(type === 'correct_the_mistake' && {
        text: '',
        mistake: '',
        correction: '',
        raw_text: ''
      }),
      ...(type === 'choice_matrix' && {
        rows: [],
        columns: [],
        answers: {},
        matrix_raw_text: ''
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
      }),
      ...(type === 'order_sentences' && {
        sentences: []
      })
    } as any;
    setQuestions([...questions, newQuestion]);

    // Collapse other questions and expand the new one
    const newCollapsedState: Record<string, boolean> = {};
    questions.forEach(q => {
      newCollapsedState[q.id] = true;
    });
    newCollapsedState[newQuestion.id] = false;
    setCollapsedQuestions(newCollapsedState);

    // Smooth scroll to the bottom of the form
    setTimeout(() => {
      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: 'smooth'
      });
    }, 100);
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
        answer: '',
        answers: [],
        isMulti: false
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
        items: []
      }),
      ...(type === 'correct_the_mistake' && {
        text: '',
        mistake: '',
        correction: '',
        raw_text: ''
      }),
      ...(type === 'choice_matrix' && {
        rows: [],
        columns: [],
        answers: {},
        matrix_raw_text: ''
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
      }),
      ...(type === 'order_sentences' && {
        sentences: []
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

  // Export JSON handler
  const handleExportJSON = () => {
    const data = {
      title,
      categoryId,
      tier,
      badgeEmoji,
      audioUrl,
      imageUrl,
      videoUrl,
      questions
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'worksheet'}_export.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON handler
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isDirty) {
      if (!confirm('Importing this file will overwrite your current worksheet. Are you sure you want to proceed?')) {
        e.target.value = '';
        return;
      }
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.questions && Array.isArray(parsed.questions)) {
          setTitle(parsed.title || '');
          setCategoryId(parsed.categoryId || categories[0]?.id || '');
          setTier(parsed.tier || 'EXPLORER');
          setBadgeEmoji(parsed.badgeEmoji || '🥇');
          setAudioUrl(parsed.audioUrl || '');
          setImageUrl(parsed.imageUrl || '');
          setVideoUrl(parsed.videoUrl || '');
          setQuestions(parsed.questions);
          setError(null);
          displayMessage('Worksheet JSON imported successfully!', 'success');
        } else {
          alert('Invalid JSON structure: missing questions array.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Cancel intercept handler
  const handleCancelClick = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return;
      }
    }
    onCancel();
  };

  // Keyboard Shortcuts
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

    // Dynamic processing of drag and drop correct answers
    const processedQuestions = questions.map((q) => {
      const qCopy = { ...q } as any;
      if (q.type === 'drag_and_drop') {
        const correctWords: string[] = [];
        (q.sentences || []).forEach((s: string) => {
          const normalized = s.replace(/#([^#]+)#/g, '[$1]');
          const matches = normalized.match(/\[([^\]]+)\]/g) || [];
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
          badgeEmoji,
          audioUrl: audioUrl.trim() || null,
          imageUrl: imageUrl.trim() || null,
          videoUrl: videoUrl.trim() || null
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
    <div className="space-y-6 max-w-6xl mx-auto animate-scaleUp">
      {/* Draft Recovery Banner */}
      {hasDraft && (
        <div className="bg-indigo-950/80 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-300">
          <div className="flex items-center gap-2">
            <span>💾</span>
            <span>We found an unsaved local draft of this worksheet from {draftTime || 'recently'}.</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={recoverDraft}
              className="bg-indigo-650 hover:bg-indigo-550 text-white px-3.5 py-1.5 rounded-xl cursor-pointer font-extrabold text-[10px] transition-colors"
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

      {/* Main Form Elements layout split double pane */}
      <form onSubmit={handleSaveSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side Pane: Sticky Widget Picker & Media Attachments */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          
          {/* Widget Selection Block */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-3">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800/65 pb-2">
              Select Widget Type
            </h3>
            <div className="grid grid-cols-1 gap-1.5 max-h-[380px] lg:max-h-[500px] overflow-y-auto pr-1">
              {QUESTION_TYPES_META.map(meta => (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => handleAddQuestion(meta.id)}
                  className="flex items-center gap-3 text-left w-full p-2.5 bg-slate-950/40 hover:bg-indigo-650/15 border border-slate-900 hover:border-indigo-500/25 rounded-xl transition-all cursor-pointer group"
                >
                  <span className="text-xl bg-slate-900 border border-slate-800 group-hover:bg-slate-950 p-1.5 rounded-lg select-none">
                    {meta.icon}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200 group-hover:text-white uppercase tracking-tight">
                      {meta.name.split(' (')[0]}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">
                      {meta.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Media Attachments Block */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-md space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-800/65 pb-2">
              Media Attachments
            </h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Audio URL (.mp3 / .wav)
                </label>
                <input
                  type="text"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  Image URL (.jpeg / .png)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  YouTube / Video URL
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-350 outline-none focus:border-indigo-500 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Pane: Core Settings & Questions List */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header Row Actions */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 md:p-6 shadow-xl flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-black px-2.5 py-1 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
                {worksheet?.id ? 'Edit Worksheet' : 'Create Worksheet'}
              </span>
              <h2 className="text-lg font-black text-white uppercase tracking-tight mt-1.5">
                {title.trim() || 'Untitled Worksheet'}
              </h2>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Undo/Redo */}
              <div className="flex bg-slate-950 border border-slate-850 rounded-xl overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!canUndo}
                  className="text-xs hover:bg-slate-900 disabled:opacity-20 text-slate-400 font-bold px-3 py-2 cursor-pointer border-r border-slate-850 transition-colors select-none"
                  title="Undo change (Ctrl+Z)"
                >
                  ↩ Undo
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!canRedo}
                  className="text-xs hover:bg-slate-900 disabled:opacity-20 text-slate-400 font-bold px-3 py-2 cursor-pointer transition-colors select-none"
                  title="Redo change (Ctrl+Y)"
                >
                  ↪ Redo
                </button>
              </div>

              {/* JSON import/export */}
              <div className="flex bg-slate-950 border border-slate-850 rounded-xl overflow-hidden mr-1">
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="text-xs hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-2 cursor-pointer transition-colors border-r border-slate-850 select-none"
                  title="Export to JSON"
                >
                  📥 Export
                </button>
                <label
                  className="text-xs hover:bg-slate-900 text-indigo-400 hover:text-indigo-300 font-bold px-3 py-2 cursor-pointer transition-colors select-none flex items-center"
                  title="Import from JSON"
                >
                  📤 Import
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowTemplatePicker(true)}
                className="text-xs bg-slate-900 hover:bg-slate-850 text-indigo-455 hover:text-indigo-400 font-bold border border-slate-800 px-3.5 py-2 rounded-xl cursor-pointer transition-colors"
              >
                📋 Template
              </button>
              <button
                type="button"
                onClick={() => setShowTestDrive(true)}
                disabled={questions.length === 0}
                className="text-xs bg-emerald-600/10 hover:bg-emerald-600/25 disabled:bg-slate-900 text-emerald-400 disabled:text-slate-600 font-bold border border-emerald-500/20 px-3.5 py-2 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-colors"
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

          {/* Core settings form block */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-5 md:p-6 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Worksheet Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Present Perfect Practice"
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Syllabus Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.unit_title.slice(0, 15)}...] {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Difficulty Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                <option value="EXPLORER">EXPLORER (Easy)</option>
                <option value="VOYAGER">VOYAGER (Medium)</option>
                <option value="CHALLENGER">CHALLENGER (Hard)</option>
                <option value="SUMMIT">SUMMIT (Test)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Reward Badge</label>
              <BadgeEmojiPicker value={badgeEmoji} onChange={setBadgeEmoji} />
            </div>
          </div>

          {/* AI Co-Pilot Toggle Panel */}
          <AICoPilotPanel
            isOpen={aiPanelOpen}
            onToggle={() => setAiPanelOpen(!aiPanelOpen)}
            tier={tier}
            onGenerateQuestions={(newQuestions) => {
              setQuestions(newQuestions);
              displayMessage('AI Questions generated successfully!', 'success');
            }}
          />

          {/* Interactive Questions list */}
          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-white uppercase tracking-wider">
                Questions Checklist ({questions.length})
              </h3>
              
              <button
                type="button"
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-black py-2 px-4 rounded-xl cursor-pointer transition-all uppercase tracking-wider"
              >
                🤖 AI Co-Pilot
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="p-16 bg-slate-950/20 border border-dashed border-slate-850 rounded-3xl text-center">
                <span className="text-4xl block filter grayscale opacity-45 select-none mb-3">📋</span>
                <p className="text-slate-500 text-xs font-medium">
                  No questions added yet. Click on the widget type buttons on the left to start building.
                </p>
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
                        onDragOver={() => {}}
                        onDragEnd={() => setDraggedIndex(null)}
                        isDragged={draggedIndex === idx}
                      />
                    </ErrorBoundary>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer controls */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80 font-bold">
            <button
              type="button"
              onClick={handleCancelClick}
              className="bg-slate-900 hover:bg-slate-855 text-slate-400 hover:text-slate-350 border border-slate-800 text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
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

// Inline message display dispatch fallback
function displayMessage(text: string, type: 'success' | 'error') {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('lingopeak_message', { detail: { text, type } });
    window.dispatchEvent(event);
  }
}
