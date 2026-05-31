'use client';

import { useState, useEffect } from 'react';
import { generateWordSearch, generateCrossword } from '@/lib/gridGenerators';

interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

interface Question {
  id: string;
  type:
    | 'multiple_choice'
    | 'fill_in_gap'
    | 'sentence_unscramble'
    | 'matching_pairs'
    | 'drag_and_drop'
    | 'category_sorting'
    | 'correct_the_mistake'
    | 'choice_matrix'
    | 'crossword'
    | 'word_search';
  question: string;
  
  // MCQ specific
  options?: string[];
  answer?: string;
  
  // Fill in Gap / Correct the Mistake specific
  text?: string;
  
  // Unscramble / Word Search specific
  words?: string[];
  
  // Matching Pairs specific
  pairs?: Record<string, string>;
  
  // Drag and Drop specific
  sentences?: string[];
  distractors?: string[];
  distractors_raw?: string; // temporary input string
  
  // Category Sorting specific
  categories?: string[];
  categories_raw?: string; // temporary input string
  items?: { text: string; category: string }[];
  
  // Correct the Mistake specific
  mistake?: string;
  correction?: string;
  
  // Choice Matrix specific
  rows?: string[];
  rows_raw?: string; // temporary input string
  columns?: string[];
  columns_raw?: string; // temporary input string
  answers?: Record<string, string>;
  
  // Crossword specific
  crossword_items?: { word: string; clue: string }[];
  grid?: string[][];
  clues?: any[];
  
  // Word Search specific
  word_search_words?: string; // temporary comma-separated list
}

interface Worksheet {
  id?: string;
  title: string;
  category_id: string;
  tier: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT';
  questions_json: string;
  badge_emoji?: string;
}

interface WorksheetBuilderProps {
  categories: Category[];
  worksheet: Worksheet | null;
  onSave: () => void;
  onCancel: () => void;
}

const QUESTION_TYPES_META = [
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
      
      // Map initial state helpers
      return parsed.map((q: any) => {
        const mapped = { ...q };
        if (q.type === 'drag_and_drop') {
          // Identify distractors (words that are not in bracketed sentences)
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
          // Re-assemble crossword_items from grid letters or clues
          // To make it easy, we store crossword_items as a field if serialized, or rebuild from clues
          mapped.crossword_items = q.crossword_items || (q.clues || []).map((c: any) => {
            // Find letters in grid to rebuild word
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
  
  // UX States
  const [showTypePalette, setShowTypePalette] = useState(false);
  const [collapsedQuestions, setCollapsedQuestions] = useState<Record<string, boolean>>({});
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Form helper: add a new question
  const handleAddQuestion = (type: Question['type']) => {
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

  // Reordering helpers (arrows fallback)
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

  // MC Choices
  const handleMCOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const question = updated[qIdx];
    if (question.options) {
      const options = [...question.options];
      options[optIdx] = val;
      updated[qIdx] = { ...question, options };
      setQuestions(updated);
    }
  };

  // Matching Pairs
  const handlePairChange = (qIdx: number, oldKey: string, newKey: string, val: string) => {
    const updated = [...questions];
    const question = updated[qIdx];
    if (question.pairs) {
      const pairs = { ...question.pairs };
      if (oldKey !== newKey) delete pairs[oldKey];
      pairs[newKey] = val;
      updated[qIdx] = { ...question, pairs };
      setQuestions(updated);
    }
  };

  const handleAddPair = (qIdx: number) => {
    const updated = [...questions];
    const question = updated[qIdx];
    if (question.pairs) {
      const pairs = { ...question.pairs, '': '' };
      updated[qIdx] = { ...question, pairs };
      setQuestions(updated);
    }
  };

  const handleRemovePair = (qIdx: number, key: string) => {
    const updated = [...questions];
    const question = updated[qIdx];
    if (question.pairs) {
      const pairs = { ...question.pairs };
      delete pairs[key];
      updated[qIdx] = { ...question, pairs };
      setQuestions(updated);
    }
  };

  // Sentence Unscramble raw synchronization
  const [unscrambleRawInputs, setUnscrambleRawInputs] = useState<Record<number, string>>(() => {
    const initialRaw: Record<number, string> = {};
    getInitialQuestions().forEach((q, idx) => {
      if (q.type === 'sentence_unscramble' && q.words) {
        initialRaw[idx] = q.words.join(' ');
      }
    });
    return initialRaw;
  });

  const handleUnscrambleRawChange = (qIdx: number, text: string) => {
    setUnscrambleRawInputs({ ...unscrambleRawInputs, [qIdx]: text });
    const words = text.trim().split(/\s+/).filter(Boolean);
    handleQuestionChange(qIdx, { words });
  };

  // NEW EDITORS LOGIC

  // Drag and Drop Sentences
  const handleAddSentence = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.sentences = [...(q.sentences || []), ''];
    setQuestions(updated);
  };

  const handleRemoveSentence = (qIdx: number, sIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.sentences) {
      q.sentences = q.sentences.filter((_, i) => i !== sIdx);
      setQuestions(updated);
    }
  };

  const handleSentenceChange = (qIdx: number, sIdx: number, val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.sentences) {
      q.sentences[sIdx] = val;
      setQuestions(updated);
    }
  };

  const handleDistractorsChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.distractors_raw = val;
    q.distractors = val.split(',').map(s => s.trim()).filter(Boolean);
    setQuestions(updated);
  };

  // Category Sorting Items
  const handleAddSortingItem = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.items = [...(q.items || []), { text: '', category: '' }];
    setQuestions(updated);
  };

  const handleRemoveSortingItem = (qIdx: number, iIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.items) {
      q.items = q.items.filter((_, i) => i !== iIdx);
      setQuestions(updated);
    }
  };

  const handleSortingItemChange = (qIdx: number, iIdx: number, field: 'text' | 'category', val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.items) {
      q.items[iIdx] = { ...q.items[iIdx], [field]: val };
      setQuestions(updated);
    }
  };

  const handleCategoriesRawChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.categories_raw = val;
    q.categories = val.split(',').map(s => s.trim()).filter(Boolean);
    setQuestions(updated);
  };

  // Choice Matrix
  const handleMatrixRawChange = (qIdx: number, field: 'rows_raw' | 'columns_raw', val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q[field] = val;
    const arrayField = field === 'rows_raw' ? 'rows' : 'columns';
    q[arrayField] = val.split(',').map(s => s.trim()).filter(Boolean);
    setQuestions(updated);
  };

  const handleMatrixAnswerSelect = (qIdx: number, row: string, col: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.answers = { ...(q.answers || {}), [row]: col };
    setQuestions(updated);
  };

  // Crossword Items
  const handleAddCrosswordItem = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.crossword_items = [...(q.crossword_items || []), { word: '', clue: '' }];
    setQuestions(updated);
  };

  const handleRemoveCrosswordItem = (qIdx: number, iIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.crossword_items) {
      q.crossword_items = q.crossword_items.filter((_, i) => i !== iIdx);
      setQuestions(updated);
    }
  };

  const handleCrosswordItemChange = (qIdx: number, iIdx: number, field: 'word' | 'clue', val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.crossword_items) {
      q.crossword_items[iIdx] = { ...q.crossword_items[iIdx], [field]: val };
      setQuestions(updated);
    }
  };

  const handleGenerateCrosswordLayout = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (!q.crossword_items || q.crossword_items.length === 0) return;

    try {
      const { grid, clues } = generateCrossword(q.crossword_items);
      q.grid = grid;
      q.clues = clues;
      setQuestions(updated);
    } catch (e) {
      console.error(e);
      alert('Failed to generate crossword grid. Try different words.');
    }
  };

  // Word Search
  const handleWordSearchWordsChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    q.word_search_words = val;
    q.words = val.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    setQuestions(updated);
  };

  const handleGenerateWordSearchLayout = (qIdx: number) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (!q.words || q.words.length === 0) return;

    try {
      const { grid, words } = generateWordSearch(q.words);
      q.grid = grid;
      q.words = words; // Filter down to placed words
      setQuestions(updated);
    } catch (e) {
      console.error(e);
      alert('Failed to generate word search grid.');
    }
  };

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
        <button
          onClick={onCancel}
          className="text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/80 border border-red-500/40 text-red-200 rounded-2xl text-xs font-bold flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

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
              
              {showTypePalette && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 grid grid-cols-1 gap-2 z-50 max-h-[400px] overflow-y-auto">
                  {QUESTION_TYPES_META.map(meta => (
                    <button
                      key={meta.id}
                      type="button"
                      onClick={() => {
                        handleAddQuestion(meta.id);
                        setShowTypePalette(false);
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
              )}
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
                  <div
                    key={q.id}
                    draggable={true}
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
                    className={`bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4 relative transition-all ${
                      draggedIndex === idx ? 'opacity-40 border-dashed border-indigo-500' : ''
                    }`}
                  >
                    
                    {/* Header: Click to collapse / expand, reorder, delete */}
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                      <div
                        onClick={() => toggleCollapse(q.id)}
                        className="flex items-center gap-2 cursor-pointer select-none flex-grow"
                      >
                        <span className="cursor-grab text-slate-600 hover:text-slate-400 px-1 text-base select-none">☰</span>
                        <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300">
                          {idx + 1}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        {isCollapsed && q.question && (
                          <span className="text-xs text-slate-500 truncate font-semibold max-w-sm ml-2">
                            - {q.question}
                          </span>
                        )}
                        <span className="text-[10px] text-indigo-400 font-bold ml-2">
                          {isCollapsed ? '[Expand]' : '[Collapse]'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 rounded hover:text-indigo-400 cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === questions.length - 1}
                          className="text-[10px] font-bold px-2 py-1 bg-slate-900 border border-slate-800 text-slate-400 disabled:opacity-30 rounded hover:text-indigo-400 cursor-pointer"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          className="text-[10px] font-bold px-2.5 py-1 bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded cursor-pointer transition-all ml-4"
                        >
                          Delete ✕
                        </button>
                      </div>
                    </div>

                    {/* Question Content (hidden when collapsed) */}
                    {!isCollapsed && (
                      <div className="space-y-4 animate-scaleUp">
                        {/* Shared prompt/instructions field */}
                        <div className="space-y-1">
                          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Question prompt / Instruction text</label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => handleQuestionChange(idx, { question: e.target.value })}
                            placeholder="e.g. Choose the correct past tense form"
                            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500 transition-colors"
                            required
                          />
                        </div>

                        {/* MCQ Specific Fields */}
                        {q.type === 'multiple_choice' && q.options && (
                          <div className="space-y-3 pt-2">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Choices & Correct Answer</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {q.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                                  <input
                                    type="radio"
                                    name={`answer_${q.id}`}
                                    checked={q.answer === opt && opt !== ''}
                                    onChange={() => handleQuestionChange(idx, { answer: opt })}
                                    disabled={opt === ''}
                                    className="w-4 h-4 text-indigo-600 border-slate-800 bg-slate-950 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => handleMCOptionChange(idx, optIdx, e.target.value)}
                                    placeholder={`Choice ${optIdx + 1}`}
                                    className="flex-grow bg-slate-950 border border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Fill in Gap Specific Fields */}
                        {q.type === 'fill_in_gap' && (
                          <div className="space-y-2 pt-2">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Gap Text Block</label>
                            <textarea
                              value={q.text || ''}
                              onChange={(e) => handleQuestionChange(idx, { text: e.target.value })}
                              placeholder="Write the sentence. e.g. She [drives] (drive) to work."
                              rows={3}
                              className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
                            />
                            <p className="text-[9px] text-slate-500 leading-relaxed">
                              Wrap correct answers in square brackets `[drives]`. Optional: provide hints in parentheses `(drive)`.
                            </p>
                          </div>
                        )}

                        {/* Sentence Unscramble Specific Fields */}
                        {q.type === 'sentence_unscramble' && (
                          <div className="space-y-2 pt-2">
                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Unscramble Correct Sentence</label>
                            <input
                              type="text"
                              value={unscrambleRawInputs[idx] || (q.words ? q.words.join(' ') : '')}
                              onChange={(e) => handleUnscrambleRawChange(idx, e.target.value)}
                              placeholder="e.g. Liam found an old map in the attic"
                              className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}

                        {/* Matching Pairs Specific Fields */}
                        {q.type === 'matching_pairs' && q.pairs && (
                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Matching Items Pairs</label>
                              <button
                                type="button"
                                onClick={() => handleAddPair(idx)}
                                className="text-[9px] font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 py-1 px-2.5 rounded border border-indigo-500/10 cursor-pointer"
                              >
                                + Add Pair
                              </button>
                            </div>
                            <div className="space-y-2 max-h-56 overflow-y-auto">
                              {Object.entries(q.pairs).map(([key, val], pairIdx) => (
                                <div key={pairIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => handlePairChange(idx, key, e.target.value, val)}
                                    placeholder="Word A (e.g. hot)"
                                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                  <span className="text-slate-600">↔</span>
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handlePairChange(idx, key, key, e.target.value)}
                                    placeholder="Word B (e.g. cold)"
                                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePair(idx, key)}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-transparent cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Drag and Drop Specific Fields */}
                        {q.type === 'drag_and_drop' && q.sentences && (
                          <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Bracketed Sentences</label>
                              <button
                                type="button"
                                onClick={() => handleAddSentence(idx)}
                                className="text-[9px] font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 py-1 px-2.5 rounded border border-indigo-500/10 cursor-pointer"
                              >
                                + Add Sentence
                              </button>
                            </div>
                            <div className="space-y-2">
                              {q.sentences.map((sentence, sIdx) => (
                                <div key={sIdx} className="flex gap-2 items-center">
                                  <span className="text-slate-500 font-bold text-xs">{sIdx + 1}.</span>
                                  <input
                                    type="text"
                                    value={sentence}
                                    onChange={(e) => handleSentenceChange(idx, sIdx, e.target.value)}
                                    placeholder="e.g. Grass is [green] in summer."
                                    className="flex-grow bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSentence(idx, sIdx)}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-transparent cursor-pointer"
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
                                value={q.distractors_raw || ''}
                                onChange={(e) => handleDistractorsChange(idx, e.target.value)}
                                placeholder="e.g. yellow, black, brown"
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                              />
                            </div>
                          </div>
                        )}

                        {/* Category Sorting Specific Fields */}
                        {q.type === 'category_sorting' && q.categories && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Sorting Categories (comma separated)</label>
                              <input
                                type="text"
                                value={q.categories_raw || ''}
                                onChange={(e) => handleCategoriesRawChange(idx, e.target.value)}
                                placeholder="e.g. Nouns, Verbs, Adjectives"
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                              />
                            </div>
                            <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Sorting Items</label>
                              <button
                                type="button"
                                onClick={() => handleAddSortingItem(idx)}
                                className="text-[9px] font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 py-1 px-2.5 rounded border border-indigo-500/10 cursor-pointer"
                              >
                                + Add Item
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(q.items || []).map((item, iIdx) => (
                                <div key={iIdx} className="flex gap-2 items-center">
                                  <input
                                    type="text"
                                    value={item.text}
                                    onChange={(e) => handleSortingItemChange(idx, iIdx, 'text', e.target.value)}
                                    placeholder="Item (e.g. apple)"
                                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                  <span className="text-slate-600">→</span>
                                  <select
                                    value={item.category}
                                    onChange={(e) => handleSortingItemChange(idx, iIdx, 'category', e.target.value)}
                                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none cursor-pointer"
                                  >
                                    <option value="">Select Bin</option>
                                    {q.categories?.map(c => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSortingItem(idx, iIdx)}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-transparent cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Correct the Mistake Specific Fields */}
                        {q.type === 'correct_the_mistake' && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Mistake Sentence</label>
                              <input
                                type="text"
                                value={q.text || ''}
                                onChange={(e) => handleQuestionChange(idx, { text: e.target.value })}
                                placeholder="e.g. There is five books on the table."
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Wrong Word (Mistake)</label>
                                <input
                                  type="text"
                                  value={q.mistake || ''}
                                  onChange={(e) => handleQuestionChange(idx, { mistake: e.target.value })}
                                  placeholder="e.g. is"
                                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Correction Word</label>
                                <input
                                  type="text"
                                  value={q.correction || ''}
                                  onChange={(e) => handleQuestionChange(idx, { correction: e.target.value })}
                                  placeholder="e.g. are"
                                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Choice Matrix Specific Fields */}
                        {q.type === 'choice_matrix' && q.rows && q.columns && (
                          <div className="space-y-3 pt-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Rows (comma separated)</label>
                                <input
                                  type="text"
                                  value={q.rows_raw || ''}
                                  onChange={(e) => handleMatrixRawChange(idx, 'rows_raw', e.target.value)}
                                  placeholder="e.g. believe, run, know"
                                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Columns (comma separated)</label>
                                <input
                                  type="text"
                                  value={q.columns_raw || ''}
                                  onChange={(e) => handleMatrixRawChange(idx, 'columns_raw', e.target.value)}
                                  placeholder="e.g. Stative Verb, Dynamic Verb"
                                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                />
                              </div>
                            </div>

                            {q.rows && q.columns && q.rows.length > 0 && q.columns.length > 0 && (
                              <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Correct Answer Mapping Matrix</label>
                                <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-slate-950/60 border-b border-slate-900">
                                        <th className="p-3 font-bold text-slate-400">Statement</th>
                                        {q.columns?.map(col => (
                                          <th key={col} className="p-3 font-bold text-slate-400 text-center">{col}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-900/60">
                                      {q.rows?.map(row => (
                                        <tr key={row}>
                                          <td className="p-3 font-bold text-white">{row}</td>
                                          {q.columns?.map(col => {
                                            const isSelected = q.answers?.[row] === col;
                                            return (
                                              <td key={col} className="p-2 text-center">
                                                <input
                                                  type="radio"
                                                  name={`matrix_${q.id}_${row}`}
                                                  checked={isSelected}
                                                  onChange={() => handleMatrixAnswerSelect(idx, row, col)}
                                                  className="w-4 h-4 text-indigo-650 border-slate-800 bg-slate-950 focus:ring-indigo-500 cursor-pointer"
                                                />
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Crossword Specific Fields */}
                        {q.type === 'crossword' && q.crossword_items && (
                          <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-center">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Crossword Word & Clue List</label>
                              <button
                                type="button"
                                onClick={() => handleAddCrosswordItem(idx)}
                                className="text-[9px] font-bold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 py-1 px-2.5 rounded border border-indigo-500/10 cursor-pointer"
                              >
                                + Add Clue
                              </button>
                            </div>
                            <div className="space-y-2">
                              {q.crossword_items.map((item, iIdx) => (
                                <div key={iIdx} className="flex gap-2 items-center animate-scaleUp">
                                  <input
                                    type="text"
                                    value={item.word}
                                    onChange={(e) => handleCrosswordItemChange(idx, iIdx, 'word', e.target.value)}
                                    placeholder="Word (e.g. NOUN)"
                                    className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold uppercase outline-none"
                                  />
                                  <input
                                    type="text"
                                    value={item.clue}
                                    onChange={(e) => handleCrosswordItemChange(idx, iIdx, 'clue', e.target.value)}
                                    placeholder="Clue (e.g. A naming word)"
                                    className="flex-[2] bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCrosswordItem(idx, iIdx)}
                                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-transparent cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleGenerateCrosswordLayout(idx)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-2 px-4 rounded-xl border border-indigo-400/20 cursor-pointer transition-all uppercase"
                              >
                                ⚡ Auto-Generate Crossword Grid
                              </button>
                              
                              {q.grid && q.grid.length > 0 && (
                                <span className="text-[10px] text-emerald-400 font-black">
                                  ✓ Grid Generated ({q.grid[0].length}x{q.grid.length}, {q.clues?.length} Clues)
                                </span>
                              )}
                            </div>

                            {/* ASCII layout preview */}
                            {q.grid && q.grid.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Layout Preview</label>
                                <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl inline-block max-w-full overflow-x-auto">
                                  <div
                                    className="grid gap-1"
                                    style={{
                                      gridTemplateRows: `repeat(${q.grid.length}, minmax(0, 1fr))`,
                                      gridTemplateColumns: `repeat(${q.grid[0].length}, minmax(0, 1fr))`,
                                    }}
                                  >
                                    {q.grid.map((row, rIdx) =>
                                      row.map((cell, cIdx) => (
                                        <div
                                          key={`${rIdx}_${cIdx}`}
                                          className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded ${
                                            cell === '.'
                                              ? 'bg-slate-900 text-slate-800'
                                              : 'bg-indigo-600/20 border border-indigo-500/20 text-indigo-300'
                                          }`}
                                          style={{ minWidth: '24px', minHeight: '24px' }}
                                        >
                                          {cell === '.' ? '' : cell}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Word Search Specific Fields */}
                        {q.type === 'word_search' && (
                          <div className="space-y-4 pt-2">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Hidden Words (comma separated)</label>
                              <input
                                type="text"
                                value={q.word_search_words || ''}
                                onChange={(e) => handleWordSearchWordsChange(idx, e.target.value)}
                                placeholder="e.g. APPLE, ORANGE, BANANA"
                                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold uppercase outline-none"
                              />
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleGenerateWordSearchLayout(idx)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-2 px-4 rounded-xl border border-indigo-400/20 cursor-pointer transition-all uppercase"
                              >
                                ⚡ Auto-Generate Word Search Grid
                              </button>
                              
                              {q.grid && q.grid.length > 0 && (
                                <span className="text-[10px] text-emerald-400 font-black">
                                  ✓ Grid Generated ({q.grid[0].length}x{q.grid.length})
                                </span>
                              )}
                            </div>

                            {/* Grid layout preview */}
                            {q.grid && q.grid.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Grid Preview</label>
                                <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl inline-block max-w-full overflow-x-auto">
                                  <div
                                    className="grid gap-1"
                                    style={{
                                      gridTemplateRows: `repeat(${q.grid.length}, minmax(0, 1fr))`,
                                      gridTemplateColumns: `repeat(${q.grid[0].length}, minmax(0, 1fr))`,
                                    }}
                                  >
                                    {q.grid.map((row, rIdx) =>
                                      row.map((cell, cIdx) => (
                                        <div
                                          key={`${rIdx}_${cIdx}`}
                                          className="w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded bg-slate-900/60 border border-slate-800 text-slate-300"
                                          style={{ minWidth: '24px', minHeight: '24px' }}
                                        >
                                          {cell}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer save/cancel row */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onCancel}
            className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-300 font-bold border border-slate-800 text-xs py-2.5 px-6 rounded-xl cursor-pointer transition-all"
            style={{ minHeight: '40px' }}
          >
            Cancel
          </button>
          <button
            id="worksheet-save-btn"
            type="submit"
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 px-6 rounded-xl border border-indigo-400/20 cursor-pointer transition-all disabled:opacity-50"
            style={{ minHeight: '40px' }}
          >
            {saving ? 'Saving...' : 'Save & Publish Worksheet'}
          </button>
        </div>

      </form>
    </div>
  );
}
