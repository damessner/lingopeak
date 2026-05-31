'use client';

import { Question } from '@/lib/worksheet-types';

interface Template {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  badge: string;
  questions: Omit<Question, 'id'>[];
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

        <div className="space-y-4 max-h-[350px] overflow-y-auto">
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className="w-full flex gap-4 text-left p-3.5 bg-slate-950/40 hover:bg-slate-950 border border-slate-850 hover:border-slate-800 rounded-2xl transition-all cursor-pointer group"
            >
              <span className="text-3xl p-3 bg-slate-900 rounded-xl group-hover:scale-110 transition-transform select-none">{tmpl.emoji}</span>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-tight">{tmpl.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">{tmpl.desc}</p>
                <span className="inline-block text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-2">
                  Contains {tmpl.questions.length} exercises
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
