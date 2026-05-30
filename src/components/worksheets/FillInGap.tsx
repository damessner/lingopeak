'use client';

import React from 'react';

interface FillInGapProps {
  question: {
    id: string;
    question: string;
    text: string; // e.g. "She [drives] (drive) to school, but they [walk] (walk) there."
  };
  value: Record<string, string>; // Maps gap index to student input
  onChange: (val: Record<string, string>) => void;
}

export default function FillInGap({ question, value, onChange }: FillInGapProps) {
  const text = question.text;
  const gapValues = value || {};

  // Regex to split by brackets e.g. [drives]
  // Match brackets and return them in the split results
  const parts = text.split(/(\[[^\]]+\])/g);

  let gapCounter = 0;

  const handleInputChange = (index: number, val: string) => {
    onChange({
      ...gapValues,
      [`gap_${index}`]: val,
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 mt-4 leading-loose text-slate-200 text-base md:text-lg flex flex-wrap items-center gap-y-3 gap-x-2">
        {parts.map((part, index) => {
          if (part.startsWith('[') && part.endsWith(']')) {
            const currentGapIndex = gapCounter;
            gapCounter++;
            
            // Extract potential hint in parenthesis following the gap, e.g. (be)
            // Note: In simple inputs, the hint is parsed separately by splitting
            return (
              <span key={index} className="inline-flex items-center gap-1.5 mx-1 relative">
                <input
                  type="text"
                  value={gapValues[`gap_${currentGapIndex}`] || ''}
                  onChange={(e) => handleInputChange(currentGapIndex, e.target.value)}
                  className="bg-slate-950/80 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-white font-bold rounded-xl text-center outline-none transition-all py-1 px-3 text-sm md:text-base"
                  style={{ width: '120px', minHeight: '38px' }}
                  placeholder="..."
                />
              </span>
            );
          }

          // Render normal text
          return <span key={index}>{part}</span>;
        })}
      </div>
    </div>
  );
}
