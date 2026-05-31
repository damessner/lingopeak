export interface Category {
  id: string;
  name: string;
  unit_title: string;
  unit_order: number;
}

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

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  
  // MCQ specific
  options?: string[];
  answer?: string;
  
  // Fill in Gap / Correct the Mistake specific
  text?: string;
  
  // Unscramble / Word Search specific
  words?: string[];
  
  // Matching Pairs specific
  pairs?: Record<string, string>;
  
  // Drag and Drop specific
  sentences?: string[];
  distractors?: string[];
  distractors_raw?: string; // temporary input string
  
  // Category Sorting specific
  categories?: string[];
  categories_raw?: string; // temporary input string
  items?: { text: string; category: string }[];
  
  // Correct the Mistake specific
  mistake?: string;
  correction?: string;
  
  // Choice Matrix specific
  rows?: string[];
  rows_raw?: string; // temporary input string
  columns?: string[];
  columns_raw?: string; // temporary input string
  answers?: Record<string, string>;
  
  // Crossword specific
  crossword_items?: { word: string; clue: string }[];
  grid?: string[][];
  clues?: any[];
  
  // Word Search specific
  word_search_words?: string; // temporary comma-separated list
}

export interface Worksheet {
  id?: string;
  title: string;
  category_id: string;
  tier: 'EXPLORER' | 'VOYAGER' | 'CHALLENGER' | 'SUMMIT';
  questions_json: string;
  badge_emoji?: string;
}
