'use client';

import { useState, useRef } from 'react';

interface Clue {
  number: number;
  direction: 'across' | 'down';
  text: string;
  row: number;
  col: number;
  length: number;
}

interface CrosswordProps {
  question: {
    id: string;
    question: string;
    grid: string[][]; // 2D array of grid letters. '.' is blocked
    clues: Clue[];
  };
  value: Record<string, string>; // Maps "row_col" -> character typed
  onChange: (val: Record<string, string>) => void;
}

export default function Crossword({ question, value, onChange }: CrosswordProps) {
  const grid = question.grid;
  const numRows = grid.length;
  const numCols = grid[0]?.length || 0;
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [activeDirection, setActiveDirection] = useState<'across' | 'down'>('across');

  const cellValues = value || {};

  // Find if a clue starts at a given row and column, returning its number label
  const getCellLabel = (row: number, col: number) => {
    const startClue = question.clues.find((clue) => clue.row === row && clue.col === col);
    return startClue ? startClue.number : null;
  };

  const handleCellClick = (row: number, col: number) => {
    if (grid[row][col] === '.') return;

    if (activeCell?.row === row && activeCell?.col === col) {
      // Toggle direction if clicking same cell
      setActiveDirection((prev) => (prev === 'across' ? 'down' : 'across'));
    } else {
      setActiveCell({ row, col });
    }
  };

  const handleCellChange = (row: number, col: number, char: string) => {
    const cleanChar = char.toUpperCase().slice(-1); // Only take last typed letter, capitalised
    const cellKey = `${row}_${col}`;

    const newValues = { ...cellValues };
    if (cleanChar) {
      newValues[cellKey] = cleanChar;
    } else {
      delete newValues[cellKey];
    }
    onChange(newValues);

    // Auto-advance to the next grid square
    if (cleanChar) {
      if (activeDirection === 'across') {
        const nextCol = col + 1;
        if (nextCol < numCols && grid[row][nextCol] !== '.') {
          focusCell(row, nextCol);
        }
      } else {
        const nextRow = row + 1;
        if (nextRow < numRows && grid[nextRow][col] !== '.') {
          focusCell(nextRow, col);
        }
      }
    }
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace regression
    if (e.key === 'Backspace' && !cellValues[`${row}_${col}`]) {
      if (activeDirection === 'across') {
        const prevCol = col - 1;
        if (prevCol >= 0 && grid[row][prevCol] !== '.') {
          focusCell(row, prevCol);
        }
      } else {
        const prevRow = row - 1;
        if (prevRow >= 0 && grid[prevRow][col] !== '.') {
          focusCell(prevRow, col);
        }
      }
    }
  };

  const focusCell = (row: number, col: number) => {
    setActiveCell({ row, col });
    const targetRef = inputRefs.current[`${row}_${col}`];
    if (targetRef) {
      targetRef.focus();
    }
  };

  // Find active clue text based on current cursor cell and direction
  const getActiveClueText = () => {
    if (!activeCell) return 'Tap a square to see its clue.';
    
    // Find clues that cover the active cell in activeDirection
    const activeClue = question.clues.find((clue) => {
      if (clue.direction !== activeDirection) return false;
      if (clue.direction === 'across') {
        return (
          clue.row === activeCell.row &&
          activeCell.col >= clue.col &&
          activeCell.col < clue.col + clue.length
        );
      } else {
        return (
          clue.col === activeCell.col &&
          activeCell.row >= clue.row &&
          activeCell.row < clue.row + clue.length
        );
      }
    });

    if (activeClue) {
      return `${activeClue.number} ${activeDirection.toUpperCase()}: ${activeClue.text}`;
    }

    // Try showing opposite direction if current direction has no matching clue
    const fallbackClue = question.clues.find((clue) => {
      if (clue.direction === 'across') {
        return (
          clue.row === activeCell.row &&
          activeCell.col >= clue.col &&
          activeCell.col < clue.col + clue.length
        );
      } else {
        return (
          clue.col === activeCell.col &&
          activeCell.row >= clue.row &&
          activeCell.row < clue.row + clue.length
        );
      }
    });

    if (fallbackClue) {
      return `${fallbackClue.number} ${fallbackClue.direction.toUpperCase()}: ${fallbackClue.text}`;
    }

    return 'Practice spelling the vocab words!';
  };

  return (
    <div className="space-y-6 flex flex-col md:flex-row gap-6 items-start">
      
      {/* Left Column: Interactive Grid */}
      <div className="flex-shrink-0 mx-auto bg-slate-900/30 p-4 border border-slate-800 rounded-2xl">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
          }}
        >
          {grid.map((rowArr, rIdx) =>
            rowArr.map((cell, cIdx) => {
              const isBlocked = cell === '.';
              const cellKey = `${rIdx}_${cIdx}`;
              const val = cellValues[cellKey] || '';
              const label = getCellLabel(rIdx, cIdx);
              const isActive = activeCell?.row === rIdx && activeCell?.col === cIdx;

              if (isBlocked) {
                return (
                  <div
                    key={cellKey}
                    className="w-10 h-10 md:w-12 md:h-12 bg-slate-950 rounded-lg shadow-inner"
                    style={{ minWidth: '40px', minHeight: '40px' }}
                  />
                );
              }

              return (
                <div
                  key={cellKey}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg border relative flex items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ minWidth: '40px', minHeight: '40px' }}
                >
                  {/* Clue number label */}
                  {label && (
                    <span className="absolute top-0.5 left-1 text-[8px] md:text-[9px] font-black text-slate-500 select-none">
                      {label}
                    </span>
                  )}
                  
                  {/* Letter Input */}
                  <input
                    ref={(el) => {
                      inputRefs.current[cellKey] = el;
                    }}
                    type="text"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(rIdx, cIdx, e)}
                    className="w-full h-full text-center bg-transparent border-none outline-none font-bold text-white text-sm md:text-base uppercase"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Clues List & Active Helper */}
      <div className="flex-grow w-full space-y-4">
        {/* Active Clue Banner */}
        <div className="p-4 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl">
          <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
            Active Clue
          </label>
          <div className="text-white text-sm font-semibold">{getActiveClueText()}</div>
        </div>

        {/* Full Clues List */}
        <div className="grid grid-cols-2 gap-4">
          {/* Across */}
          <div className="space-y-2 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2">
              Across
            </h4>
            <div className="space-y-1.5">
              {question.clues
                .filter((clue) => clue.direction === 'across')
                .map((clue) => (
                  <div
                    key={`${clue.number}_across`}
                    onClick={() => focusCell(clue.row, clue.col)}
                    className="text-xs text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer flex gap-1.5 items-start leading-relaxed"
                  >
                    <span className="font-bold text-indigo-400 select-none">{clue.number}.</span>
                    <span>{clue.text}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Down */}
          <div className="space-y-2 bg-slate-950/30 p-4 border border-slate-850 rounded-2xl max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 mb-2">
              Down
            </h4>
            <div className="space-y-1.5">
              {question.clues
                .filter((clue) => clue.direction === 'down')
                .map((clue) => (
                  <div
                    key={`${clue.number}_down`}
                    onClick={() => focusCell(clue.row, clue.col)}
                    className="text-xs text-slate-300 hover:text-indigo-400 transition-colors cursor-pointer flex gap-1.5 items-start leading-relaxed"
                  >
                    <span className="font-bold text-indigo-400 select-none">{clue.number}.</span>
                    <span>{clue.text}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
