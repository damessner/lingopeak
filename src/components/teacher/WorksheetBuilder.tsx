'use client';

import { useState, useEffect } from 'react';
import { Question, Category, QuestionType, Worksheet } from '@/lib/worksheet-types';
import { generateWordSearch, generateCrossword } from '@/lib/gridGenerators';

import QuestionCard from './builder/QuestionCard';
import QuestionTypePicker from './builder/QuestionTypePicker';
import TemplatePicker from './builder/TemplatePicker';
import TestDriveModal from './builder/TestDriveModal';

interface WorksheetBuilderProps {
  categories: Category[];
  worksheet: Worksheet | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function WorksheetBuilder({ categories, worksheet, onSave, onCancel }: WorksheetBuilderProps) {
  const [title, setTitle] = useState(worksheet?.title || '');
  const [categoryId, setCategoryId] = useState(worksheet?.category_id || categories[0]?.id || '');
  const [tier, setTier] = useState<'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT'>(worksheet?.tier || 'EXPLORER');
  const [badgeEmoji, setBadgeEmoji] = useState(worksheet?.badge_emoji || '🥇');
  
  // Parse initial questions
  const getInitialQuestions = (): Question[] => {
    if (!worksheet?.questions_json) return [];
    try {
      const parsed = JSON.parse(worksheet.questions_json);
      if (!Array.isArray(parsed)) return [];
      
      return parsed.map((q: any) => {
        const mapped = { ...q };
        if (q.type === 'drag_and_drop') {
          const correctWords: string[] = [];
          (q.sentences || []).forEach((s: string) => {
            const matches = s.match(/\[([^\]]+)\]/g) || [];
            matches.forEach(m => correctWords.push(m.slice(1, -1).trim()));
          });
          const allWords = q.words || [];
          const distractors = allWords.filter((w: string) => !correctWords.includes(w));
          mapped.distractors = distractors;
          mapped.distractors_raw = distractors.join(', ');
        } else if (q.type === 'category_sorting') {
          mapped.categories_raw = (q.categories || []).join(', ');
        } else if (q.type === 'choice_matrix') {
          mapped.rows_raw = (q.rows || []).join(', ');
          mapped.columns_raw = (q.columns || []).join(', ');
        } else if (q.type === 'crossword') {
          mapped.crossword_items = q.crossword_items || (q.clues || []).map((c: any) => {
            let word = '';
            for (let i = 0; i < c.length; i++) {
              const r = c.direction === 'across' ? c.row : c.row + i;
              const col = c.direction === 'across' ? c.col + i : c.col;
              word += q.grid[r]?.[col] || '';
            }
            return { word, clue: c.text };
          });
        } else if (q.type === 'word_search') {
          mapped.word_search_words = (q.words || []).join(', ');
        }
        return mapped;
      });
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  
  const [questions, setQuestions] = useState<Question[]>(getInitialQuestions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UX Modals & Popovers States
  const [showTypePalette, setShowTypePalette] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [showTestDrive, setShowTestDrive] = useState(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // AI Worksheet Generator States
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Form helper: add a new question
  const handleAddQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
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
    };
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

  // AI Worksheet Generator Trigger
  const handleAIGenerateWorksheet = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/teacher/worksheets/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_worksheet',
          prompt: aiPrompt.trim(),
          tier,
          count: aiCount
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.questions && Array.isArray(data.questions)) {
          // Pre-process crossword and word searches generated by AI to construct grids
          const processed = data.questions.map((q: any) => {
            const mapped = { ...q };
            if (q.type === 'crossword' && q.crossword_items) {
              try {
                const layout = generateCrossword(q.crossword_items);
                mapped.grid = layout.grid;
                mapped.clues = layout.clues;
              } catch (err) {}
            } else if (q.type === 'word_search' && q.words) {
              try {
                const layout = generateWordSearch(q.words);
                mapped.grid = layout.grid;
                mapped.words = layout.words;
                mapped.word_search_words = q.words.join(', ');
              } catch (err) {}
            } else if (q.type === 'drag_and_drop') {
              mapped.distractors_raw = (q.distractors || []).join(', ');
            } else if (q.type === 'category_sorting') {
              mapped.categories_raw = (q.categories || []).join(', ');
            } else if (q.type === 'choice_matrix') {
              mapped.rows_raw = (q.rows || []).join(', ');
              mapped.columns_raw = (q.columns || []).join(', ');
            }
            return mapped;
          });

          setQuestions(processed);
          setAiPanelOpen(false);
          setAiPrompt('');
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate questions.');
      }
    } catch (err: any) {
      setError(err.message || 'AI Generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, []);

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

    // Validation for question entries
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} instructions/prompt is required.`);
        return;
      }

      if (q.type === 'multiple_choice') {
        if (!q.options || q.options.some(opt => !opt.trim())) {
          setError(`Question ${i + 1} (Multiple Choice) must have all 4 options filled out.`);
          return;
        }
        if (!q.answer) {
          setError(`Question ${i + 1} (Multiple Choice) must have a correct choice selected.`);
          return;
        }
      } else if (q.type === 'fill_in_gap') {
        if (!q.text?.trim()) {
          setError(`Question ${i + 1} (Fill in the Gap) text is required.`);
          return;
        }
        if (!q.text.includes('[') || !q.text.includes(']')) {
          setError(`Question ${i + 1} (Fill in the Gap) must contain at least one gap in square brackets, e.g., [is].`);
          return;
        }
      } else if (q.type === 'sentence_unscramble') {
        if (!q.words || q.words.length < 2) {
          setError(`Question ${i + 1} (Sentence Unscramble) sentence must contain at least 2 words.`);
          return;
        }
      } else if (q.type === 'matching_pairs') {
        if (!q.pairs || Object.keys(q.pairs).length === 0 || Object.keys(q.pairs).some(k => !k.trim() || !q.pairs![k].trim())) {
          setError(`Question ${i + 1} (Matching Pairs) must have at least one valid key-value pair.`);
          return;
        }
      } else if (q.type === 'drag_and_drop') {
        if (!q.sentences || q.sentences.length === 0 || q.sentences.some(s => !s.trim())) {
          setError(`Question ${i + 1} (Drag & Drop) must have sentences text entered.`);
          return;
        }
        if (q.sentences.every(s => !s.includes('[') || !s.includes(']'))) {
          setError(`Question ${i + 1} (Drag & Drop) must have at least one slot wrapped in brackets, e.g. [dog].`);
          return;
        }
      } else if (q.type === 'category_sorting') {
        if (!q.categories || q.categories.length < 2) {
          setError(`Question ${i + 1} (Category Sorting) must have at least 2 categories defined.`);
          return;
        }
        if (!q.items || q.items.length === 0 || q.items.some(it => !it.text.trim() || !it.category.trim())) {
          setError(`Question ${i + 1} (Category Sorting) must contain valid items matched to sorting bins.`);
          return;
        }
      } else if (q.type === 'correct_the_mistake') {
        if (!q.text?.trim() || !q.mistake?.trim() || !q.correction?.trim()) {
          setError(`Question ${i + 1} (Correct the Mistake) sentence, mistake, and correction words are all required.`);
          return;
        }
        const cleanWords = q.text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/).map(w => w.toLowerCase());
        if (!cleanWords.includes(q.mistake.toLowerCase())) {
          setError(`Question ${i + 1} (Correct the Mistake) mistake word "${q.mistake}" must match one of the words in the sentence.`);
          return;
        }
      } else if (q.type === 'choice_matrix') {
        if (!q.rows || q.rows.length === 0 || !q.columns || q.columns.length === 0) {
          setError(`Question ${i + 1} (Choice Matrix) must have rows and columns tags defined.`);
          return;
        }
        const mappedRows = Object.keys(q.answers || {});
        if (mappedRows.length !== q.rows.length || mappedRows.some(r => !q.answers![r])) {
          setError(`Question ${i + 1} (Choice Matrix) must have correct column selections selected for all rows.`);
          return;
        }
      } else if (q.type === 'crossword') {
        if (!q.grid || q.grid.length <= 1 || !q.clues || q.clues.length === 0) {
          setError(`Question ${i + 1} (Crossword) crossword grid must be generated. Click "Auto-Generate Crossword Layout".`);
          return;
        }
      } else if (q.type === 'word_search') {
        if (!q.grid || q.grid.length <= 1) {
          setError(`Question ${i + 1} (Word Search) letter grid must be generated. Click "Auto-Generate Word Search".`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    // Dynamic processing of drag and drop correct answers
    const processedQuestions = questions.map((q) => {
      const qCopy = { ...q };
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

      onSave();
    } catch (err: any) {
      setError(err.message || 'Server error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 max-w-4xl mx-auto animate-scaleUp">
      
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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowTemplatePicker(true)}
            className="text-xs bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 font-bold border border-slate-800 px-4 py-2 rounded-xl cursor-pointer transition-colors"
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

      {/* AI generator copilot toggle */}
      <div className="border border-indigo-500/20 rounded-2xl bg-indigo-950/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setAiPanelOpen(!aiPanelOpen)}
          className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-indigo-300 hover:text-white cursor-pointer select-none"
        >
          <span className="flex items-center gap-2">🤖 AI Co-Pilot Worksheet Generator</span>
          <span>{aiPanelOpen ? '▲ Hide' : '▼ Expand'}</span>
        </button>

        {aiPanelOpen && (
          <div className="p-4 border-t border-indigo-500/10 space-y-4 bg-indigo-950/20 animate-scaleUp">
            <div className="space-y-1">
              <label className="block text-[9px] font-black text-indigo-400 uppercase tracking-widest">Generate Worksheet by Prompt</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Present perfect vs past simple, including matching verbs and gap filling exercises about travel experiences"
                rows={2}
                className="w-full bg-slate-950 border border-indigo-500/10 rounded-xl p-3 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Number of Questions:</span>
                <select
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 font-bold cursor-pointer"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={7}>7 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAIGenerateWorksheet}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-650 border border-indigo-500/20 text-xs font-bold py-2 px-5 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                {aiGenerating ? '🤖 Generating questions...' : '⚡ Generate Worksheet'}
              </button>
            </div>
          </div>
        )}
      </div>

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

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Reward Badge</label>
            <select
              value={badgeEmoji}
              onChange={(e) => setBadgeEmoji(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="🥇">🥇 Gold Medal</option>
              <option value="🥈">🥈 Silver Medal</option>
              <option value="🥉">🥉 Bronze Medal</option>
              <option value="🏆">🏆 Trophy</option>
              <option value="🎖️">🎖️ Military Medal</option>
              <option value="⭐">⭐ Star</option>
              <option value="🎯">🎯 Target</option>
              <option value="🚀">🚀 Rocket</option>
              <option value="💡">💡 Idea Bulb</option>
              <option value="🧩">🧩 Puzzle Piece</option>
              <option value="🎨">🎨 Art Palette</option>
              <option value="🧠">🧠 Brain</option>
              <option value="👑">👑 Crown</option>
              <option value="🦉">🦉 Owl</option>
              <option value="🎒">🎒 Backpack</option>
            </select>
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
                  <QuestionCard
                    key={q.id}
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
            className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 border border-slate-800 text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
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
