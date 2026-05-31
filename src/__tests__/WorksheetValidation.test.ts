import { test } from 'node:test';
import assert from 'node:assert';
import { validateQuestion } from '../components/teacher/builder/WorksheetValidation.ts';
import type { Question } from '../lib/worksheet-types.ts';

test('WorksheetValidation - Base Validation', () => {
  const invalidBase = {
    id: '1',
    type: 'sentence_unscramble',
    question: '   ',
    words: ['hello', 'world']
  } as any as Question;

  const result = validateQuestion(invalidBase, 0);
  assert.ok(result);
  assert.match(result, /instructions\/prompt is required/);
});

test('WorksheetValidation - Multiple Choice', () => {
  // Valid
  const validMC = {
    id: '1',
    type: 'multiple_choice',
    question: 'Choose the correct answer',
    options: ['A', 'B', 'C', 'D'],
    answer: 'A'
  } as any as Question;
  assert.strictEqual(validateQuestion(validMC, 0), null);

  // Invalid - missing option
  const invalidMCOpts = {
    ...validMC,
    options: ['A', 'B', '', 'D']
  } as any as Question;
  assert.match(validateQuestion(invalidMCOpts, 0) || '', /must have all 4 options filled out/);

  // Invalid - missing answer
  const invalidMCAns = {
    ...validMC,
    answer: ''
  } as any as Question;
  assert.match(validateQuestion(invalidMCAns, 0) || '', /must have a correct choice selected/);
});

test('WorksheetValidation - Fill in the Gap', () => {
  // Valid
  const validGap = {
    id: '1',
    type: 'fill_in_gap',
    question: 'Fill the gap',
    text: 'He [is] a student.'
  } as any as Question;
  assert.strictEqual(validateQuestion(validGap, 0), null);

  // Invalid - missing text
  const invalidGapText = {
    ...validGap,
    text: ''
  } as any as Question;
  assert.match(validateQuestion(invalidGapText, 0) || '', /text is required/);

  // Invalid - missing brackets
  const invalidGapBrackets = {
    ...validGap,
    text: 'He is a student.'
  } as any as Question;
  assert.match(validateQuestion(invalidGapBrackets, 0) || '', /must contain at least one gap in square brackets/);
});

test('WorksheetValidation - Sentence Unscramble', () => {
  // Valid
  const validUnscramble = {
    id: '1',
    type: 'sentence_unscramble',
    question: 'Unscramble this sentence',
    words: ['learning', 'is', 'fun']
  } as any as Question;
  assert.strictEqual(validateQuestion(validUnscramble, 0), null);

  // Invalid - too few words
  const invalidUnscrambleWords = {
    ...validUnscramble,
    words: ['learning']
  } as any as Question;
  assert.match(validateQuestion(invalidUnscrambleWords, 0) || '', /must contain at least 2 words/);
});

test('WorksheetValidation - Matching Pairs', () => {
  // Valid
  const validMatching = {
    id: '1',
    type: 'matching_pairs',
    question: 'Match the words',
    pairs: { 'hello': 'hi', 'bye': 'goodbye' }
  } as any as Question;
  assert.strictEqual(validateQuestion(validMatching, 0), null);

  // Invalid - empty pairs
  const invalidMatchingEmpty = {
    ...validMatching,
    pairs: {}
  } as any as Question;
  assert.match(validateQuestion(invalidMatchingEmpty, 0) || '', /must have at least one valid key-value pair/);

  // Invalid - empty value
  const invalidMatchingVal = {
    ...validMatching,
    pairs: { 'hello': '' }
  } as any as Question;
  assert.match(validateQuestion(invalidMatchingVal, 0) || '', /must have at least one valid key-value pair/);
});

test('WorksheetValidation - Drag & Drop', () => {
  // Valid
  const validDnD = {
    id: '1',
    type: 'drag_and_drop',
    question: 'Drag to fill',
    sentences: ['She [likes] apples.'],
    distractors: ['hates']
  } as any as Question;
  assert.strictEqual(validateQuestion(validDnD, 0), null);

  // Invalid - empty sentences
  const invalidDnDEmpty = {
    ...validDnD,
    sentences: []
  } as any as Question;
  assert.match(validateQuestion(invalidDnDEmpty, 0) || '', /must have sentences text entered/);

  // Invalid - no brackets
  const invalidDnDBrackets = {
    ...validDnD,
    sentences: ['She likes apples.']
  } as any as Question;
  assert.match(validateQuestion(invalidDnDBrackets, 0) || '', /must have at least one slot wrapped in brackets/);
});

test('WorksheetValidation - Category Sorting', () => {
  // Valid
  const validSorting = {
    id: '1',
    type: 'category_sorting',
    question: 'Sort the items',
    categories: ['Fruits', 'Vegetables'],
    items: [
      { text: 'Apple', category: 'Fruits' },
      { text: 'Carrot', category: 'Vegetables' }
    ]
  } as any as Question;
  assert.strictEqual(validateQuestion(validSorting, 0), null);

  // Invalid - too few categories
  const invalidSortingCats = {
    ...validSorting,
    categories: ['Fruits']
  } as any as Question;
  assert.match(validateQuestion(invalidSortingCats, 0) || '', /must have at least 2 categories defined/);

  // Invalid - missing items
  const invalidSortingItems = {
    ...validSorting,
    items: []
  } as any as Question;
  assert.match(validateQuestion(invalidSortingItems, 0) || '', /must contain valid items matched to sorting bins/);

  // Invalid - invalid item structure
  const invalidSortingItemStruct = {
    ...validSorting,
    items: [{ text: 'Apple', category: '' }]
  } as any as Question;
  assert.match(validateQuestion(invalidSortingItemStruct, 0) || '', /must contain valid items matched to sorting bins/);
});

test('WorksheetValidation - Correct the Mistake', () => {
  // Valid
  const validMistake = {
    id: '1',
    type: 'correct_the_mistake',
    question: 'Fix the typo',
    text: 'He go to school.',
    mistake: 'go',
    correction: 'goes'
  } as any as Question;
  assert.strictEqual(validateQuestion(validMistake, 0), null);

  // Valid - case insensitive / punctuation ignored
  const validMistakePunc = {
    id: '1',
    type: 'correct_the_mistake',
    question: 'Fix the typo',
    text: 'He go, to school.',
    mistake: 'Go',
    correction: 'goes'
  } as any as Question;
  assert.strictEqual(validateQuestion(validMistakePunc, 0), null);

  // Invalid - missing correction
  const invalidMistakeMissing = {
    ...validMistake,
    correction: ''
  } as any as Question;
  assert.match(validateQuestion(invalidMistakeMissing, 0) || '', /sentence, mistake, and correction words are all required/);

  // Invalid - mistake word not in sentence
  const invalidMistakeMismatch = {
    ...validMistake,
    mistake: 'went'
  } as any as Question;
  assert.match(validateQuestion(invalidMistakeMismatch, 0) || '', /must match one of the words in the sentence/);
});

test('WorksheetValidation - Choice Matrix', () => {
  // Valid
  const validMatrix = {
    id: '1',
    type: 'choice_matrix',
    question: 'Check the boxes',
    rows: ['Row 1', 'Row 2'],
    columns: ['Col 1', 'Col 2'],
    answers: { 'Row 1': 'Col 1', 'Row 2': 'Col 2' }
  } as any as Question;
  assert.strictEqual(validateQuestion(validMatrix, 0), null);

  // Invalid - missing rows/cols
  const invalidMatrixEmpty = {
    ...validMatrix,
    rows: []
  } as any as Question;
  assert.match(validateQuestion(invalidMatrixEmpty, 0) || '', /must have rows and columns tags defined/);

  // Invalid - missing answers
  const invalidMatrixAnswers = {
    ...validMatrix,
    answers: { 'Row 1': 'Col 1' }
  } as any as Question;
  assert.match(validateQuestion(invalidMatrixAnswers, 0) || '', /must have correct column selections selected for all rows/);
});

test('WorksheetValidation - Crossword', () => {
  // Valid
  const validCrossword = {
    id: '1',
    type: 'crossword',
    question: 'Solve the crossword',
    grid: [['a', 'p', 'p', 'l', 'e'], [' ', ' ', ' ', ' ', ' ']],
    clues: [{ row: 0, col: 0, text: 'A round fruit', direction: 'across' }]
  } as any as Question;
  assert.strictEqual(validateQuestion(validCrossword, 0), null);

  // Invalid - missing grid/clues
  const invalidCrosswordGrid = {
    ...validCrossword,
    grid: []
  } as any as Question;
  assert.match(validateQuestion(invalidCrosswordGrid, 0) || '', /crossword grid must be generated/);
});

test('WorksheetValidation - Word Search', () => {
  // Valid
  const validWordSearch = {
    id: '1',
    type: 'word_search',
    question: 'Find the words',
    grid: [['a', 'p', 'p', 'l', 'e'], ['x', 'y', 'z', 'w', 'q']]
  } as any as Question;
  assert.strictEqual(validateQuestion(validWordSearch, 0), null);

  // Invalid - missing grid
  const invalidWordSearchGrid = {
    ...validWordSearch,
    grid: []
  } as any as Question;
  assert.match(validateQuestion(invalidWordSearchGrid, 0) || '', /letter grid must be generated/);
});
