// LingoPeak Grid Generators

export interface Clue {
  number: number;
  direction: 'across' | 'down';
  text: string;
  row: number;
  col: number;
  length: number;
}

export interface CrosswordResult {
  grid: string[][];
  clues: Clue[];
}

export interface WordSearchResult {
  grid: string[][];
  words: string[];
}

/**
 * Auto-generates a Word Search grid from a list of words.
 */
export function generateWordSearch(rawWords: string[]): WordSearchResult {
  const words = rawWords
    .map(w => w.toUpperCase().replace(/[^A-Z]/g, ''))
    .filter(w => w.length > 1);

  if (words.length === 0) {
    return { grid: [['A']], words: [] };
  }

  // Determine grid size based on longest word and count
  const longestWord = Math.max(...words.map(w => w.length));
  const size = Math.min(16, Math.max(10, longestWord + 3));

  // Initialize empty grid
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(' '));

  // Try to place each word
  const placedWords: string[] = [];
  const directions = [
    [0, 1],   // horizontal right
    [1, 0],   // vertical down
    [1, 1],   // diagonal down-right
    [-1, 1],  // diagonal up-right
    [0, -1],  // horizontal left
    [-1, 0],  // vertical up
    [-1, -1], // diagonal up-left
    [1, -1]   // diagonal down-left
  ];

  for (const word of words) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      attempts++;
      const dir = directions[Math.floor(Math.random() * directions.length)];
      const rStep = dir[0];
      const cStep = dir[1];

      // Random starting coordinates
      const startR = Math.floor(Math.random() * size);
      const startC = Math.floor(Math.random() * size);

      // Check if word fits in bounds
      const endR = startR + rStep * (word.length - 1);
      const endC = startC + cStep * (word.length - 1);

      if (endR < 0 || endR >= size || endC < 0 || endC >= size) {
        continue;
      }

      // Check if letters overlap correctly without collision
      let canPlace = true;
      for (let i = 0; i < word.length; i++) {
        const currR = startR + rStep * i;
        const currC = startC + cStep * i;
        const cell = grid[currR][currC];
        if (cell !== ' ' && cell !== word[i]) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        // Place letters
        for (let i = 0; i < word.length; i++) {
          const currR = startR + rStep * i;
          const currC = startC + cStep * i;
          grid[currR][currC] = word[i];
        }
        placed = true;
        placedWords.push(word);
      }
    }
  }

  // Fill remaining spots with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === ' ') {
        grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return { grid, words: placedWords };
}

/**
 * Auto-generates a Crossword layout grid and clues from a list of words + clues.
 */
export function generateCrossword(items: { word: string; clue: string }[]): CrosswordResult {
  const cleanedItems = items
    .map(it => ({
      word: it.word.toUpperCase().replace(/[^A-Z]/g, ''),
      clue: it.clue.trim()
    }))
    .filter(it => it.word.length > 1 && it.clue.length > 0);

  if (cleanedItems.length === 0) {
    return { grid: [['.']], clues: [] };
  }

  // Sort words by length descending to place longest words first
  cleanedItems.sort((a, b) => b.word.length - a.word.length);

  // Large temporary grid
  const maxGridSize = 30;
  const tempGrid: string[][] = Array(maxGridSize)
    .fill(null)
    .map(() => Array(maxGridSize).fill('.'));

  interface PlacedWord {
    word: string;
    clue: string;
    row: number;
    col: number;
    direction: 'across' | 'down';
  }

  const placedList: PlacedWord[] = [];

  // Place first word in the center
  const first = cleanedItems[0];
  const firstRow = 15;
  const firstCol = 15 - Math.floor(first.word.length / 2);
  for (let i = 0; i < first.word.length; i++) {
    tempGrid[firstRow][firstCol + i] = first.word[i];
  }
  placedList.push({
    word: first.word,
    clue: first.clue,
    row: firstRow,
    col: firstCol,
    direction: 'across'
  });

  // Helper: check if we can place a word
  const checkPlacement = (
    word: string,
    row: number,
    col: number,
    dir: 'across' | 'down'
  ): boolean => {
    const len = word.length;

    // Bounds check
    if (row < 0 || row >= maxGridSize || col < 0 || col >= maxGridSize) return false;
    if (dir === 'across' && col + len > maxGridSize) return false;
    if (dir === 'down' && row + len > maxGridSize) return false;

    // Cells before and after must be empty/blocked
    if (dir === 'across') {
      if (col > 0 && tempGrid[row][col - 1] !== '.') return false;
      if (col + len < maxGridSize && tempGrid[row][col + len] !== '.') return false;
    } else {
      if (row > 0 && tempGrid[row - 1][col] !== '.') return false;
      if (row + len < maxGridSize && tempGrid[row + len][col] !== '.') return false;
    }

    let hasIntersection = false;

    for (let i = 0; i < len; i++) {
      const currR = dir === 'across' ? row : row + i;
      const currC = dir === 'across' ? col + i : col;
      const cell = tempGrid[currR][currC];

      if (cell === '.') {
        // Must not touch any other word adjacent to it
        if (dir === 'across') {
          if (currR > 0 && tempGrid[currR - 1][currC] !== '.') return false;
          if (currR < maxGridSize - 1 && tempGrid[currR + 1][currC] !== '.') return false;
        } else {
          if (currC > 0 && tempGrid[currR][currC - 1] !== '.') return false;
          if (currC < maxGridSize - 1 && tempGrid[currR][currC + 1] !== '.') return false;
        }
      } else if (cell === word[i]) {
        hasIntersection = true;
      } else {
        return false; // Character collision
      }
    }

    return hasIntersection;
  };

  // Try placing subsequent words
  for (let idx = 1; idx < cleanedItems.length; idx++) {
    const item = cleanedItems[idx];
    let bestPlacement: { row: number; col: number; direction: 'across' | 'down'; score: number } | null = null;

    // Find intersections with placed words
    for (const placed of placedList) {
      for (let pIdx = 0; pIdx < placed.word.length; pIdx++) {
        for (let wIdx = 0; wIdx < item.word.length; wIdx++) {
          if (placed.word[pIdx] === item.word[wIdx]) {
            // Found matching letter!
            // Try placing perpendicularly
            const nextDir = placed.direction === 'across' ? 'down' : 'across';
            const rStart = nextDir === 'down' ? placed.row - wIdx : placed.row;
            const cStart = nextDir === 'across' ? placed.col - wIdx : placed.col;

            const targetRow = nextDir === 'down' ? rStart : placed.row;
            const targetCol = nextDir === 'across' ? cStart : placed.col + pIdx;
            const startRow = nextDir === 'down' ? rStart : placed.row - wIdx;
            const startCol = nextDir === 'across' ? cStart : placed.col;

            // Adjust start coordinates based on index offset
            const finalR = nextDir === 'down' ? placed.row - wIdx : placed.row;
            const finalC = nextDir === 'across' ? placed.col - wIdx : placed.col + pIdx;

            if (checkPlacement(item.word, finalR, finalC, nextDir)) {
              // Higher score for compact designs (lower bounding box size)
              const minR = Math.min(...placedList.map(p => p.row), finalR);
              const maxR = Math.max(...placedList.map(p => p.row + (p.direction === 'down' ? p.word.length : 0)), finalR + (nextDir === 'down' ? item.word.length : 0));
              const minC = Math.min(...placedList.map(p => p.col), finalC);
              const maxC = Math.max(...placedList.map(p => p.col + (p.direction === 'across' ? p.word.length : 0)), finalC + (nextDir === 'across' ? item.word.length : 0));
              
              const boxArea = (maxR - minR) * (maxC - minC);
              const score = 1000 - boxArea; // Prefer smaller bounding area

              if (!bestPlacement || score > bestPlacement.score) {
                bestPlacement = { row: finalR, col: finalC, direction: nextDir, score };
              }
            }
          }
        }
      }
    }

    if (bestPlacement) {
      // Place the word
      const { row, col, direction } = bestPlacement;
      for (let i = 0; i < item.word.length; i++) {
        const currR = direction === 'across' ? row : row + i;
        const currC = direction === 'across' ? col + i : col;
        tempGrid[currR][currC] = item.word[i];
      }
      placedList.push({
        word: item.word,
        clue: item.clue,
        row,
        col,
        direction
      });
    } else {
      // If we cannot intersect, place it in an empty parallel row with 2 padding cells
      let fallbackPlaced = false;
      let startR = 2;
      
      while (startR < maxGridSize - 2 && !fallbackPlaced) {
        // Find if we can place across
        let clear = true;
        for (let c = 5; c < 5 + item.word.length; c++) {
          if (tempGrid[startR][c] !== '.' || tempGrid[startR-1][c] !== '.' || tempGrid[startR+1][c] !== '.') {
            clear = false;
            break;
          }
        }
        if (clear) {
          for (let i = 0; i < item.word.length; i++) {
            tempGrid[startR][5 + i] = item.word[i];
          }
          placedList.push({
            word: item.word,
            clue: item.clue,
            row: startR,
            col: 5,
            direction: 'across'
          });
          fallbackPlaced = true;
        }
        startR += 4;
      }
    }
  }

  // Find bounding box of placed words to crop the grid
  let minRow = maxGridSize, maxRow = 0, minCol = maxGridSize, maxCol = 0;
  for (let r = 0; r < maxGridSize; r++) {
    for (let c = 0; c < maxGridSize; c++) {
      if (tempGrid[r][c] !== '.') {
        if (r < minRow) minRow = r;
        if (r > maxRow) maxRow = r;
        if (c < minCol) minCol = c;
        if (c > maxCol) maxCol = c;
      }
    }
  }

  // Bounding box size (add 1 cell padding around the layout)
  const pad = 1;
  const startRowIndex = Math.max(0, minRow - pad);
  const endRowIndex = Math.min(maxGridSize - 1, maxRow + pad);
  const startColIndex = Math.max(0, minCol - pad);
  const endColIndex = Math.min(maxGridSize - 1, maxCol + pad);

  const croppedHeight = endRowIndex - startRowIndex + 1;
  const croppedWidth = endColIndex - startColIndex + 1;

  // Initialize cropped grid
  const croppedGrid: string[][] = Array(croppedHeight)
    .fill(null)
    .map(() => Array(croppedWidth).fill('.'));

  // Copy values and shift coordinates of placed words
  for (let r = 0; r < croppedHeight; r++) {
    for (let c = 0; c < croppedWidth; c++) {
      croppedGrid[r][c] = tempGrid[startRowIndex + r][startColIndex + c];
    }
  }

  const shiftedPlaced = placedList.map(p => ({
    ...p,
    row: p.row - startRowIndex,
    col: p.col - startColIndex
  }));

  // Assign clue numbers by scanning grid top-to-bottom, left-to-right
  const clues: Clue[] = [];
  let numberCounter = 1;
  
  // Track cell starts to assign the same number if across and down start at the same cell
  const startCellNumbers: Record<string, number> = {};

  for (let r = 0; r < croppedHeight; r++) {
    for (let c = 0; c < croppedWidth; c++) {
      const cellKey = `${r}_${c}`;
      let assignedNumber = false;

      // Check if any word starts here across
      const startsAcross = shiftedPlaced.find(p => p.row === r && p.col === c && p.direction === 'across');
      // Check if any word starts here down
      const startsDown = shiftedPlaced.find(p => p.row === r && p.col === c && p.direction === 'down');

      if (startsAcross || startsDown) {
        if (!startCellNumbers[cellKey]) {
          startCellNumbers[cellKey] = numberCounter;
          numberCounter++;
        }
        const num = startCellNumbers[cellKey];

        if (startsAcross) {
          clues.push({
            number: num,
            direction: 'across',
            text: startsAcross.clue,
            row: r,
            col: c,
            length: startsAcross.word.length
          });
        }
        if (startsDown) {
          clues.push({
            number: num,
            direction: 'down',
            text: startsDown.clue,
            row: r,
            col: c,
            length: startsDown.word.length
          });
        }
      }
    }
  }

  return { grid: croppedGrid, clues };
}
