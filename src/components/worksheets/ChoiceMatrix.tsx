'use client';

interface ChoiceMatrixProps {
  question: {
    id: string;
    question: string;
    rows: string[]; // e.g. ["believe", "run", "know", "dance"]
    columns: string[]; // e.g. ["Stative Verb", "Dynamic Verb"]
  };
  value: Record<string, string>; // Maps row -> selected column
  onChange: (val: Record<string, string>) => void;
}

export default function ChoiceMatrix({ question, value, onChange }: ChoiceMatrixProps) {
  const selections = value || {};

  const handleCellSelect = (row: string, col: string) => {
    onChange({
      ...selections,
      [row]: col,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-900/10 mt-4">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40">
              <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-wider min-w-[150px]">Statements</th>
              {question.columns.map((col) => (
                <th
                  key={col}
                  className="py-4 px-3 text-xs font-bold text-slate-400 uppercase tracking-wider text-center"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {question.rows.map((row) => (
              <tr key={row} className="hover:bg-slate-900/20 transition-colors">
                <td className="py-4 px-5 text-sm font-semibold text-white">{row}</td>
                {question.columns.map((col) => {
                  const isChecked = selections[row] === col;
                  return (
                    <td key={col} className="py-2 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleCellSelect(row, col)}
                        className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'border-slate-800 hover:border-slate-700 text-transparent'
                        }`}
                        style={{ minWidth: '44px', minHeight: '44px' }}
                      >
                        <div className={`w-3 h-3 rounded-full transition-all ${
                          isChecked ? 'bg-indigo-500 scale-100' : 'bg-transparent scale-50'
                        }`} />
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
