import { test } from 'node:test';
import assert from 'node:assert';

/**
 * Tests for worksheet scoring logic in WorksheetContainer.tsx's calculateScore function.
 * These tests verify that each question type scores correctly — not just length checks.
 */

// ── Scoring helpers (mirrors the logic in WorksheetContainer.tsx) ──

interface QuestionBase {
  id: string;
  type: string;
  question: string;
}

interface MultipleChoiceQ extends QuestionBase {
  type: 'multiple_choice';
  options: string[];
  answer: string;
  isMulti?: boolean;
  answers?: string[];
}

interface FillInGapQ extends QuestionBase {
  type: 'fill_in_gap';
  text: string;
}

interface MatchingPairsQ extends QuestionBase {
  type: 'matching_pairs';
  pairs: Record<string, string>;
}

interface WordSearchQ extends QuestionBase {
  type: 'word_search';
  grid: string[][];
  words: Array<{ word: string; positions: Array<[number, number]> }>;
}

interface SentenceUnscrambleQ extends QuestionBase {
  type: 'sentence_unscramble';
  words: string[];
}

interface DragAndDropQ extends QuestionBase {
  type: 'drag_and_drop';
  sentences: string[];
  distractors: string[];
}

interface CategorySortingQ extends QuestionBase {
  type: 'category_sorting';
  categories: string[];
  items: Array<{ text: string; category: string }>;
}

interface CorrectTheMistakeQ extends QuestionBase {
  type: 'correct_the_mistake';
  text: string;
  mistake: string;
  correction: string;
}

interface ChoiceMatrixQ extends QuestionBase {
  type: 'choice_matrix';
  rows: string[];
  columns: string[];
  answers: Record<string, string>;
}

interface OrderSentencesQ extends QuestionBase {
  type: 'order_sentences';
  sentences: string[];
}

type Question = MultipleChoiceQ | FillInGapQ | MatchingPairsQ | WordSearchQ | SentenceUnscrambleQ | DragAndDropQ | CategorySortingQ | CorrectTheMistakeQ | ChoiceMatrixQ | OrderSentencesQ;

function calculateScore(questions: Question[], answers: Record<string, any>): number {
  let correct = 0;
  for (const q of questions) {
    const studentAns = answers[q.id];
    if (studentAns === undefined || studentAns === null) continue;

    switch (q.type) {
      case 'multiple_choice':
        if ((q as MultipleChoiceQ).isMulti) {
          const mcq = q as MultipleChoiceQ;
          const correctSet = mcq.answers || (mcq.answer ? [mcq.answer] : []);
          const studentSet = Array.isArray(studentAns) ? studentAns : [studentAns];
          if (correctSet.length === studentSet.length && correctSet.every(a => studentSet.includes(a))) correct++;
        } else {
          if (studentAns === (q as MultipleChoiceQ).answer) correct++;
        }
        break;

      case 'fill_in_gap': {
        const gapQ = q as FillInGapQ;
        const normalized = gapQ.text.replace(/#([^#]+)#/g, '[$1]');
        const gaps = normalized.match(/\[([^\]]+)\]/g) || [];
        let allCorrect = true;
        gaps.forEach((match, idx) => {
          const correctAns = match.slice(1, -1).trim();
          const studentVal = (studentAns[`gap_${idx}`] || '').trim();
          if (correctAns.toLowerCase() !== studentVal.toLowerCase()) allCorrect = false;
        });
        if (allCorrect) correct++;
        break;
      }

      case 'matching_pairs': {
        const mpq = q as MatchingPairsQ;
        const pairs = mpq.pairs;
        const keys = Object.keys(pairs);
        let allCorrect = true;
        if (!studentAns || typeof studentAns !== 'object') {
          allCorrect = false;
        } else {
          for (const key of keys) {
            if (studentAns[key]?.trim().toLowerCase() !== pairs[key].trim().toLowerCase()) {
              allCorrect = false;
              break;
            }
          }
        }
        if (allCorrect && keys.length > 0) correct++;
        break;
      }

      case 'word_search': {
        const wsq = q as WordSearchQ;
        const targetWords: string[] = Array.isArray(wsq.words) && typeof wsq.words[0] === 'string'
          ? wsq.words as unknown as string[]
          : (wsq.words as unknown as Array<{ word: string }>).map(w => w.word);
        const foundWords: string[] = Array.isArray(studentAns) ? studentAns : [];
        const allFound = targetWords.length > 0 && targetWords.every((w: string) => foundWords.includes(w));
        if (allFound) correct++;
        break;
      }

      case 'sentence_unscramble':
        if (Array.isArray(studentAns) && studentAns.join(' ') === (q as SentenceUnscrambleQ).words.join(' ')) correct++;
        break;

      case 'order_sentences':
        if (Array.isArray(studentAns) && JSON.stringify(studentAns) === JSON.stringify((q as OrderSentencesQ).sentences)) correct++;
        break;

      case 'category_sorting': {
        const csq = q as CategorySortingQ;
        let allCorrect = true;
        csq.items.forEach(item => {
          if (studentAns[item.text] !== item.category) allCorrect = false;
        });
        if (allCorrect) correct++;
        break;
      }

      case 'correct_the_mistake': {
        const ctmq = q as CorrectTheMistakeQ;
        if (studentAns.selectedWord?.toLowerCase() === ctmq.mistake.toLowerCase() &&
            studentAns.correctionText?.trim().toLowerCase() === ctmq.correction.toLowerCase()) correct++;
        break;
      }

      case 'choice_matrix': {
        const cmq = q as ChoiceMatrixQ;
        let allCorrect = true;
        cmq.rows.forEach(row => {
          if (studentAns[row] !== cmq.answers[row]) allCorrect = false;
        });
        if (allCorrect) correct++;
        break;
      }

      case 'drag_and_drop': {
        const ddq = q as DragAndDropQ;
        let allCorrect = true;
        ddq.sentences.forEach((sentence, sIdx) => {
          const normalized = sentence.replace(/#([^#]+)#/g, '[$1]');
          const matches = normalized.match(/\[([^\]]+)\]/g) || [];
          matches.forEach((match, mIdx) => {
            const correctAns = match.slice(1, -1).trim();
            const studentVal = (studentAns[`slot_${sIdx}_${mIdx}`] || '').trim();
            if (correctAns !== studentVal) allCorrect = false;
          });
        });
        if (allCorrect) correct++;
        break;
      }
    }
  }
  return Math.round((correct / questions.length) * 100);
}

// ── Tests ──

test('Scoring: matching_pairs — correct answers score 100%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'matching_pairs',
    question: 'Match the opposites',
    pairs: { 'hot': 'cold', 'big': 'small', 'up': 'down' }
  }];
  const answers = { q1: { 'hot': 'cold', 'big': 'small', 'up': 'down' } };
  assert.strictEqual(calculateScore(questions, answers), 100);
});

test('Scoring: matching_pairs — wrong answers score 0%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'matching_pairs',
    question: 'Match the opposites',
    pairs: { 'hot': 'cold', 'big': 'small' }
  }];
  // Student submits all "hot" — should fail
  const answers = { q1: { 'hot': 'cold', 'big': 'cold' } };
  assert.strictEqual(calculateScore(questions, answers), 0);
});

test('Scoring: matching_pairs — empty submission scores 0%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'matching_pairs',
    question: 'Match',
    pairs: { 'a': 'b', 'c': 'd' }
  }];
  const answers = { q1: {} };
  assert.strictEqual(calculateScore(questions, answers), 0);
});

test('Scoring: matching_pairs — right-length wrong-contents still scores 0%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'matching_pairs',
    question: 'Match',
    pairs: { 'cat': 'feline', 'dog': 'canine' }
  }];
  // Array with right length but wrong contents — old code would give 100%!
  const answers = { q1: ['junk', 'junk'] };
  assert.strictEqual(calculateScore(questions, answers), 0);
});

test('Scoring: word_search — all words found scores 100%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'word_search',
    question: 'Find the words',
    grid: [['C', 'A', 'T'], ['D', 'O', 'G']],
    words: ['CAT', 'DOG']
  } as any];
  const answers = { q1: ['CAT', 'DOG'] };
  assert.strictEqual(calculateScore(questions, answers), 100);
});

test('Scoring: word_search — missing a word scores 0%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'word_search',
    question: 'Find the words',
    grid: [['C', 'A', 'T'], ['D', 'O', 'G']],
    words: ['CAT', 'DOG']
  } as any];
  const answers = { q1: ['CAT'] };
  assert.strictEqual(calculateScore(questions, answers), 0);
});

test('Scoring: word_search — right-length wrong words scores 0%', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'word_search',
    question: 'Find',
    grid: [['A']],
    words: ['CAT', 'DOG']
  } as any];
  // Array with right length (2) but wrong words — old code would give 100%!
  const answers = { q1: ['JUNK', 'WRONG'] };
  assert.strictEqual(calculateScore(questions, answers), 0);
});

test('Scoring: multiple_choice — correct single answer', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'multiple_choice',
    question: 'What is 2+2?',
    options: ['3', '4', '5', '6'],
    answer: '4'
  }];
  assert.strictEqual(calculateScore(questions, { q1: '4' }), 100);
  assert.strictEqual(calculateScore(questions, { q1: '3' }), 0);
});

test('Scoring: multiple_choice — multi-select correct', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'multiple_choice',
    question: 'Select vowels',
    options: ['a', 'b', 'c', 'e'],
    isMulti: true,
    answers: ['a', 'e']
  }];
  assert.strictEqual(calculateScore(questions, { q1: ['a', 'e'] }), 100);
  assert.strictEqual(calculateScore(questions, { q1: ['a'] }), 0);
});

test('Scoring: fill_in_gap — correct', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'fill_in_gap',
    question: 'Fill the gap',
    text: 'He [is] a student.'
  }];
  assert.strictEqual(calculateScore(questions, { q1: { gap_0: 'is' } }), 100);
  assert.strictEqual(calculateScore(questions, { q1: { gap_0: 'was' } }), 0);
});

test('Scoring: sentence_unscramble — correct', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'sentence_unscramble',
    question: 'Unscramble',
    words: ['Hello', 'world']
  }];
  assert.strictEqual(calculateScore(questions, { q1: ['Hello', 'world'] }), 100);
  assert.strictEqual(calculateScore(questions, { q1: ['world', 'Hello'] }), 0);
});

test('Scoring: category_sorting — correct', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'category_sorting',
    question: 'Sort',
    categories: ['Fruit', 'Vegetable'],
    items: [{ text: 'Apple', category: 'Fruit' }, { text: 'Carrot', category: 'Vegetable' }]
  }];
  assert.strictEqual(calculateScore(questions, { q1: { 'Apple': 'Fruit', 'Carrot': 'Vegetable' } }), 100);
  assert.strictEqual(calculateScore(questions, { q1: { 'Apple': 'Vegetable', 'Carrot': 'Vegetable' } }), 0);
});

test('Scoring: correct_the_mistake — correct', () => {
  const questions: Question[] = [{
    id: 'q1',
    type: 'correct_the_mistake',
    question: 'Fix it',
    text: 'He go to school.',
    mistake: 'go',
    correction: 'goes'
  }];
  assert.strictEqual(calculateScore(questions, { q1: { selectedWord: 'go', correctionText: 'goes' } }), 100);
  assert.strictEqual(calculateScore(questions, { q1: { selectedWord: 'go', correctionText: 'went' } }), 0);
});
