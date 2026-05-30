'use client';

interface MultipleChoiceProps {
  question: {
    id: string;
    question: string;
    options: string[];
    isMulti?: boolean;
  };
  value: string | string[];
  onChange: (val: string | string[]) => void;
}

export default function MultipleChoice({ question, value, onChange }: MultipleChoiceProps) {
  const isMulti = question.isMulti || false;

  const handleSelect = (option: string) => {
    if (isMulti) {
      const current = Array.isArray(value) ? value : [];
      if (current.includes(option)) {
        onChange(current.filter((item) => item !== option));
      } else {
        onChange([...current, option]);
      }
    } else {
      onChange(option);
    }
  };

  const isSelected = (option: string) => {
    if (isMulti) {
      return Array.isArray(value) && value.includes(option);
    }
    return value === option;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {question.options.map((option) => {
          const selected = isSelected(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(option)}
              className={`w-full py-4 px-5 text-left text-sm font-semibold rounded-2xl border transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between ${
                selected
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-100 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-200'
              }`}
              style={{ minHeight: '52px' }}
            >
              <span>{option}</span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                selected
                  ? 'border-indigo-500 bg-indigo-500'
                  : 'border-slate-700'
              }`}>
                {selected && (
                  <span className="text-[10px] text-white">✓</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
