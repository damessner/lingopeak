import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const DB_PATH = path.resolve(process.cwd(), 'dev.db');
const SCHEMA_PATH = path.resolve(process.cwd(), 'src/lib/schema.sql');

// Establish synchronous SQLite connection
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Password hashing utility
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

// Legacy verification hash fallback (1,000 iterations, hardcoded salt)
export function hashPasswordLegacy(password: string): string {
  return crypto.pbkdf2Sync(password, 'lingopeak_salt_secret', 1000, 64, 'sha512').toString('hex');
}

// Initialise DB tables and seed if empty
function initDb() {
  try {
    // 1. Read and run schema.sql
    if (fs.existsSync(SCHEMA_PATH)) {
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
      db.exec(schemaSql);
    } else {
      console.error(`Schema file not found at ${SCHEMA_PATH}`);
    }

    // 1.5 Inline DB Alteration / Migration Checks
    try {
      db.prepare('SELECT password_salt FROM users LIMIT 1').get();
    } catch (e) {
      console.log('Migrating: Adding password_salt column to users table...');
      db.exec('ALTER TABLE users ADD COLUMN password_salt TEXT');
    }

    try {
      db.prepare('SELECT word FROM dictionary_cache LIMIT 1').get();
    } catch (e) {
      console.log('Migrating: Creating dictionary_cache table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS dictionary_cache (
          word TEXT PRIMARY KEY,
          definition_json TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    }

    // 1.6 Legacy Account Invalidation Migration
    try {
      const legacyCountResult = db.prepare("SELECT count(*) as count FROM users WHERE password_salt IS NULL OR password_salt = ''").get() as any;
      const legacyCount = legacyCountResult?.count || 0;
      if (legacyCount > 0) {
        console.log(`Migrating: Securing and forcing reset for ${legacyCount} legacy accounts...`);
        db.prepare(`
          UPDATE users 
          SET password_hash = 'RESET_REQUIRED_' || password_hash, 
              password_salt = 'RESET_REQUIRED' 
          WHERE password_salt IS NULL OR password_salt = ''
        `).run();
      }
    } catch (error) {
      console.error('Failed to run legacy account invalidation migration:', error);
    }

    // Skip seeding during production build static page prerendering to prevent worker collisions
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }

    // 2. Check if seeding is required (e.g., check if the admin user exists)
    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

    if (!adminUser) {
      console.log('Database empty or missing admin. Running seed operation...');
      runSeed();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

function runSeed() {
  db.transaction(() => {
    // 1. Seed Classes
    const classId1 = crypto.randomUUID();
    const classId2 = crypto.randomUUID();
    const classId3 = crypto.randomUUID();

    db.prepare('INSERT OR IGNORE INTO classes (id, name) VALUES (?, ?)')
      .run(classId1, '1G');
    db.prepare('INSERT OR IGNORE INTO classes (id, name) VALUES (?, ?)')
      .run(classId2, '2G');
    db.prepare('INSERT OR IGNORE INTO classes (id, name) VALUES (?, ?)')
      .run(classId3, '3G');

    // 2. Seed Users (Admin & Teacher)
    const adminId = crypto.randomUUID();
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const adminHash = hashPassword('password123', adminSalt);
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, role, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?)')
      .run(adminId, 'admin', adminHash, adminSalt, 'ADMIN', '👑');

    const teacherId = crypto.randomUUID();
    const teacherSalt = crypto.randomBytes(16).toString('hex');
    const teacherHash = hashPassword('teacher123', teacherSalt);
    db.prepare('INSERT OR IGNORE INTO users (id, username, password_hash, password_salt, role, avatar_emoji) VALUES (?, ?, ?, ?, ?, ?)')
      .run(teacherId, 'teacher', teacherHash, teacherSalt, 'TEACHER', '🦉');

    // 3. Seed Units
    const unitId1 = crypto.randomUUID();
    db.prepare('INSERT OR IGNORE INTO units (id, title, order_num) VALUES (?, ?, ?)')
      .run(unitId1, 'All About Me', 1);

    const unitId2 = crypto.randomUUID();
    db.prepare('INSERT OR IGNORE INTO units (id, title, order_num) VALUES (?, ?, ?)')
      .run(unitId2, 'Around the World', 2);

    // 4. Seed Categories under Unit 1
    const categories = ['GRAMMAR', 'VOCABULARY', 'READING', 'WRITING', 'LISTENING'];
    const categoryIds: Record<string, string> = {};

    for (const catName of categories) {
      const catId = crypto.randomUUID();
      db.prepare('INSERT INTO categories (id, name, unit_id) VALUES (?, ?, ?)')
        .run(catId, catName, unitId1);
      categoryIds[catName] = catId;
    }

    // Grammar for Unit 2
    const u2GrammarId = crypto.randomUUID();
    db.prepare('INSERT INTO categories (id, name, unit_id) VALUES (?, ?, ?)')
      .run(u2GrammarId, 'GRAMMAR', unitId2);

    // 5. Seed Worksheets under Unit 1 Grammar
    const grammarCatId = categoryIds['GRAMMAR'];

    // Explorer (Easy)
    const explorerQuestions = [
      {
        id: 'mc1',
        type: 'multiple_choice',
        question: 'Choose the correct form: She _____ tennis every Saturday.',
        options: ['play', 'plays', 'playing', 'is play'],
        answer: 'plays'
      },
      {
        id: 'gap1',
        type: 'fill_in_gap',
        question: 'Complete the sentence with the correct form of "be":',
        text: 'They [are] student volunteers.',
        answer: 'are'
      },
      {
        id: 'drag1',
        type: 'drag_and_drop',
        question: 'Drag the correct words to complete the sentences.',
        sentences: [
          'He is [driving] a blue car.',
          'We [have] two pet dogs.'
        ],
        words: ['driving', 'have', 'run', 'like']
      }
    ];

    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(
        crypto.randomUUID(),
        grammarCatId,
        'Present Simple Basics',
        'EXPLORER',
        JSON.stringify(explorerQuestions)
      );

    // Voyager (Medium)
    const voyagerQuestions = [
      {
        id: 'sort1',
        type: 'category_sorting',
        question: 'Sort the verbs into Present Simple or Present Continuous.',
        categories: ['Present Simple', 'Present Continuous'],
        items: [
          { text: 'always walks', category: 'Present Simple' },
          { text: 'is writing', category: 'Present Continuous' },
          { text: 'usually cooks', category: 'Present Simple' },
          { text: 'are playing', category: 'Present Continuous' }
        ]
      },
      {
        id: 'mistake1',
        type: 'correct_the_mistake',
        question: 'Find and correct the mistake in the sentence.',
        text: 'She do not like milk.',
        mistake: 'do',
        correction: 'does'
      }
    ];

    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(
        crypto.randomUUID(),
        grammarCatId,
        'Simple vs. Continuous',
        'VOYAGER',
        JSON.stringify(voyagerQuestions)
      );

    // Challenger (Hard)
    const challengerQuestions = [
      {
        id: 'matrix1',
        type: 'choice_matrix',
        question: 'Classify whether the verb is Stative or Dynamic.',
        rows: ['believe', 'run', 'know', 'dance'],
        columns: ['Stative Verb', 'Dynamic Verb'],
        answers: {
          'believe': 'Stative Verb',
          'run': 'Dynamic Verb',
          'know': 'Stative Verb',
          'dance': 'Dynamic Verb'
        }
      },
      {
        id: 'cross1',
        type: 'crossword',
        question: 'Solve this mini-grammar crossword.',
        grid: [
          ['S', 'P', 'E', 'A', 'K'],
          ['.', 'L', '.', '.', '.'],
          ['.', 'A', 'M', '.', '.'],
          ['.', 'Y', '.', '.', '.'],
          ['.', '.', '.', '.', '.']
        ],
        clues: [
          { number: 1, direction: 'across', text: 'Present tense of spoke.', row: 0, col: 0, length: 5 },
          { number: 2, direction: 'down', text: 'To perform a game or instrument.', row: 0, col: 1, length: 4 },
          { number: 3, direction: 'across', text: 'First-person singular of be.', row: 2, col: 2, length: 2 }
        ]
      }
    ];

    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(
        crypto.randomUUID(),
        grammarCatId,
        'Stative Verbs & Advanced Tenses',
        'CHALLENGER',
        JSON.stringify(challengerQuestions)
      );

    // 6. Seed Book Club (Books & Chapters)
    const bookId = crypto.randomUUID();
    db.prepare('INSERT INTO books (id, title, description) VALUES (?, ?, ?)')
      .run(
        bookId,
        'The Lost Key',
        'An exciting mystery story for English learners. Follow Liam as he searches for a hidden treasure.'
      );

    const chapter1Questions = [
      {
        id: 'book1_q1',
        type: 'multiple_choice',
        question: 'Where did Liam find the old map?',
        options: ['In the kitchen', 'In the attic', 'In the woods', 'At school'],
        answer: 'In the attic'
      }
    ];

    const ch1Id = crypto.randomUUID();
    db.prepare('INSERT INTO worksheets (id, title, tier, questions_json) VALUES (?, ?, ?, ?)')
      .run(ch1Id, 'The Strange Old Map - Check', 'BOOK_CLUB', JSON.stringify(chapter1Questions));

    db.prepare('INSERT INTO chapters (id, book_id, title, content, difficulty_order, questions_json) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        ch1Id,
        bookId,
        'The Strange Old Map',
        'Yesterday, Liam found an old map in the attic. The map was yellow and dusty. It showed a path through the dark woods near his house. In the corner of the map, there was a drawing of a small iron key. Liam felt very excited. He decided to go into the woods to search for the mystery.',
        1,
        JSON.stringify(chapter1Questions)
      );

    const chapter2Questions = [
      {
        id: 'book1_q2',
        type: 'fill_in_gap',
        question: 'Complete the sentence:',
        text: 'The lock of the wooden box was very [rusty].',
        answer: 'rusty'
      }
    ];

    const ch2Id = crypto.randomUUID();
    db.prepare('INSERT INTO worksheets (id, title, tier, questions_json) VALUES (?, ?, ?, ?)')
      .run(ch2Id, 'Deep in the Woods - Check', 'BOOK_CLUB', JSON.stringify(chapter2Questions));

    db.prepare('INSERT INTO chapters (id, book_id, title, content, difficulty_order, questions_json) VALUES (?, ?, ?, ?, ?, ?)')
      .run(
        ch2Id,
        bookId,
        'Deep in the Woods',
        'Liam walked silently between the tall trees. The air was cool and smelled of wet leaves. After walking for two hours, he saw a giant oak tree. Behind the oak tree, hidden under some branches, was an old wooden box. The box had a lock, and the lock looked very rusty. Liam took a deep breath.',
        2,
        JSON.stringify(chapter2Questions)
      );

    // 7. Seed Writing Prompts
    const promptId = crypto.randomUUID();
    const rubrics = [
      { name: 'Grammar', criteria: 'Use correct past tense verb forms.' },
      { name: 'Vocabulary', criteria: 'Include at least 3 descriptive adjectives.' },
      { name: 'Coherence', criteria: 'Structure your story with a clear beginning, middle, and end.' }
    ];
    db.prepare('INSERT INTO writing_prompts (id, title, description, rubrics_json) VALUES (?, ?, ?, ?)')
      .run(
        promptId,
        'My Summer Adventure',
        'Write about an exciting day you had during the summer. Focus on what you did, who you were with, and how you felt.',
        JSON.stringify(rubrics)
      );

    console.log('LingoPeak database seeding completed.');
  })();
}

// Initialise DB
initDb();

export default db;
