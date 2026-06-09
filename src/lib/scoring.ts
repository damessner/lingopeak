import { Question } from './worksheet-types';

/**
 * Validates if a student's answer for a specific question is correct.
 */
export function isAnswerCorrect(q: Question, studentAns: any): boolean {
  if (!studentAns) return false;

  switch (q.type) {
    case 'multiple_choice':
      if (q.isMulti) {
        const correctSet = q.answers || (q.answer ? [q.answer] : []);
        const studentSet = Array.isArray(studentAns) ? studentAns : (studentAns ? [studentAns] : []);
        return correctSet.length === studentSet.length &&
          correctSet.every((ans: string) => studentSet.includes(ans));
      } else {
        return studentAns === q.answer;
      }

    case 'fill_in_gap': {
      const normalizedText = q.text.replace(/#([^#]+)#/g, '[$1]');
      const gapMatches = normalizedText.match(/\[([^\]]+)\]/g) || [];
      if (gapMatches.length === 0) return false;
      
      let gapsCorrect = true;
      gapMatches.forEach((match: string, idx: number) => {
        const correctAns = match.slice(1, -1).trim();
        const studentVal = (studentAns[`gap_${idx}`] || '').trim();
        if (correctAns.toLowerCase() !== studentVal.toLowerCase()) {
          gapsCorrect = false;
        }
      });
      return gapsCorrect;
    }

    case 'drag_and_drop': {
      let dragCorrect = true;
      let hasGaps = false;
      q.sentences.forEach((sentence: string, sIdx: number) => {
        const normalizedSentence = sentence.replace(/#([^#]+)#/g, '[$1]');
        const matches = normalizedSentence.match(/\[([^\]]+)\]/g) || [];
        if (matches.length > 0) hasGaps = true;
        matches.forEach((match: string, mIdx: number) => {
          const correctAns = match.slice(1, -1).trim();
          const studentVal = (studentAns[`slot_${sIdx}_${mIdx}`] || '').trim();
          if (correctAns !== studentVal) {
            dragCorrect = false;
          }
        });
      });
      return dragCorrect && hasGaps;
    }

    case 'category_sorting':
      if (!q.items || q.items.length === 0) return false;
      return q.items.every((item: any) => studentAns[item.text] === item.category);

    case 'correct_the_mistake':
      return (
        studentAns.selectedWord?.toLowerCase() === q.mistake.toLowerCase() &&
        studentAns.correctionText?.trim().toLowerCase() === q.correction.toLowerCase()
      );

    case 'choice_matrix':
      if (!q.rows || q.rows.length === 0) return false;
      return q.rows.every((row: string) => studentAns[row] === q.answers[row]);

    case 'crossword': {
      const gridRows = q.grid?.length || 0;
      const gridCols = q.grid?.[0]?.length || 0;
      if (gridRows === 0) return false;
      
      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          if (q.grid[r][c] !== '.') {
            const cellKey = `${r}_${c}`;
            if (studentAns[cellKey] !== q.grid[r][c]) {
              return false;
            }
          }
        }
      }
      return true;
    }

    case 'sentence_unscramble':
      return Array.isArray(studentAns) && studentAns.join(' ') === q.words.join(' ');

    case 'matching_pairs': {
      const pairs = q.pairs as Record<string, string>;
      const pairKeys = Object.keys(pairs);
      if (pairKeys.length === 0 || !studentAns || typeof studentAns !== 'object') return false;
      
      for (const key of pairKeys) {
        if (studentAns[key]?.trim().toLowerCase() !== pairs[key].trim().toLowerCase()) {
          return false;
        }
      }
      return true;
    }

    case 'word_search': {
      const targetWords: string[] = Array.isArray(q.words) ? q.words : [];
      const foundWords: string[] = Array.isArray(studentAns) ? studentAns : [];
      return targetWords.length > 0 && targetWords.every((w: string) => foundWords.includes(w));
    }

    case 'order_sentences':
      return Array.isArray(studentAns) && JSON.stringify(studentAns) === JSON.stringify(q.sentences);

    default:
      return false;
  }
}

/**
 * Calculates the percentage score (0-100) for a worksheet based on student answers.
 * This server-side implementation ensures security by validating answers against the database.
 */
export function calculateScore(questions: Question[], answers: Record<string, any>): number {
  if (!questions.length) return 0;
  
  let correctCount = 0;
  questions.forEach((q) => {
    if (isAnswerCorrect(q, answers[q.id])) {
      correctCount++;
    }
  });

  return Math.round((correctCount / questions.length) * 100);
}
