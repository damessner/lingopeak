'use client';

import { Question } from '@/lib/worksheet-types';
import { generateCrossword } from '@/lib/gridGenerators';

interface CrosswordEditorProps {
  question: Question;
  onChange: (fields: Partial<Question>) => void;
}

export default function CrosswordEditor({ question, onChange }: CrosswordEditorProps) {
  const crossword_items = question.crossword_items || [{ word: '', clue: '' }];
  const grid = question.grid || [];
  const clues = question.clues || [];

  const handleAddCrosswordItem = () => {
    onChange({ crossword_items: [...crossword_items, { word: '', clue: '' }] });
  };

  const handleRemoveCrosswordItem = (iIdx: number) => {
    onChange({ crossword_items: crossword_items.filter((_, i) => i !== iIdx) });
  };

  const handleCrosswordItemChange = (iIdx: number, field: 'word' | 'clue', val: string) => {
    const updated = [...crossword_items];
    updated[iIdx] = { ...updated[iIdx], [field]: val };
    onChange({ crossword_items: updated });
  };

  const handleGenerateLayout = () => {
    if (!crossword_items || crossword_items.length === 0) return;
    try {
      const result = generateCrossword(crossword_items);
      onChange({
        grid: result.grid,
        clues: result.clues
      });
    } catch (e) {
      console.error(e);
      alert('Failed to generate crossword grid. Try different words.');
    }
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Crossword Word & Clue List</label>
        <button
          type="button"
          onClick={handleAddCrosswordItem}
          className="text-[9px] font-black bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 py-1.5 px-3 rounded-lg border border-indigo-500/10 cursor-pointer"
        >
          + Add Clue
        </button>
      </div>
      <div className="space-y-2">
        {crossword_items.map((item, iIdx) => (
          <div key={iIdx} className="flex gap-2 items-center animate-scaleUp">
            <input
              type="text"
              value={item.word}
              onChange={(e) => handleCrosswordItemChange(iIdx, 'word', e.target.value)}
              placeholder="Word (e.g. NOUN)"
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold uppercase outline-none"
            />
            <input
              type="text"
              value={item.clue}
              onChange={(e) => handleCrosswordItemChange(iIdx, 'clue', e.target.value)}
              placeholder="Clue (e.g. A naming word)"
              className="flex-[2] bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
            />
            <button
              type="button"
              disabled={crossword_items.length <= 1}
              onClick={() => handleRemoveCrosswordItem(iIdx)}
              className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-30 font-bold px-2 py-1 border border-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleGenerateLayout}
          className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-[10px] py-2 px-4 rounded-xl border border-indigo-400/20 cursor-pointer transition-all uppercase"
        >
          ⚡ Auto-Generate Crossword Grid
        </button>
        
        {grid && grid.length > 0 && (
          <span className="text-[10px] text-emerald-400 font-black">
            ✓ Grid Generated ({grid[0]?.length}x{grid.length}, {clues?.length} Clues)
          </span>
        )}
      </div>

      {/* ASCII layout preview */}
      {grid && grid.length > 0 && grid[0] && (
        <div className="space-y-1.5 pt-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Layout Preview</label>
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
                    className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded ${
                      cell === '.'
                        ? 'bg-slate-900 text-slate-800'
                        : 'bg-indigo-650/20 border border-indigo-500/20 text-indigo-300'
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
  );
}
