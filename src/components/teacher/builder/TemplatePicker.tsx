'use client';

import { Question } from '@/lib/worksheet-types';

interface Template {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  badge: string;
  questions: any[];
}

const TEMPLATES: Template[] = [
  {
    id: 'verb_tenses',
    name: 'Verb Tenses Practice',
    desc: 'Pre-populated with Present Perfect and Past Simple grammar check questions.',
    emoji: '📝',
    badge: '🚀',
    questions: [
      {
        type: 'multiple_choice',
        question: 'Identify the sentence in the Present Perfect tense:',
        options: [
          'She walked to school yesterday.',
          'She has walked to school twice this week.',
          'She is walking to school now.',
          'She will walk to school tomorrow.'
        ],
        answer: 'She has walked to school twice this week.'
      },
      {
        type: 'fill_in_gap',
        question: 'Fill in the blanks with the past simple of the verbs in brackets:',
        text: 'Yesterday, I [went] (go) to the store and [bought] (buy) some milk.'
      },
      {
        type: 'correct_the_mistake',
        question: 'Correct the verb tense mistake in this sentence:',
        text: 'I have saw that movie last night.',
        mistake: 'saw',
        correction: 'seen'
      }
    ]
  },
  {
    id: 'vocabulary_synonyms',
    name: 'Vocabulary & Synonyms',
    desc: 'Includes matching pairs, choice matrix, and word search puzzle for vocabulary study.',
    emoji: '🔗',
    badge: '🧠',
    questions: [
      {
        type: 'matching_pairs',
        question: 'Match the synonyms together:',
        pairs: {
          'Happy': 'Joyful',
          'Huge': 'Gigantic',
          'Angry': 'Furious',
          'Smart': 'Intelligent'
        }
      },
      {
        type: 'choice_matrix',
        question: 'Classify the following adjectives as Positive or Negative:',
        rows: ['Awesome', 'Dreadful', 'Delightful', 'Obnoxious'],
        rows_raw: 'Awesome, Dreadful, Delightful, Obnoxious',
        columns: ['Positive', 'Negative'],
        columns_raw: 'Positive, Negative',
        answers: {
          'Awesome': 'Positive',
          'Dreadful': 'Negative',
          'Delightful': 'Positive',
          'Obnoxious': 'Negative'
        }
      },
      {
        type: 'word_search',
        question: 'Find these 4 vocabulary words in the grid:',
        word_search_words: 'HAPPY, LARGE, SMART, ANGRY',
        words: ['HAPPY', 'LARGE', 'SMART', 'ANGRY'],
        grid: [
          ['H', 'A', 'P', 'P', 'Y', 'L'],
          ['X', 'L', 'A', 'R', 'G', 'E'],
          ['S', 'M', 'A', 'R', 'T', 'O'],
          ['A', 'N', 'G', 'R', 'Y', 'Z'],
          ['T', 'Y', 'U', 'I', 'O', 'P'],
          ['Q', 'W', 'E', 'R', 'T', 'Y']
        ]
      }
    ]
  },
  {
    id: 'sentence_building',
    name: 'Sentence Construction',
    desc: 'Unscramble sentences, drag-and-drop slots, and sorting verbs/nouns.',
    emoji: '🧩',
    badge: '🎨',
    questions: [
      {
        type: 'sentence_unscramble',
        question: 'Arrange the words to form a grammatically correct sentence:',
        words: ['The', 'dog', 'chased', 'the', 'cat', 'up', 'the', 'tree']
      },
      {
        type: 'drag_and_drop',
        question: 'Complete the sentences using appropriate articles:',
        sentences: [
          'I saw [a] bird in the sky.',
          'She ate [an] apple for lunch.',
          'This is [the] best day of my life.'
        ],
        distractors: ['some', 'any'],
        distractors_raw: 'some, any'
      },
      {
        type: 'category_sorting',
        question: 'Sort the words into Nouns or Verbs:',
        categories: ['Noun', 'Verb'],
        categories_raw: 'Noun, Verb',
        items: [
          { text: 'Elephant', category: 'Noun' },
          { text: 'Run', category: 'Verb' },
          { text: 'Computer', category: 'Noun' },
          { text: 'Whisper', category: 'Verb' }
        ]
      }
    ]
  },
  {
    id: 'vocabulary_gap_fill',
    name: 'Vocabulary Gap Fill',
    desc: 'Vacation and travel context with Drag & Drop sentence pools and gaps.',
    emoji: '✈️',
    badge: '🏆',
    questions: [
      {
        type: 'drag_and_drop',
        question: 'Drag the correct travel vocabulary word into each sentence gap:',
        sentences: [
          'Don\'t forget to pack your [passport] before going to the airport.',
          'We stayed at a luxury [hotel] next to the beach.',
          'The flight was delayed, so we waited in the airport [lounge].'
        ],
        distractors: ['car', 'road', 'ticket'],
        distractors_raw: 'car, road, ticket'
      },
      {
        type: 'fill_in_gap',
        question: 'Type in the correct transportation words:',
        text: 'The fastest way to travel across oceans is by [airplane], but some people prefer taking a cruise [ship].'
      }
    ]
  },
  {
    id: 'grammar_correction_drill',
    name: 'Grammar Correction Drill',
    desc: 'Focuses on finding spelling and past participle errors in written paragraphs.',
    emoji: '✏️',
    badge: '👑',
    questions: [
      {
        type: 'correct_the_mistake',
        question: 'Correct the spelling mistake in this sentence:',
        text: 'I recieved a letter from my teacher yesterday.',
        mistake: 'recieved',
        correction: 'received'
      },
      {
        type: 'correct_the_mistake',
        question: 'Correct the past participle error:',
        text: 'He has write three books about history.',
        mistake: 'write',
        correction: 'written'
      },
      {
        type: 'multiple_choice',
        question: 'Which of the following is correct?',
        options: [
          'They was going to the theater.',
          'They were going to the theater.',
          'They is going to the theater.',
          'They am going to the theater.'
        ],
        answer: 'They were going to the theater.'
      }
    ]
  },
  {
    id: 'idioms_crossword',
    name: 'Idioms Crossword Puzzle',
    desc: 'Classic crossword layout pre-designed with idiom definitions.',
    emoji: '🧠',
    badge: '🦉',
    questions: [
      {
        type: 'crossword',
        question: 'Solve the crossword containing common English idioms:',
        crossword_items: [
          { word: 'PIECE', clue: 'Something very easy: A ___ of cake' },
          { word: 'RAIN', clue: 'Postpone something: Take a ___ check' },
          { word: 'BREAK', clue: 'Wish good luck to a performer: ___ a leg' }
        ],
        grid: [
          ['P', 'I', 'E', 'C', 'E'],
          ['R', '.', '.', '.', '.'],
          ['A', '.', 'B', '.', '.'],
          ['I', '.', 'R', '.', '.'],
          ['N', '.', 'E', 'A', 'K']
        ],
        clues: [
          { number: 1, direction: 'across', row: 0, col: 0, text: 'Something very easy: A ___ of cake' },
          { number: 1, direction: 'down', row: 0, col: 0, text: 'Postpone something: Take a ___ check' },
          { number: 2, direction: 'down', row: 2, col: 2, text: 'Wish good luck to a performer: ___ a leg (vertical portion)' }
        ]
      }
    ]
  },
  {
    id: 'category_sorting_parts_of_speech',
    name: 'Parts of Speech Classifier',
    desc: 'Sorting bin widget separating adjectives, adverbs, and verbs.',
    emoji: '🏷️',
    badge: '🎯',
    questions: [
      {
        type: 'category_sorting',
        question: 'Sort these grammatical words into their correct parts of speech:',
        categories: ['Verb', 'Adjective', 'Adverb'],
        categories_raw: 'Verb, Adjective, Adverb',
        items: [
          { text: 'quickly', category: 'Adverb' },
          { text: 'beautiful', category: 'Adjective' },
          { text: 'shout', category: 'Verb' },
          { text: 'silently', category: 'Adverb' },
          { text: 'enormous', category: 'Adjective' },
          { text: 'explore', category: 'Verb' }
        ]
      }
    ]
  },
  {
    id: 'subject_verb_agreement',
    name: 'Subject-Verb Agreement',
    desc: 'Helps students practice matching plural/singular subjects to verb modifications.',
    emoji: '⚖️',
    badge: '🎓',
    questions: [
      {
        type: 'fill_in_gap',
        question: 'Provide the correct form of the verb "to be" or "to have":',
        text: 'Every student in the classroom [has] (have) a notebook. None of them [is] (be) absent.'
      },
      {
        type: 'multiple_choice',
        question: 'Choose the correct verb to agree with the subject:',
        options: [
          'The cats runs outside.',
          'The cat runs outside.',
          'The cat run outside.',
          'The cats is running outside.'
        ],
        answer: 'The cat runs outside.'
      }
    ]
  }
];

interface TemplatePickerProps {
  onSelect: (questions: Question[], badgeEmoji: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplatePicker({ onSelect, isOpen, onClose }: TemplatePickerProps) {
  if (!isOpen) return null;

  const handleSelectTemplate = (template: Template) => {
    const questionsWithIds: Question[] = template.questions.map((q, idx) => ({
      ...q,
      id: `q_tmpl_${Date.now()}_${idx}`
    })) as Question[];
    onSelect(questionsWithIds, template.badge);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl animate-scaleUp">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Select Worksheet Template</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs font-bold"
          >
            ✕ Close
          </button>
        </div>

        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => handleSelectTemplate(tmpl)}
              className="w-full flex gap-4 text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all cursor-pointer group"
            >
              <span className="text-3xl p-3 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform select-none">{tmpl.emoji}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white uppercase tracking-tight">{tmpl.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{tmpl.desc}</p>
                <div className="flex justify-between items-center mt-2.5">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">
                    Contains {tmpl.questions.length} exercises
                  </span>
                  <span className="text-xs" title="Rewards Badge">{tmpl.badge}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
