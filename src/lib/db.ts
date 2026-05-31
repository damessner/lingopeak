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
      try {
        db.exec('ALTER TABLE users ADD COLUMN password_salt TEXT');
      } catch (err: any) {
        if (!err.message.includes('duplicate column name')) throw err;
      }
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

    try {
      db.prepare('SELECT id FROM tutor_messages LIMIT 1').get();
    } catch (e) {
      console.log('Migrating: Creating tutor_messages table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS tutor_messages (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_tutor_messages_student ON tutor_messages(student_id);
      `);
    }

    try {
      db.prepare('SELECT id FROM notifications LIMIT 1').get();
    } catch (e) {
      console.log('Migrating: Creating notifications table...');
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      `);
    }

    try {
      db.prepare('SELECT badge_emoji FROM worksheets LIMIT 1').get();
    } catch (e) {
      console.log('Migrating: Adding badge_emoji column to worksheets table...');
      try {
        db.exec("ALTER TABLE worksheets ADD COLUMN badge_emoji TEXT DEFAULT '🥇'");
      } catch (err: any) {
        if (!err.message.includes('duplicate column name')) throw err;
      }
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

    // 1.7 Re-seed built-in accounts if they got caught in the RESET_REQUIRED migration
    try {
      const stuckAdmin = db.prepare("SELECT id, role, password_salt FROM users WHERE username = ? AND password_salt = 'RESET_REQUIRED'").get('admin') as any;
      if (stuckAdmin) {
        console.log('Re-seeding admin account with fresh salted password...');
        const adminSalt = crypto.randomBytes(16).toString('hex');
        const adminHash = hashPassword('password123', adminSalt);
        db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE username = ?')
          .run(adminHash, adminSalt, 'admin');
      }

      const stuckTeacher = db.prepare("SELECT id, role, password_salt FROM users WHERE username = ? AND password_salt = 'RESET_REQUIRED'").get('teacher') as any;
      if (stuckTeacher) {
        console.log('Re-seeding teacher account with fresh salted password...');
        const teacherSalt = crypto.randomBytes(16).toString('hex');
        const teacherHash = hashPassword('teacher123', teacherSalt);
        db.prepare('UPDATE users SET password_hash = ?, password_salt = ? WHERE username = ?')
          .run(teacherHash, teacherSalt, 'teacher');
      }
    } catch (error) {
      console.error('Failed to re-seed built-in accounts:', error);
    }

    // 1.8 MORE! 1 Textbook Restructure
    try {
      const oldUnits = db.prepare("SELECT id FROM units WHERE title IN ('All About Me', 'Around the World')").all() as any[];
      if (oldUnits.length > 0) {
        console.log('Migrating: Restructuring to MORE! 1 textbook units...');
        db.transaction(() => {
          for (const unit of oldUnits) {
            db.prepare('DELETE FROM units WHERE id = ?').run(unit.id);
          }
          seedMORE1Units();
        })();
      } else {
        const count = db.prepare('SELECT COUNT(*) as count FROM units').get() as any;
        if (count.count === 0) {
          console.log('Seeding MORE! 1 textbook units...');
          seedMORE1Units();
        }
      }
    } catch (error) {
      console.error('Failed to run MORE! 1 unit migration:', error);
    }

    // 1.9 Refresh Grammar CHALLENGER exemplar (ensure 6-question version)
    try {
      const gramCat = db.prepare(`
        SELECT c.id FROM categories c
        JOIN units u ON c.unit_id = u.id
        WHERE u.title = 'Time for school' AND c.name = 'GRAMMAR'
      `).get() as any;

      if (gramCat) {
        const existing = db.prepare("SELECT id, questions_json FROM worksheets WHERE category_id = ? AND tier = 'CHALLENGER'").get(gramCat.id) as any;
        if (existing) {
          try {
            const oldQs = JSON.parse(existing.questions_json);
            if (!Array.isArray(oldQs) || oldQs.length < 6) {
              console.log('Migrating: Updating Grammar CHALLENGER to exemplar...');
              db.prepare('DELETE FROM worksheets WHERE id = ?').run(existing.id);
              db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
                .run(crypto.randomUUID(), gramCat.id, 'Grammar Climber', 'CHALLENGER', JSON.stringify([
                  {
                    id: 'g_c1', type: 'matching_pairs',
                    question: 'Match each singular noun to its irregular plural form.',
                    pairs: { 'child': 'children', 'mouse': 'mice', 'man': 'men', 'foot': 'feet', 'tooth': 'teeth' },
                  },
                  {
                    id: 'g_c2', type: 'fill_in_gap',
                    question: 'Complete these classroom instructions with the correct imperative verbs.',
                    text: '[Open] your book to page 10. [Close] the door quietly. [Write] your name on the paper. [Listen] to the teacher.',
                  },
                  {
                    id: 'g_c3', type: 'drag_and_drop',
                    question: 'Drag the correct words to complete the sentences about school.',
                    sentences: [
                      'There are [twenty] students in my class.',
                      'Please [spell] your name for the register.',
                      'The English alphabet has [twenty-six] letters.',
                      'We have English [class] every Monday.',
                    ],
                    words: ['twenty', 'spell', 'twenty-six', 'class', 'count', 'fifteen'],
                  },
                  {
                    id: 'g_c4', type: 'sentence_unscramble',
                    question: 'Unscramble the words to form a correct classroom instruction.',
                    words: ['Please', 'open', 'your', 'notebooks', '.'],
                  },
                  {
                    id: 'g_c5', type: 'correct_the_mistake',
                    question: 'Find and correct the grammar mistake in this sentence.',
                    text: 'There is five books on the teachers desk.',
                    mistake: 'is', correction: 'are',
                  },
                  {
                    id: 'g_c6', type: 'category_sorting',
                    question: 'Sort each statement as True or False.',
                    categories: ['True', 'False'],
                    items: [
                      { text: '"Children" is the plural of "child".', category: 'True' },
                      { text: '"Foots" is the plural of "foot".', category: 'False' },
                      { text: 'An imperative gives a command.', category: 'True' },
                      { text: '"Is" is used with plural subjects.', category: 'False' },
                    ],
                  },
                ]));
            }
          } catch (e) { /* parse error, will re-seed on next deploy */ }
        }
      }
    } catch (error) {
      console.error('Failed to refresh Grammar CHALLENGER exemplar:', error);
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

    // 3. Seed Book Club (Books & Chapters)
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

function seedMORE1Units() {
  db.transaction(() => {
    // ===================== 1. CREATE 15 UNITS =====================
    const unitDefs = [
      { title: 'Time for school', order: 1 },
      { title: 'At the zoo', order: 2 },
      { title: 'Pirates', order: 3 },
      { title: 'Emotions', order: 4 },
      { title: 'This is our band', order: 5 },
      { title: "The world's best detective", order: 6 },
      { title: 'I love noodles', order: 7 },
      { title: 'Clothes', order: 8 },
      { title: 'Shopping', order: 9 },
      { title: 'In a shop', order: 10 },
      { title: "What's the time?", order: 11 },
      { title: 'The birthday cake', order: 12 },
      { title: 'Help!', order: 13 },
      { title: "It's my favourite", order: 14 },
      { title: 'What are you going to do?', order: 15 },
    ];

    const unitIds: Record<string, string> = {};
    for (const u of unitDefs) {
      const id = crypto.randomUUID();
      db.prepare('INSERT OR IGNORE INTO units (id, title, order_num) VALUES (?, ?, ?)').run(id, u.title, u.order);
      unitIds[u.title] = id;
    }

    // ===================== 2. CREATE 5 CATEGORIES PER UNIT =====================
    const categoryNames = ['GRAMMAR', 'VOCABULARY', 'READING', 'WRITING', 'LISTENING'];
    const catIds: Record<string, string> = {};

    for (const u of unitDefs) {
      for (const cat of categoryNames) {
        const id = crypto.randomUUID();
        db.prepare('INSERT INTO categories (id, name, unit_id) VALUES (?, ?, ?)').run(id, cat, unitIds[u.title]);
        catIds[`${u.title}:${cat}`] = id;
      }
    }

    // ===================== 3. UNIT 1 WORKSHEETS =====================
    const u1 = 'Time for school';
    const gId = catIds[`${u1}:GRAMMAR`];
    const vId = catIds[`${u1}:VOCABULARY`];
    const rId = catIds[`${u1}:READING`];
    const wId = catIds[`${u1}:WRITING`];
    const lId = catIds[`${u1}:LISTENING`];

    // ----- GRAMMAR: Explorer -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), gId, 'Alphabet & Numbers', 'EXPLORER', JSON.stringify([
        {
          id: 'g_e1',
          type: 'matching_pairs',
          question: 'Match each capital letter to its lowercase partner.',
          pairs: { 'A': 'a', 'B': 'b', 'C': 'c', 'D': 'd', 'E': 'e' },
        },
        {
          id: 'g_e2',
          type: 'fill_in_gap',
          question: 'Write the plural forms.',
          text: 'One cat, two [cats]. One book, three [books]. One box, four [boxes].',
        },
        {
          id: 'g_e3',
          type: 'multiple_choice',
          question: 'What number comes after 12?',
          options: ['10', '11', '13', '14'],
          answer: '13',
        },
      ]));

    // ----- GRAMMAR: Voyager -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), gId, 'Plurals & Orders', 'VOYAGER', JSON.stringify([
        {
          id: 'g_v1',
          type: 'category_sorting',
          question: 'Sort these nouns into the correct plural category.',
          categories: ['Regular Plural (-s)', 'Irregular Plural'],
          items: [
            { text: 'cats', category: 'Regular Plural (-s)' },
            { text: 'mice', category: 'Irregular Plural' },
            { text: 'dogs', category: 'Regular Plural (-s)' },
            { text: 'children', category: 'Irregular Plural' },
            { text: 'books', category: 'Regular Plural (-s)' },
            { text: 'men', category: 'Irregular Plural' },
          ],
        },
        {
          id: 'g_v2',
          type: 'correct_the_mistake',
          question: 'Find and correct the mistake in this instruction.',
          text: 'Open you book to page five.',
          mistake: 'you',
          correction: 'your',
        },
        {
          id: 'g_v3',
          type: 'fill_in_gap',
          question: 'Complete the classroom instructions.',
          text: '[Open] your book. [Close] the door. [Listen] to the teacher.',
        },
      ]));

    // ----- GRAMMAR: Challenger (Exemplar — shows off 6 question types) -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), gId, 'Grammar Climber', 'CHALLENGER', JSON.stringify([
        {
          id: 'g_c1',
          type: 'matching_pairs',
          question: 'Match each singular noun to its irregular plural form.',
          pairs: {
            'child': 'children',
            'mouse': 'mice',
            'man': 'men',
            'foot': 'feet',
            'tooth': 'teeth',
          },
        },
        {
          id: 'g_c2',
          type: 'fill_in_gap',
          question: 'Complete these classroom instructions with the correct imperative verbs.',
          text: '[Open] your book to page 10. [Close] the door quietly. [Write] your name on the paper. [Listen] to the teacher.',
        },
        {
          id: 'g_c3',
          type: 'drag_and_drop',
          question: 'Drag the correct words to complete the sentences about school.',
          sentences: [
            'There are [twenty] students in my class.',
            'Please [spell] your name for the register.',
            'The English alphabet has [twenty-six] letters.',
            'We have English [class] every Monday.',
          ],
          words: ['twenty', 'spell', 'twenty-six', 'class', 'count', 'fifteen'],
        },
        {
          id: 'g_c4',
          type: 'sentence_unscramble',
          question: 'Unscramble the words to form a correct classroom instruction.',
          words: ['Please', 'open', 'your', 'notebooks', '.'],
        },
        {
          id: 'g_c5',
          type: 'correct_the_mistake',
          question: 'Find and correct the grammar mistake in this sentence.',
          text: 'There is five books on the teachers desk.',
          mistake: 'is',
          correction: 'are',
        },
        {
          id: 'g_c6',
          type: 'category_sorting',
          question: 'Sort each statement as True or False.',
          categories: ['True', 'False'],
          items: [
            { text: '\"Children\" is the plural of \"child\".', category: 'True' },
            { text: '\"Foots\" is the plural of \"foot\".', category: 'False' },
            { text: 'An imperative gives a command.', category: 'True' },
            { text: '\"Is\" is used with plural subjects.', category: 'False' },
          ],
        },
      ]));

    // ----- VOCABULARY: Explorer -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), vId, 'Colourful World', 'EXPLORER', JSON.stringify([
        {
          id: 'v_e1',
          type: 'multiple_choice',
          question: 'What colour is the sky on a sunny day?',
          options: ['red', 'blue', 'green', 'yellow'],
          answer: 'blue',
        },
        {
          id: 'v_e2',
          type: 'matching_pairs',
          question: 'Match each colour to its emoji.',
          pairs: { 'red': '🔴', 'blue': '🔵', 'green': '🟢', 'yellow': '🟡', 'black': '⚫' },
        },
        {
          id: 'v_e3',
          type: 'fill_in_gap',
          question: 'Complete the sentences with the correct colour.',
          text: 'Grass is [green]. The sun is [yellow]. Snow is [white].',
        },
      ]));

    // ----- VOCABULARY: Voyager -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), vId, 'My School Bag', 'VOYAGER', JSON.stringify([
        {
          id: 'v_v1',
          type: 'multiple_choice',
          question: 'I write with a _____.',
          options: ['ruler', 'pen', 'bag', 'sharpener'],
          answer: 'pen',
        },
        {
          id: 'v_v2',
          type: 'category_sorting',
          question: 'Sort each item into the correct group.',
          categories: ['School Things', 'Classroom Objects'],
          items: [
            { text: 'pencil', category: 'School Things' },
            { text: 'board', category: 'Classroom Objects' },
            { text: 'rubber', category: 'School Things' },
            { text: 'desk', category: 'Classroom Objects' },
            { text: 'book', category: 'School Things' },
            { text: 'clock', category: 'Classroom Objects' },
          ],
        },
        {
          id: 'v_v3',
          type: 'matching_pairs',
          question: 'Match each school thing to its use.',
          pairs: { 'pen': 'writing', 'ruler': 'measuring', 'rubber': 'erasing', 'sharpener': 'sharpening' },
        },
      ]));

    // ----- VOCABULARY: Challenger -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), vId, 'In the Classroom', 'CHALLENGER', JSON.stringify([
        {
          id: 'v_c1',
          type: 'correct_the_mistake',
          question: 'Find and correct the mistake.',
          text: 'I can see a boards on the wall.',
          mistake: 'boards',
          correction: 'board',
        },
        {
          id: 'v_c2',
          type: 'fill_in_gap',
          question: 'Describe your classroom.',
          text: 'In my classroom there is a [board]. There are twenty [desks]. The [clock] is on the wall.',
        },
        {
          id: 'v_c3',
          type: 'multiple_choice',
          question: 'Which of these is NOT a classroom object?',
          options: ['board', 'chair', 'pencil', 'tiger'],
          answer: 'tiger',
        },
      ]));

    // ----- READING: Explorer -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), rId, 'My Pet Dog', 'EXPLORER', JSON.stringify([
        {
          id: 'r_e1',
          type: 'multiple_choice',
          question: 'Read: "Tim has a pet dog. The dog is brown. Its name is Max. Tim and Max play in the park every day."\n\nWhat is the dog\'s name?',
          options: ['Tim', 'Max', 'Brown', 'Park'],
          answer: 'Max',
        },
        {
          id: 'r_e2',
          type: 'multiple_choice',
          question: 'What colour is Max?',
          options: ['black', 'white', 'brown', 'grey'],
          answer: 'brown',
        },
        {
          id: 'r_e3',
          type: 'fill_in_gap',
          question: 'Complete the sentence from the story.',
          text: 'Tim and Max play in the [park] every day.',
        },
      ]));

    // ----- READING: Voyager -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), rId, 'The Wide-Mouthed Frog', 'VOYAGER', JSON.stringify([
        {
          id: 'r_v1',
          type: 'sentence_unscramble',
          question: 'Unscramble the sentence from the story.',
          words: ['A', 'wide-mouthed', 'frog', 'lived', 'in', 'a', 'pond.'],
        },
        {
          id: 'r_v2',
          type: 'multiple_choice',
          question: 'What did the wide-mouthed frog like to eat?',
          options: ['fish', 'flies', 'plants', 'worms'],
          answer: 'flies',
        },
        {
          id: 'r_v3',
          type: 'fill_in_gap',
          question: 'Complete the sentence.',
          text: 'The frog opened his mouth very [wide] and jumped [away].',
        },
      ]));

    // ----- READING: Challenger -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), rId, 'Midnight in the Classroom', 'CHALLENGER', JSON.stringify([
        {
          id: 'r_c1',
          type: 'correct_the_mistake',
          question: 'Read the summary and correct the mistake. (The story happens at midnight.)',
          text: 'The story happens in the morning.',
          mistake: 'morning',
          correction: 'midnight',
        },
        {
          id: 'r_c2',
          type: 'drag_and_drop',
          question: 'Drag the correct words to complete the story summary.',
          sentences: [
            '[First], the children went to school.',
            'Then, [everyone] sat down quietly.',
            'Finally, the [teacher] turned off the lights.',
          ],
          words: ['First', 'everyone', 'teacher', 'yesterday', 'mother'],
        },
        {
          id: 'r_c3',
          type: 'category_sorting',
          question: 'True or False? Read the statements about "Midnight in the Classroom".',
          categories: ['True', 'False'],
          items: [
            { text: 'The story is about a classroom.', category: 'True' },
            { text: 'The story happens at noon.', category: 'False' },
            { text: 'There are children in the story.', category: 'True' },
            { text: 'The teacher is angry.', category: 'False' },
          ],
        },
      ]));

    // ----- WRITING: Explorer -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), wId, 'Building Sentences', 'EXPLORER', JSON.stringify([
        {
          id: 'w_e1',
          type: 'sentence_unscramble',
          question: 'Unscramble the words to make a sentence.',
          words: ['My', 'name', 'is', 'Anna.'],
        },
        {
          id: 'w_e2',
          type: 'sentence_unscramble',
          question: 'Unscramble the words to make a sentence.',
          words: ['I', 'am', 'ten', 'years', 'old.'],
        },
        {
          id: 'w_e3',
          type: 'fill_in_gap',
          question: 'Write about yourself.',
          text: 'My favourite colour is [blue]. I like [cats]. My best friend is [Tom].',
        },
      ]));

    // ----- WRITING: Voyager -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), wId, 'Fix & Improve', 'VOYAGER', JSON.stringify([
        {
          id: 'w_v1',
          type: 'correct_the_mistake',
          question: 'Find and correct the mistake. Remember: sentences start with a capital letter!',
          text: 'my name is max.',
          mistake: 'my',
          correction: 'My',
        },
        {
          id: 'w_v2',
          type: 'drag_and_drop',
          question: 'Drag the correct words to complete the sentences.',
          sentences: [
            'I am [ten] years old.',
            'My favourite [colour] is blue.',
            'I [like] to read books.',
          ],
          words: ['ten', 'colour', 'like', 'old', 'cat'],
        },
        {
          id: 'w_v3',
          type: 'fill_in_gap',
          question: 'Complete the sentences about you.',
          text: 'I am [happy] today. My school bag is [blue].',
        },
      ]));

    // ----- WRITING: Challenger -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json) VALUES (?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), wId, 'Write About You', 'CHALLENGER', JSON.stringify([
        {
          id: 'w_c1',
          type: 'category_sorting',
          question: 'Sort these sentences into Introduction and Body.',
          categories: ['Introduction', 'Body'],
          items: [
            { text: 'My name is Sarah.', category: 'Introduction' },
            { text: 'I have a pet dog.', category: 'Body' },
            { text: 'Hi, I am Tom.', category: 'Introduction' },
            { text: 'My favourite sport is football.', category: 'Body' },
          ],
        },
        {
          id: 'w_c2',
          type: 'correct_the_mistake',
          question: 'Find and correct both mistakes in this paragraph.',
          text: 'i have two brother and one sister.',
          mistake: 'i',
          correction: 'I',
        },
        {
          id: 'w_c3',
          type: 'fill_in_gap',
          question: 'Complete the paragraph about yourself.',
          text: 'My name [is] Tom. I am [ten] years old. I [like] football.',
        },
      ]));

    // ----- LISTENING: Explorer (dialogue: spelling names) -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, transcript, is_dialogue) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), lId, 'Spell It Out', 'EXPLORER', JSON.stringify([
        {
          id: 'l_e1',
          type: 'multiple_choice',
          question: 'Listen to the dialogue. What is the boy\'s name?',
          options: ['Sam', 'Tom', 'Max', 'Ben'],
          answer: 'Sam',
        },
        {
          id: 'l_e2',
          type: 'multiple_choice',
          question: 'How does he spell his name?',
          options: ['S-A-N', 'S-A-M', 'S-E-M', 'S-A-T'],
          answer: 'S-A-M',
        },
        {
          id: 'l_e3',
          type: 'multiple_choice',
          question: 'What is the dialogue about?',
          options: ['The weather', 'Spelling a name', 'School subjects', 'Animals'],
          answer: 'Spelling a name',
        },
      ]),
        'A: Hello, what is your name?\nB: My name is Sam.\nA: How do you spell Sam?\nB: S-A-M.\nA: Thank you, Sam!',
        1);

    // ----- LISTENING: Voyager (dialogue: classroom instructions) -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, transcript, is_dialogue) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), lId, 'Follow the Teacher', 'VOYAGER', JSON.stringify([
        {
          id: 'l_v1',
          type: 'fill_in_gap',
          question: 'Complete what the teacher says.',
          text: 'Please [open] your books to page [12].',
        },
        {
          id: 'l_v2',
          type: 'multiple_choice',
          question: 'What page does the teacher say?',
          options: ['10', '12', '20', '15'],
          answer: '12',
        },
        {
          id: 'l_v3',
          type: 'multiple_choice',
          question: 'What does the teacher ask the students to do?',
          options: ['Run outside', 'Listen and repeat', 'Close their books', 'Draw a picture'],
          answer: 'Listen and repeat',
        },
      ]),
        'Teacher: Good morning, class!\nStudents: Good morning, Miss Lee!\nTeacher: Please open your books to page 12.\nStudents: OK, Miss Lee.\nTeacher: Now, please listen and repeat after me.',
        1);

    // ----- LISTENING: Challenger (dialogue: school uniform discussion) -----
    db.prepare('INSERT INTO worksheets (id, category_id, title, tier, questions_json, transcript, is_dialogue) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(crypto.randomUUID(), lId, 'School Uniform Talk', 'CHALLENGER', JSON.stringify([
        {
          id: 'l_c1',
          type: 'correct_the_mistake',
          question: 'Listen and correct the sentence.',
          text: 'The students talk about their favourite subjects.',
          mistake: 'subjects',
          correction: 'uniform',
        },
        {
          id: 'l_c2',
          type: 'multiple_choice',
          question: 'What do both students agree on?',
          options: ['They love the colour', 'The uniform is comfortable', 'They want more uniform', 'The uniform is expensive'],
          answer: 'The uniform is comfortable',
        },
        {
          id: 'l_c3',
          type: 'category_sorting',
          question: 'Who said what? Listen and sort each line.',
          categories: ['Student A', 'Student B'],
          items: [
            { text: 'I don\'t like the colour.', category: 'Student A' },
            { text: 'I prefer wearing my own clothes.', category: 'Student B' },
            { text: 'The uniform is comfortable.', category: 'Student A' },
            { text: 'It\'s easy in the morning.', category: 'Student B' },
          ],
        },
      ]),
        'A: Hey, do you like our school uniform?\nB: Hmm, not really. I don\'t like the colour.\nA: Me neither. I prefer wearing my own clothes.\nB: Same here! At least the uniform is comfortable.\nA: True. And it\'s easy in the morning – no need to choose what to wear!',
        1);

    console.log('MORE! 1 textbook units and Unit 1 worksheets seeded successfully.');
  })();
}

// Initialise DB
initDb();

export default db;
