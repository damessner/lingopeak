'use client';

import { useState } from 'react';

interface DragAndDropProps {
  question: {
    id: string;
    question: string;
    sentences: string[]; // e.g. ["He is [driving] a blue car.", "We [have] two pet dogs."]
    words: string[]; // e.g. ["driving", "have", "run", "like"]
  };
  value: Record<string, string>; // Maps slot index e.g. "slot_0_0" -> placed word
  onChange: (val: Record<string, string>) => void;
}

export default function DragAndDrop({ question, value, onChange }: DragAndDropProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const slots = value || {};

  // Find all used words to disable them in the word bank
  const usedWords = Object.values(slots);

  const handleWordTap = (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null); // Deselect
    } else {
      setSelectedWord(word);
    }
  };

  const handleSlotTap = (sentenceIndex: number, slotIndex: number) => {
    const slotKey = `slot_${sentenceIndex}_${slotIndex}`;
    const currentWordInSlot = slots[slotKey];

    const newSlots = { ...slots };

    if (selectedWord) {
      // Place selected word in slot
      newSlots[slotKey] = selectedWord;
      onChange(newSlots);
      setSelectedWord(null); // Clear selection
    } else if (currentWordInSlot) {
      // If no word is selected but slot is tapped, remove word from slot
      delete newSlots[slotKey];
      onChange(newSlots);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>
      
      {/* Sentences list with slots */}
      <div className="space-y-4 bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 md:p-8">
        {question.sentences.map((sentence, sIdx) => {
          const normalizedSentence = sentence.replace(/#([^#]+)#/g, '[$1]');
          const parts = normalizedSentence.split(/(\[[^\]]+\])/g);
          let slotCounter = 0;

          return (
            <div key={sIdx} className="text-slate-200 text-base md:text-lg flex flex-wrap items-center gap-y-2 gap-x-1.5 leading-loose">
              <span className="text-slate-500 font-bold text-xs mr-1">{sIdx + 1}.</span>
              {parts.map((part, pIdx) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                  const currentSlotIdx = slotCounter;
                  slotCounter++;
                  const slotKey = `slot_${sIdx}_${currentSlotIdx}`;
                  const placedWord = slots[slotKey];

                  return (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => handleSlotTap(sIdx, currentSlotIdx)}
                      className={`inline-flex items-center justify-center rounded-xl border border-dashed text-xs md:text-sm font-bold transition-all px-3 py-1 min-w-[90px] h-[36px] cursor-pointer ${
                        placedWord
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100 scale-105 border-solid'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {placedWord || 'Drop here'}
                    </button>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>

      {/* Word bank */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Word Bank</label>
        <div className="flex flex-wrap gap-2.5 p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
          {question.words.map((word) => {
            const isUsed = usedWords.includes(word);
            const isSelected = selectedWord === word;

            return (
              <button
                key={word}
                type="button"
                disabled={isUsed}
                onClick={() => handleWordTap(word)}
                className={`py-2 px-4 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer select-none ${
                  isUsed
                    ? 'bg-slate-900/10 border-slate-900/20 text-slate-700 cursor-not-allowed line-through'
                    : isSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white scale-105 shadow-md shadow-indigo-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700 hover:text-white'
                }`}
                style={{ minHeight: '40px' }}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
