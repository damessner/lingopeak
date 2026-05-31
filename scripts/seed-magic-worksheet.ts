import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'dev.db');
const db = new Database(DB_PATH);

const categoryId = '4e01cdc5-9e47-4526-b255-9e504b1fbaf8'; // Unit 1 GRAMMAR ("Time for school")
const title = 'Classroom Adventure: Imperatives & Plural Magic';
const tier = 'VOYAGER';
const badgeEmoji = '🧪';

const questions = [
  {
    "id": "magic_q1",
    "type": "multiple_choice",
    "question": "Choose the correct instruction: When the teacher walks in, she says: 'Please ________ your English book and ________ to page 12.'",
    "options": [
      "open / look",
      "close / look",
      "spell / listen",
      "write / read"
    ],
    "answer": "open / look"
  },
  {
    "id": "magic_q2",
    "type": "fill_in_gap",
    "question": "Plural Nouns: Complete the plural forms based on the singular forms.",
    "text": "In my school bag, I have one pencil, but on my desk there are three [pencils]. I see one child in the hallway, but in the classroom there are twenty [children]."
  },
  {
    "id": "magic_q3",
    "type": "correct_the_mistake",
    "question": "Imperatives: Click on the wrong verb form in the instruction and type the correct command.",
    "text": "Opens your notebook and write your name.",
    "mistake": "Opens",
    "correction": "Open"
  },
  {
    "id": "magic_q4",
    "type": "sentence_unscramble",
    "question": "Word Order: Unscramble this classroom instruction.",
    "words": ["Please", "write", "your", "name", "on", "the", "board", "."]
  },
  {
    "id": "magic_q5",
    "type": "matching_pairs",
    "question": "Irregular Plurals: Match the singular noun with its correct irregular plural partner.",
    "pairs": {
      "child": "children",
      "mouse": "mice",
      "man": "men",
      "foot": "feet",
      "tooth": "teeth"
    }
  },
  {
    "id": "magic_q6",
    "type": "choice_matrix",
    "question": "Grammar Triage: Identify if these sentences are imperatives (instructions) or statements.",
    "rows": [
      "Close your schoolbag.##Imperative",
      "I like my green pencil.##Statement",
      "Listen to the song.##Imperative",
      "He has ten books.##Statement"
    ],
    "columns": ["Imperative", "Statement"],
    "answers": {
      "Close your schoolbag.": "Imperative",
      "I like my green pencil.": "Statement",
      "Listen to the song.": "Imperative",
      "He has ten books.": "Statement"
    }
  },
  {
    "id": "magic_q7",
    "type": "drag_and_drop",
    "question": "Teacher Instructions: Drag the correct action verbs to complete the rules.",
    "sentences": [
      "Please #take# out your blue pen and write.",
      "Do not #talk# during the test.",
      "Please #listen# to the audio track now."
    ],
    "distractors": ["takes", "talking", "listening", "ruler"]
  },
  {
    "id": "magic_q8",
    "type": "category_sorting",
    "question": "Vocabulary Sort: Sort these school items into the correct category.",
    "categories": ["School Things (in bag)", "Classroom Objects (in room)"],
    "items": [
      {"text": "pencil", "category": "School Things (in bag)"},
      {"text": "board", "category": "Classroom Objects (in room)"},
      {"text": "desk", "category": "Classroom Objects (in room)"},
      {"text": "rubber", "category": "School Things (in bag)"},
      {"text": "door", "category": "Classroom Objects (in room)"},
      {"text": "sharpener", "category": "School Things (in bag)"}
    ]
  },
  {
    "id": "magic_q9",
    "type": "order_sentences",
    "question": "School Tasks: Put the spelling routine steps in the correct order.",
    "sentences": [
      "First, the teacher says a new word like 'children'.",
      "Second, listen carefully to the sounds of the word.",
      "Third, write the word down in your notebook.",
      "Finally, check your spelling with your partner."
    ]
  },
  {
    "id": "magic_q10",
    "type": "multiple_choice",
    "question": "Spelling Numbers: Choose the correct spelling of the number that comes after twelve.",
    "options": ["thirteen", "thirtean", "threeteen", "thirty"],
    "answer": "thirteen"
  },
  {
    "id": "magic_q11",
    "type": "fill_in_gap",
    "question": "Spelling Check: Fill in the correct letters to complete the names of these items.",
    "text": "We write on the [board], we sit at our [desk], and we measure with a [ruler]."
  },
  {
    "id": "magic_q12",
    "type": "correct_the_mistake",
    "question": "Plural Spelling: Find the plural spelling mistake and correct it.",
    "text": "There are three boxs on the table.",
    "mistake": "boxs",
    "correction": "boxes"
  },
  {
    "id": "magic_q13",
    "type": "sentence_unscramble",
    "question": "Instruction: Unscramble the command about opening a page.",
    "words": ["Open", "your", "books", "to", "page", "twenty", "."]
  },
  {
    "id": "magic_q14",
    "type": "choice_matrix",
    "question": "Plurals Validation: Decide if these plural nouns are spelled correctly or incorrectly.",
    "rows": [
      "pencils##correct",
      "childs##incorrect",
      "mice##correct",
      "windowes##incorrect"
    ],
    "columns": ["correct", "incorrect"],
    "answers": {
      "pencils": "correct",
      "childs": "incorrect",
      "mice": "correct",
      "windowes": "incorrect"
    }
  },
  {
    "id": "magic_q15",
    "type": "matching_pairs",
    "question": "Numbers Matching: Match the digit to its correct written English word form.",
    "pairs": {
      "8": "eight",
      "15": "fifteen",
      "20": "twenty",
      "22": "twenty-two",
      "11": "eleven"
    }
  }
];

const newWorksheetId = crypto.randomUUID();

try {
  // 1. Delete incorrect worksheet
  db.prepare("DELETE FROM worksheets WHERE title = 'Secret Life of School: Simple vs Continuous'").run();
  console.log('Removed incorrect worksheet from database.');

  // 2. Insert new aligned worksheet
  const insert = db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, badge_emoji) VALUES (?, ?, ?, ?, ?, ?)');
  insert.run(newWorksheetId, categoryId, title, tier, JSON.stringify(questions), badgeEmoji);
  console.log(`Successfully seeded magic worksheet "${title}" in Unit 1 Grammar VOYAGER! ID: ${newWorksheetId}`);
} catch (e) {
  console.error("Failed to seed worksheet:", e);
}
