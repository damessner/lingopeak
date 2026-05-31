'use client';

import { ChoiceMatrixQuestion } from '@/lib/worksheet-types';

interface ChoiceMatrixEditorProps {
  question: ChoiceMatrixQuestion;
  onChange: (fields: Partial<ChoiceMatrixQuestion>) => void;
}

export default function ChoiceMatrixEditor({ question, onChange }: ChoiceMatrixEditorProps) {
  const rows = question.rows || [''];
  const columns = question.columns || [''];
  const rows_raw = question.rows_raw || '';
  const columns_raw = question.columns_raw || '';
  const answers = question.answers || {};

  const handleRawChange = (field: 'rows_raw' | 'columns_raw', val: string) => {
    const list = val.split(',').map(s => s.trim()).filter(Boolean);
    const arrayField = field === 'rows_raw' ? 'rows' : 'columns';
    onChange({
      [field]: val,
      [arrayField]: list
    });
  };

  const handleAnswerSelect = (row: string, col: string) => {
    onChange({
      answers: { ...answers, [row]: col }
    });
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Rows (comma separated)</label>
          <input
            type="text"
            value={rows_raw}
            onChange={(e) => handleRawChange('rows_raw', e.target.value)}
            placeholder="e.g. believe, run, know"
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Columns (comma separated)</label>
          <input
            type="text"
            value={columns_raw}
            onChange={(e) => handleRawChange('columns_raw', e.target.value)}
            placeholder="e.g. Stative Verb, Dynamic Verb"
            className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
          />
        </div>
      </div>

      {rows && columns && rows.length > 0 && columns.length > 0 && (
        <div className="space-y-2">
          <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">Correct Answer Mapping Matrix</label>
          <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-900">
                  <th className="p-3 font-bold text-slate-400">Statement</th>
                  {columns.map(col => (
                    <th key={col} className="p-3 font-bold text-slate-400 text-center">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {rows.map(row => (
                  <tr key={row}>
                    <td className="p-3 font-bold text-white">{row}</td>
                    {columns.map(col => {
                      const isSelected = answers[row] === col;
                      return (
                        <td key={col} className="p-2 text-center">
                          <input
                            type="radio"
                            name={`matrix_${question.id}_${row}`}
                            checked={isSelected}
                            onChange={() => handleAnswerSelect(row, col)}
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
  );
}
