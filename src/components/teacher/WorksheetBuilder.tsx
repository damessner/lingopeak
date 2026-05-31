'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'fill_in_gap' | 'sentence_unscramble' | 'matching_pairs';
  question: string;
  // Multiple Choice specific
  options?: string[];
  answer?: string;
  // Fill in Gap specific
  text?: string;
  // Sentence Unscramble specific
  words?: string[];
  // Matching Pairs specific
  pairs?: Record<string, string>;
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
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  const [questions, setQuestions] = useState<Question[]>(getInitialQuestions);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form helper: add a new question
  const handleAddQuestion = (type: 'multiple_choice' | 'fill_in_gap' | 'sentence_unscramble' | 'matching_pairs') => {
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

  // Reordering helpers
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

  // Multiple Choice choices helper
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

  // Matching Pairs helper
  const handlePairChange = (qIdx: number, oldKey: string, newKey: string, val: string) => {
    const updated = [...questions];
    const question = updated[qIdx];
    if (question.pairs) {
      const pairs = { ...question.pairs };
      // Delete old key if changed
      if (oldKey !== newKey) {
        delete pairs[oldKey];
      }
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

  // Unscramble helper: convert raw text sentence input to words array on save
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
    
    // Split and save immediately to keep words synchronized
    const words = text.trim().split(/\s+/).filter(Boolean);
    handleQuestionChange(qIdx, { words });
  };

  // Submit to API
  const handleSave = async (e: React.FormEvent) => {
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
      }
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/teacher/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheet?.id,
          title: title.trim(),
          categoryId,
          tier,
          questions,
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
      <form onSubmit={handleSave} className="space-y-6">
        
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">Add Question:</span>
              <button
                type="button"
                onClick={() => handleAddQuestion('multiple_choice')}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-extrabold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                + MCQ
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('fill_in_gap')}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-extrabold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                + Gap Text
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('sentence_unscramble')}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-extrabold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                + Scramble
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion('matching_pairs')}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/20 text-[10px] font-extrabold py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                + Pairs
              </button>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="p-10 bg-slate-950/20 border border-dashed border-slate-800 rounded-2xl text-center">
              <span className="text-3xl block filter grayscale opacity-40 select-none mb-2">📋</span>
              <p className="text-slate-500 text-xs italic">No questions added yet. Use the buttons above to build your worksheet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl space-y-4 relative animate-scaleUp">
                  
                  {/* Reorder and Delete Controls */}
                  <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {q.type.replace('_', ' ')}
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

                  {/* Widget Specific Fields */}
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
                              className="flex-grow bg-slate-950 border border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-slate-500 italic">Select the radio button next to the correct answer choice. Choices must be filled in first.</p>
                    </div>
                  )}

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
                        Wrap correct answers in square brackets `[drives]`. Students will see an empty text box. 
                        Optional: provide base verbs or hints in parentheses `(drive)` next to the bracket.
                      </p>
                    </div>
                  )}

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
                      <p className="text-[9px] text-slate-500">
                        Type the full sentence in correct order (words separated by spaces). 
                        The app will automatically scramble these words for the student to rearrange.
                      </p>
                    </div>
                  )}

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

                </div>
              ))}
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
