'use client';

import { ChoiceMatrixQuestion } from '@/lib/worksheet-types';
import { useState, useEffect } from 'react';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

interface ChoiceMatrixEditorProps {
  question: ChoiceMatrixQuestion;
  onChange: (fields: Partial<ChoiceMatrixQuestion>) => void;
}

export default function ChoiceMatrixEditor({ question, onChange }: ChoiceMatrixEditorProps) {
  const getInitialRaw = () => {
    if (question.matrix_raw_text) return question.matrix_raw_text;
    if (question.rows && question.answers) {
      return question.rows.map(row => `${row}##${question.answers[row] || ''}`).join('\n');
    }
    return '';
  };

  const [rawText, setRawText] = useState(getInitialRaw());

  useEffect(() => {
    setRawText(getInitialRaw());
  }, [question.rows, question.answers, question.matrix_raw_text]);

  const handleRawChange = (text: string) => {
    setRawText(text);

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const newRows: string[] = [];
    const newColumnsSet = new Set<string>();
    const newAnswers: Record<string, string> = {};

    lines.forEach(line => {
      const parts = line.split('##');
      if (parts.length >= 2) {
        const row = parts[0].trim();
        const col = parts[1].trim();
        if (row && col) {
          newRows.push(row);
          newColumnsSet.add(col);
          newAnswers[row] = col;
        }
      }
    });

    const newColumns = Array.from(newColumnsSet);

    onChange({
      rows: newRows,
      columns: newColumns,
      answers: newAnswers,
      matrix_raw_text: text
    } as any);
  };

  const columns = question.columns || [];
  const rows = question.rows || [];
  const answers = question.answers || {};

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Statements & Column Classifications (one statement##column per line)
        </label>
        <AutoExpandingTextarea
          value={rawText}
          onChange={(e) => handleRawChange(e.target.value)}
          placeholder="e.g.&#10;He go to the shop.##wrong&#10;she goes to the shop.##correct&#10;Who said that she likes bananas?##John"
          rows={4}
          className="w-full bg-slate-950 border border-slate-900 rounded-xl p-3 text-xs text-slate-350 font-bold outline-none focus:border-indigo-500 placeholder-slate-650"
        />
        <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
          Type the statement followed by `##` and the column name. This format automatically creates columns, rows, and matches the correct options.
        </p>
      </div>

      {/* Grid Live Preview */}
      {rows.length > 0 && columns.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-900">
          <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">
            Generated Choice Matrix Preview
          </label>
          <div className="border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20 text-xs">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-900">
                  <th className="p-3 font-bold text-slate-500">Statement</th>
                  {columns.map(col => (
                    <th key={col} className="p-3 font-bold text-slate-500 text-center">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {rows.map(row => (
                  <tr key={row}>
                    <td className="p-3 font-bold text-slate-300">{row}</td>
                    {columns.map(col => {
                      const isSelected = answers[row] === col;
                      return (
                        <td key={col} className="p-2 text-center select-none pointer-events-none">
                          <input
                            type="radio"
                            checked={isSelected}
                            readOnly
                            className="w-4 h-4 text-indigo-650 border-slate-800 bg-slate-950 cursor-pointer"
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
