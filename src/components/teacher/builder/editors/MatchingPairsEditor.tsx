'use client';

import { Question } from '@/lib/worksheet-types';

interface MatchingPairsEditorProps {
  question: Question;
  onChange: (fields: Partial<Question>) => void;
}

export default function MatchingPairsEditor({ question, onChange }: MatchingPairsEditorProps) {
  const pairs = question.pairs || {};

  const handlePairChange = (oldKey: string, newKey: string, val: string) => {
    const updatedPairs = { ...pairs };
    if (oldKey !== newKey) delete updatedPairs[oldKey];
    updatedPairs[newKey] = val;
    onChange({ pairs: updatedPairs });
  };

  const handleAddPair = () => {
    onChange({ pairs: { ...pairs, '': '' } });
  };

  const handleRemovePair = (key: string) => {
    const updatedPairs = { ...pairs };
    delete updatedPairs[key];
    onChange({ pairs: updatedPairs });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="flex justify-between items-center">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Matching Items Pairs</label>
        <button
          type="button"
          onClick={handleAddPair}
          className="text-[9px] font-black bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 py-1.5 px-3 rounded-lg border border-indigo-500/10 cursor-pointer"
        >
          + Add Pair
        </button>
      </div>
      <div className="space-y-2 max-h-56 overflow-y-auto">
        {Object.entries(pairs).map(([key, val], pairIdx) => (
          <div key={pairIdx} className="flex gap-2 items-center">
            <input
              type="text"
              value={key}
              onChange={(e) => handlePairChange(key, e.target.value, val)}
              placeholder="Word A (e.g. hot)"
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
            />
            <span className="text-slate-600 font-bold">↔</span>
            <input
              type="text"
              value={val}
              onChange={(e) => handlePairChange(key, key, e.target.value)}
              placeholder="Word B (e.g. cold)"
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
            />
            <button
              type="button"
              onClick={() => handleRemovePair(key)}
              className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 border border-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
