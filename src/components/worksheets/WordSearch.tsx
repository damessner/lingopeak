'use client';

import { useState } from 'react';

interface WordSearchProps {
  question: {
    id: string;
    question: string;
    words: string[]; // List of uppercase words to find, e.g. ["VERB", "SIMPLE", "NOUN"]
    grid: string[][]; // 2D array of grid letters
  };
  value: string[]; // List of found words, e.g. ["VERB"]
  onChange: (val: string[]) => void;
}

export default function WordSearch({ question, value, onChange }: WordSearchProps) {
  const grid = question.grid;
  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;

  const [startCell, setStartCell] = useState<{ row: number; col: number } | null>(null);
  const foundWords = value || [];

  // Helper: check if cells lie in a straight line (horizontal, vertical, or diagonal)
  const getLineCells = (
    r1: number,
    c1: number,
    r2: number,
    c2: number
  ): { row: number; col: number }[] => {
    const cells: { row: number; col: number }[] = [];
    const dr = r2 - r1;
    const dc = c2 - c1;

    // Check if horizontal, vertical, or 45-degree diagonal
    const isHorizontal = dr === 0;
    const isVertical = dc === 0;
    const isDiagonal = Math.abs(dr) === Math.abs(dc);

    if (!isHorizontal && !isVertical && !isDiagonal) return []; // Not a straight line

    const steps = Math.max(Math.abs(dr), Math.abs(dc));
    const stepR = dr === 0 ? 0 : dr / steps;
    const stepC = dc === 0 ? 0 : dc / steps;

    for (let i = 0; i <= steps; i++) {
      cells.push({
        row: r1 + Math.round(i * stepR),
        col: c1 + Math.round(i * stepC),
      });
    }

    return cells;
  };

  const handleCellClick = (row: number, col: number) => {
    if (!startCell) {
      // Step 1: Select start cell
      setStartCell({ row, col });
    } else {
      // Step 2: Select end cell and check word
      const cells = getLineCells(startCell.row, startCell.col, row, col);

      if (cells.length > 0) {
        // Extract string from grid
        let wordStr = '';
        cells.forEach((cell) => {
          wordStr += grid[cell.row][cell.col];
        });

        const reversedWordStr = wordStr.split('').reverse().join('');

        // Find if word is in list and not already found
        const matchedWord = question.words.find(
          (w) =>
            (w === wordStr || w === reversedWordStr) && !foundWords.includes(w)
        );

        if (matchedWord) {
          // Correct Match!
          onChange([...foundWords, matchedWord]);
        }
      }

      setStartCell(null); // Reset selection
    }
  };

  // Helper: determine if a grid cell belongs to a found word
  // To keep it simple, we scan the paths of all target words in foundWords
  const isCellInFoundWord = (row: number, col: number) => {
    // Scan all clues
    let found = false;
    foundWords.forEach((word) => {
      // Look for the word in the grid to highlight its path
      // Search all horizontal, vertical, and diagonal paths matching the length
      const len = word.length;
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const directions = [
            [0, 1], // across
            [1, 0], // down
            [1, 1], // diagonal down-right
            [-1, 1], // diagonal up-right
          ];

          directions.forEach(([dr, dc]) => {
            const endR = r + dr * (len - 1);
            const endC = c + dc * (len - 1);

            if (endR >= 0 && endR < numRows && endC >= 0 && endC < numCols) {
              let extracted = '';
              for (let i = 0; i < len; i++) {
                extracted += grid[r + dr * i][c + dc * i];
              }

              if (extracted === word || extracted.split('').reverse().join('') === word) {
                // Check if current cell lies on this path
                for (let i = 0; i < len; i++) {
                  if (r + dr * i === row && c + dc * i === col) {
                    found = true;
                  }
                }
              }
            }
          });
        }
      }
    });

    return found;
  };

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6 items-start">
      
      {/* Left Column: Letter Grid */}
      <div className="flex-shrink-0 mx-auto bg-slate-900/30 p-4 border border-slate-800 rounded-2xl select-none">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((rowArr, rIdx) =>
            rowArr.map((letter, cIdx) => {
              const isStart = startCell?.row === rIdx && startCell?.col === cIdx;
              const isFound = isCellInFoundWord(rIdx, cIdx);

              return (
                <button
                  key={`${rIdx}_${cIdx}`}
                  type="button"
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm md:text-base select-none transition-all cursor-pointer ${
                    isFound
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-extrabold shadow-sm'
                      : isStart
                      ? 'bg-indigo-600 border-indigo-500 text-white scale-105 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'bg-slate-900/50 border-slate-850 text-slate-300 hover:border-slate-700'
                  }`}
                  style={{ minWidth: '40px', minHeight: '40px' }}
                >
                  {letter}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Words Bank */}
      <div className="flex-grow w-full space-y-4">
        <div className="p-4 bg-slate-950/30 border border-slate-800/80 rounded-2xl">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Find the Hidden Words ({foundWords.length} / {question.words.length})
          </label>
          
          <div className="flex flex-wrap gap-2.5">
            {question.words.map((word) => {
              const isFound = foundWords.includes(word);
              return (
                <span
                  key={word}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border select-none transition-all ${
                    isFound
                      ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-400 line-through scale-95 opacity-60'
                      : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>

        {startCell && (
          <div className="text-xs text-indigo-400 animate-pulse font-semibold">
            📌 Tapped start letter. Tap the end letter of the word to select.
          </div>
        )}
      </div>

    </div>
  );
}
