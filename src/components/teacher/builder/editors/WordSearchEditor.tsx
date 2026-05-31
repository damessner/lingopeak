'use client';

import { WordSearchQuestion } from '@/lib/worksheet-types';
import { generateWordSearch } from '@/lib/gridGenerators';

interface WordSearchEditorProps {
  question: WordSearchQuestion;
  onChange: (fields: Partial<WordSearchQuestion>) => void;
}

export default function WordSearchEditor({ question, onChange }: WordSearchEditorProps) {
  const word_search_words = question.word_search_words || '';
  const grid = question.grid || [];

  const handleWordsChange = (val: string) => {
    const list = val.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    onChange({
      word_search_words: val,
      words: list
    });
  };

  const handleGenerateLayout = () => {
    const wordList = question.words || [];
    if (wordList.length === 0) return;
    try {
      const result = generateWordSearch(wordList);
      onChange({
        grid: result.grid,
        words: result.words // Filter down to successfully placed words
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate word search grid.');
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Hidden Words (comma separated)</label>
        <input
          type="text"
          value={word_search_words}
          onChange={(e) => handleWordsChange(e.target.value)}
          placeholder="e.g. APPLE, ORANGE, BANANA"
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold uppercase outline-none"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerateLayout}
          className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] py-2 px-4 rounded-xl border border-indigo-400/20 cursor-pointer transition-all uppercase"
        >
          ⚡ Auto-Generate Word Search Grid
        </button>
        
        {grid && grid.length > 0 && (
          <span className="text-[10px] text-emerald-400 font-black">
            ✓ Grid Generated ({grid[0]?.length}x{grid.length})
          </span>
        )}
      </div>

      {/* Grid layout preview */}
      {grid && grid.length > 0 && grid[0] && (
        <div className="space-y-1.5 pt-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Grid Preview</label>
          <div className="bg-slate-950 p-4 border border-slate-900 rounded-xl inline-block max-w-full overflow-x-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateRows: `repeat(${grid.length}, minmax(0, 1fr))`,
                gridTemplateColumns: `repeat(${grid[0].length}, minmax(0, 1fr))`,
              }}
            >
              {grid.map((row, rIdx) =>
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
  );
}
