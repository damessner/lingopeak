'use client';

import { useState, useEffect } from 'react';

interface MatchingPairsProps {
  question: {
    id: string;
    question: string;
    pairs: Record<string, string>; // e.g. {"apple": "Apfel", "dog": "Hund", "hello": "hallo"}
  };
  value: string[]; // List of correctly matched keys, e.g. ["apple", "dog"]
  onChange: (val: string[]) => void;
}

interface Card {
  id: string; // Unique id for each item (word)
  text: string;
  type: 'key' | 'value';
  matchKey: string; // The key it binds to (e.g. "apple" for both "apple" and "Apfel")
}

export default function MatchingPairs({ question, value, onChange }: MatchingPairsProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<string[]>([]);

  const matches = value || [];

  // Shuffle and create cards grid on mount
  useEffect(() => {
    const list: Card[] = [];
    Object.entries(question.pairs).forEach(([key, val]) => {
      list.push({
        id: `key_${key}`,
        text: key,
        type: 'key',
        matchKey: key,
      });
      list.push({
        id: `val_${key}`,
        text: val,
        type: 'value',
        matchKey: key,
      });
    });

    // Fisher-Yates Shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }

    setCards(list);
  }, [question.pairs]);

  const handleCardClick = (card: Card) => {
    // Prevent clicking already matched items or failed cards during penalty cooldown
    const isMatched = matches.includes(card.matchKey);
    if (isMatched || failedIds.length > 0) return;

    if (!selectedId) {
      // First selection
      setSelectedId(card.id);
    } else {
      // Second selection
      if (selectedId === card.id) {
        setSelectedId(null); // Deselect if tapping same card
        return;
      }

      const firstCard = cards.find((c) => c.id === selectedId)!;

      // Verify matching logic
      if (firstCard.matchKey === card.matchKey && firstCard.type !== card.type) {
        // Correct Match!
        onChange([...matches, card.matchKey]);
        setSelectedId(null);
      } else {
        // Failed Match (shake or highlights red)
        setFailedIds([firstCard.id, card.id]);
        setSelectedId(null);

        // Cooldown timer to show error before reset
        setTimeout(() => {
          setFailedIds([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white leading-snug">{question.question}</h3>

      {/* Grid of paired cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
        {cards.map((card) => {
          const isMatched = matches.includes(card.matchKey);
          const isSelected = selectedId === card.id;
          const isFailed = failedIds.includes(card.id);

          return (
            <button
              key={card.id}
              type="button"
              disabled={isMatched}
              onClick={() => handleCardClick(card)}
              className={`py-6 px-4 rounded-2xl border text-center font-bold text-sm md:text-base transition-all select-none flex items-center justify-center min-h-[90px] cursor-pointer ${
                isMatched
                  ? 'bg-emerald-600/20 border-emerald-500/80 text-emerald-300 scale-95 opacity-60 cursor-not-allowed'
                  : isFailed
                  ? 'bg-red-500/20 border-red-500 text-red-200 animate-shake shadow-[0_0_12px_rgba(239,68,68,0.25)]'
                  : isSelected
                  ? 'bg-indigo-600/30 border-indigo-500 text-white scale-105 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'bg-slate-900/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white active:scale-95'
              }`}
            >
              <span>{card.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      <div className="text-center text-xs text-slate-500">
        Matched {matches.length} out of {Object.keys(question.pairs).length} pairs.
      </div>
    </div>
  );
}
