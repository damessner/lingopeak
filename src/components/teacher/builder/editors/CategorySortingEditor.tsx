'use client';

import { CategorySortingQuestion } from '@/lib/worksheet-types';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface CategorySortingEditorProps {
  question: CategorySortingQuestion;
  onChange: (fields: Partial<CategorySortingQuestion>) => void;
}

export default function CategorySortingEditor({ question, onChange }: CategorySortingEditorProps) {
  const categories = question.categories || [];
  const items = question.items || [];

  // Group items by category title for rendering
  const itemsByCategory: Record<string, string[]> = {};
  categories.forEach(cat => {
    itemsByCategory[cat] = items
      .filter(item => item.category === cat)
      .map(item => item.text);
  });

  const handleAddCategory = () => {
    const newCatName = `Category ${categories.length + 1}`;
    const updatedCategories = [...categories, newCatName];
    onChange({
      categories: updatedCategories
    });
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const updatedCategories = categories.filter(c => c !== catToRemove);
    const updatedItems = items.filter(item => item.category !== catToRemove);
    onChange({
      categories: updatedCategories,
      items: updatedItems
    });
  };

  const handleCategoryTitleChange = (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    // Update categories list
    const updatedCategories = categories.map(c => c === oldTitle ? newTitle : c);
    
    // Update category name in items mapping
    const updatedItems = items.map(item => {
      if (item.category === oldTitle) {
        return { ...item, category: newTitle };
      }
      return item;
    });

    onChange({
      categories: updatedCategories,
      items: updatedItems
    });
  };

  const handleCategoryItemsChange = (catTitle: string, rawText: string) => {
    // Split input lines and filter out empty ones
    const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

    // Keep items from other categories, and append newly parsed items for this category
    const otherItems = items.filter(item => item.category !== catTitle);
    const parsedItems = lines.map(line => ({
      text: line,
      category: catTitle
    }));

    onChange({
      items: [...otherItems, ...parsedItems]
    });
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Sorting Categories & Items
        </label>
        <button
          type="button"
          onClick={handleAddCategory}
          className="text-[9px] font-black bg-indigo-650/20 hover:bg-indigo-650/40 text-indigo-300 py-1.5 px-3 rounded-lg border border-indigo-500/10 cursor-pointer transition-colors"
        >
          + Add Category Bin
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="p-4 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl text-center">
          <p className="text-[10px] text-slate-500 italic">No categories created yet. Click "+ Add Category Bin".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, idx) => {
            const catItems = itemsByCategory[cat] || [];
            const rawItemsText = catItems.join('\n');

            return (
              <div key={idx} className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3 relative">
                {/* Category Header */}
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={cat}
                    onChange={(e) => handleCategoryTitleChange(cat, e.target.value)}
                    placeholder="e.g. Verbs"
                    className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-white font-bold outline-none focus:border-indigo-500 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1.5 border border-slate-900 rounded-xl bg-slate-950 cursor-pointer"
                    title="Delete Category"
                  >
                    ✕
                  </button>
                </div>

                {/* Items Text Area */}
                <div className="space-y-1">
                  <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    Items List (one per line)
                  </label>
                  <AutoExpandingTextarea
                    value={rawItemsText}
                    onChange={(e) => handleCategoryItemsChange(cat, e.target.value)}
                    placeholder="e.g.&#10;run&#10;walk&#10;talk"
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-350 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
