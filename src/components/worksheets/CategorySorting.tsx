'use client';

interface SortingItem {
  text: string;
  category: string;
}

interface CategorySortingProps {
  question: {
    id: string;
    question: string;
    categories: string[]; // e.g. ["Present Simple", "Present Continuous"]
    items: SortingItem[]; // list of words/phrases to sort
  };
  value: Record<string, string>; // Maps item text -> sorted category
  onChange: (val: Record<string, string>) => void;
}

export default function CategorySorting({ question, value, onChange }: CategorySortingProps) {
  const sortedItems = value || {};

  // Find items that haven't been sorted yet
  const unsortedItems = question.items.filter(
    (item) => !Object.prototype.hasOwnProperty.call(sortedItems, item.text)
  );

  const activeItem = unsortedItems[0] || null;

  const handleSort = (category: string) => {
    if (!activeItem) return;
    onChange({
      ...sortedItems,
      [activeItem.text]: category,
    });
  };

  const handleRemove = (itemText: string) => {
    const updated = { ...sortedItems };
    delete updated[itemText];
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      {/* Sorting Arena: Shows current active item card to sort */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/40 border border-slate-800 rounded-2xl min-h-[140px] text-center relative overflow-hidden">
        {activeItem ? (
          <div className="space-y-4 max-w-xs w-full animate-scaleUp">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Item to Sort ({unsortedItems.length} left)</span>
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-lg md:text-xl py-4 px-6 rounded-2xl shadow-lg border border-indigo-400/20 select-none">
              {activeItem.text}
            </div>
            
            {/* Category action buttons */}
            <div className="flex flex-wrap gap-2.5 justify-center mt-4">
              {question.categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSort(cat)}
                  className="bg-slate-900 border border-slate-800 hover:border-indigo-500 text-slate-200 hover:text-white font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer select-none"
                  style={{ minHeight: '40px' }}
                >
                  Move to {cat}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-indigo-400 text-sm font-bold animate-pulse">
            🎉 All items sorted! You can tap items in the bins below to re-sort them.
          </div>
        )}
      </div>

      {/* Categories Columns (Bins) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {question.categories.map((cat) => {
          // Find items sorted into this category
          const itemsInCat = Object.entries(sortedItems)
            .filter(([_, valueCat]) => valueCat === cat)
            .map(([text]) => text);

          return (
            <div
              key={cat}
              className="bg-slate-900/20 border border-slate-850 rounded-2xl p-5 min-h-[160px] flex flex-col"
            >
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3">
                {cat} ({itemsInCat.length})
              </h4>
              
              <div className="flex flex-wrap gap-2 flex-grow align-top content-start">
                {itemsInCat.length === 0 ? (
                  <span className="text-slate-600 text-xs italic m-auto">Empty bin</span>
                ) : (
                  itemsInCat.map((itemText) => (
                    <button
                      key={itemText}
                      type="button"
                      onClick={() => handleRemove(itemText)}
                      className="bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 hover:border-red-500 hover:text-red-300 font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer animate-scaleUp"
                    >
                      <span>{itemText}</span>
                      <span className="text-[10px] text-indigo-500 hover:text-red-400">✕</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
