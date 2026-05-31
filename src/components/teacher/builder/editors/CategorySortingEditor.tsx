'use client';

import { CategorySortingQuestion } from '@/lib/worksheet-types';

interface CategorySortingEditorProps {
  question: CategorySortingQuestion;
  onChange: (fields: Partial<CategorySortingQuestion>) => void;
}

export default function CategorySortingEditor({ question, onChange }: CategorySortingEditorProps) {
  const categories = question.categories || [];
  const categories_raw = question.categories_raw || '';
  const items = question.items || [];

  const handleCategoriesRawChange = (val: string) => {
    const list = val.split(',').map(s => s.trim()).filter(Boolean);
    onChange({
      categories_raw: val,
      categories: list
    });
  };

  const handleAddSortingItem = () => {
    onChange({ items: [...items, { text: '', category: '' }] });
  };

  const handleRemoveSortingItem = (iIdx: number) => {
    onChange({ items: items.filter((_, i) => i !== iIdx) });
  };

  const handleSortingItemChange = (iIdx: number, field: 'text' | 'category', val: string) => {
    const updatedItems = [...items];
    updatedItems[iIdx] = { ...updatedItems[iIdx], [field]: val };
    onChange({ items: updatedItems });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Sorting Categories (comma separated)</label>
        <input
          type="text"
          value={categories_raw}
          onChange={(e) => handleCategoriesRawChange(e.target.value)}
          placeholder="e.g. Nouns, Verbs, Adjectives"
          className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
        />
      </div>
      <div className="flex justify-between items-center">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Sorting Items</label>
        <button
          type="button"
          onClick={handleAddSortingItem}
          className="text-[9px] font-black bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 py-1.5 px-3 rounded-lg border border-indigo-500/10 cursor-pointer"
        >
          + Add Item
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, iIdx) => (
          <div key={iIdx} className="flex gap-2 items-center">
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleSortingItemChange(iIdx, 'text', e.target.value)}
              placeholder="Item (e.g. apple)"
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
            />
            <span className="text-slate-650 font-bold">→</span>
            <select
              value={item.category}
              onChange={(e) => handleSortingItemChange(iIdx, 'category', e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none cursor-pointer"
            >
              <option value="">Select Bin</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => handleRemoveSortingItem(iIdx)}
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
