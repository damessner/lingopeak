export type QuestionType =
  | 'multiple_choice'
  | 'fill_in_gap'
  | 'sentence_unscramble'
  | 'matching_pairs'
  | 'drag_and_drop'
  | 'category_sorting'
  | 'correct_the_mistake'
  | 'choice_matrix'
  | 'crossword'
  | 'word_search';

export interface BaseQuestion {
  id: string;
  type: QuestionType;
  question: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: string[];
  answer: string;
}

export interface FillInGapQuestion extends BaseQuestion {
  type: 'fill_in_gap';
  text: string;
}

export interface SentenceUnscrambleQuestion extends BaseQuestion {
  type: 'sentence_unscramble';
  words: string[];
}

export interface MatchingPairsQuestion extends BaseQuestion {
  type: 'matching_pairs';
  pairs: Record<string, string>;
}

export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop';
  sentences: string[];
  distractors: string[];
  distractors_raw?: string;
  words?: string[];
}

export interface CategorySortingQuestion extends BaseQuestion {
  type: 'category_sorting';
  categories: string[];
  categories_raw?: string;
  items: { text: string; category: string }[];
}

export interface CorrectTheMistakeQuestion extends BaseQuestion {
  type: 'correct_the_mistake';
  text: string;
  mistake: string;
  correction: string;
}

export interface ChoiceMatrixQuestion extends BaseQuestion {
  type: 'choice_matrix';
  rows: string[];
  rows_raw?: string;
  columns: string[];
  columns_raw?: string;
  answers: Record<string, string>;
}

export interface CrosswordQuestion extends BaseQuestion {
  type: 'crossword';
  crossword_items: { word: string; clue: string }[];
  grid: string[][];
  clues: any[];
}

export interface WordSearchQuestion extends BaseQuestion {
  type: 'word_search';
  words: string[];
  word_search_words?: string;
  grid: string[][];
}

export type Question =
  | MultipleChoiceQuestion
  | FillInGapQuestion
  | SentenceUnscrambleQuestion
  | MatchingPairsQuestion
  | DragAndDropQuestion
  | CategorySortingQuestion
  | CorrectTheMistakeQuestion
  | ChoiceMatrixQuestion
  | CrosswordQuestion
  | WordSearchQuestion;

export interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

export interface Worksheet {
  id?: string;
  title: string;
  category_id: string;
  tier: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT';
  questions_json: string;
  badge_emoji?: string;
}
