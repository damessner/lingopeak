'use client';

import { MultipleChoiceQuestion } from '@/lib/worksheet-types';

interface MultipleChoiceEditorProps {
  question: MultipleChoiceQuestion;
  onChange: (fields: Partial<MultipleChoiceQuestion>) => void;
  qIdx: number;
}

export default function MultipleChoiceEditor({ question, onChange }: MultipleChoiceEditorProps) {
  const options = question.options || ['', '', '', ''];
  const isMulti = !!question.isMulti;
  const answers = question.answers || (question.answer ? [question.answer] : []);

  const handleOptionTextChange = (optIdx: number, val: string) => {
    const updatedOptions = [...options];
    const oldVal = updatedOptions[optIdx];
    updatedOptions[optIdx] = val;

    // Maintain correct answers list if text changes
    let updatedAnswers = [...answers];
    if (answers.includes(oldVal)) {
      updatedAnswers = updatedAnswers.map(ans => ans === oldVal ? val : ans).filter(Boolean);
    }
    const updatedSingle = question.answer === oldVal ? val : question.answer;

    onChange({
      options: updatedOptions,
      answers: updatedAnswers,
      answer: updatedSingle
    });
  };

  const handleToggleMulti = (checked: boolean) => {
    // If turning off multi, keep only the first answer
    const newAnswers = checked ? answers : (answers.length > 0 ? [answers[0]] : []);
    const newAnswer = newAnswers[0] || '';
    onChange({
      isMulti: checked,
      answers: newAnswers,
      answer: newAnswer
    });
  };

  const handleSelectAnswer = (opt: string, selected: boolean) => {
    if (opt === '') return;
    
    if (isMulti) {
      let updatedAnswers = [...answers];
      if (selected) {
        if (!updatedAnswers.includes(opt)) {
          updatedAnswers.push(opt);
        }
      } else {
        updatedAnswers = updatedAnswers.filter(ans => ans !== opt);
      }
      onChange({
        answers: updatedAnswers,
        answer: updatedAnswers[0] || ''
      });
    } else {
      onChange({
        answer: opt,
        answers: [opt]
      });
    }
  };

  return (
    <div className="space-y-4 pt-2">
      {/* Multi-correct options toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`mcq_multi_${question.id}`}
          checked={isMulti}
          onChange={(e) => handleToggleMulti(e.target.checked)}
          className="w-4 h-4 text-indigo-650 border-slate-800 bg-slate-950 focus:ring-indigo-500 rounded cursor-pointer"
        />
        <label
          htmlFor={`mcq_multi_${question.id}`}
          className="text-xs font-bold text-slate-300 select-none cursor-pointer"
        >
          Allow multiple correct options (Checkboxes)
        </label>
      </div>

      <div className="space-y-1">
        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Choices & Correct Answer(s)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((opt, optIdx) => {
            const isCorrect = isMulti ? answers.includes(opt) && opt !== '' : question.answer === opt && opt !== '';
            return (
              <div key={optIdx} className="flex items-center gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                <input
                  type={isMulti ? 'checkbox' : 'radio'}
                  name={`answer_${question.id}`}
                  checked={isCorrect}
                  onChange={(e) => handleSelectAnswer(opt, e.target.checked)}
                  disabled={opt === ''}
                  className="w-4 h-4 text-indigo-650 border-slate-800 bg-slate-950 focus:ring-indigo-500 cursor-pointer"
                />
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                  placeholder={`Choice ${optIdx + 1}`}
                  className="flex-grow bg-slate-950 border border-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-bold outline-none"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
