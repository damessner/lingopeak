import type { Question } from '../../../lib/worksheet-types.ts';

/**
 * Validates a single question component details.
 * Returns a string error message if invalid, or null if valid.
 */
export function validateQuestion(q: Question, index: number): string | null {
  const label = `Question ${index + 1}`;

  if (!q.question.trim()) {
    return `${label} instructions/prompt is required.`;
  }

  switch (q.type) {
    case 'multiple_choice':
      if (!q.options || q.options.some(opt => !opt.trim())) {
        return `${label} (Multiple Choice) must have all options filled out.`;
      }
      if (q.isMulti) {
        if (!q.answers || q.answers.length === 0) {
          return `${label} (Multiple Choice) must have at least one correct choice selected.`;
        }
      } else {
        if (!q.answer && (!q.answers || q.answers.length === 0)) {
          return `${label} (Multiple Choice) must have a correct choice selected.`;
        }
      }
      break;

    case 'fill_in_gap':
      if (!q.text?.trim()) {
        return `${label} (Fill in the Gap) text is required.`;
      }
      {
        const hasBrackets = q.text.includes('[') && q.text.includes(']');
        const hasHashes = (q.text.match(/#/g) || []).length >= 2;
        if (!hasBrackets && !hasHashes) {
          return `${label} (Fill in the Gap) must contain at least one gap wrapped in # (e.g. #drives#) or square brackets.`;
        }
      }
      break;

    case 'sentence_unscramble':
      if (!q.words || q.words.length < 2) {
        return `${label} (Sentence Unscramble) sentence must contain at least 2 words.`;
      }
      break;

    case 'matching_pairs':
      if (!q.pairs || Object.keys(q.pairs).length === 0 || Object.keys(q.pairs).some(k => !k.trim() || !q.pairs![k].trim())) {
        return `${label} (Matching Pairs) must have at least one valid key-value pair.`;
      }
      break;

    case 'drag_and_drop':
      if (!q.sentences || q.sentences.length === 0 || q.sentences.some(s => !s.trim())) {
        return `${label} (Drag & Drop) must have sentences text entered.`;
      }
      if (q.sentences.every(s => {
        const b = s.includes('[') && s.includes(']');
        const h = (s.match(/#/g) || []).length >= 2;
        return !b && !h;
      })) {
        return `${label} (Drag & Drop) must have at least one slot wrapped in # (e.g. #green#) or brackets.`;
      }
      break;

    case 'category_sorting':
      if (!q.categories || q.categories.length < 2) {
        return `${label} (Category Sorting) must have at least 2 categories defined.`;
      }
      if (!q.items || q.items.length === 0 || q.items.some(it => !it.text.trim() || !it.category.trim())) {
        return `${label} (Category Sorting) must contain valid items matched to sorting categories.`;
      }
      break;

    case 'correct_the_mistake': {
      if (!q.text?.trim() || !q.mistake?.trim() || !q.correction?.trim()) {
        return `${label} (Correct the Mistake) must contain an inline mistake e.g., 'incorrect#correct' (e.g. He do#does his homework).`;
      }
      break;
    }

    case 'choice_matrix':
      if (!q.rows || q.rows.length === 0 || !q.columns || q.columns.length === 0) {
        return `${label} (Choice Matrix) must have rows and columns defined (using statement##column entries).`;
      }
      {
        const mappedRows = Object.keys(q.answers || {});
        if (mappedRows.length !== q.rows.length || mappedRows.some(r => !q.answers![r])) {
          return `${label} (Choice Matrix) must map a correct column for all rows.`;
        }
      }
      break;

    case 'crossword':
      if (!q.grid || q.grid.length <= 1 || !q.clues || q.clues.length === 0) {
        return `${label} (Crossword) crossword grid must be generated. Click "Auto-Generate Crossword Layout".`;
      }
      break;

    case 'word_search':
      if (!q.grid || q.grid.length <= 1) {
        return `${label} (Word Search) letter grid must be generated. Click "Auto-Generate Word Search".`;
      }
      break;

    case 'order_sentences':
      if (!q.sentences || q.sentences.length < 2 || q.sentences.some(s => !s.trim())) {
        return `${label} (Sentence Ordering) must have at least 2 sentences to order.`;
      }
      break;

    default:
      return null;
  }

  return null;
}
