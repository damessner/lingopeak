-- LingoPeak SQLite Schema

-- Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT,
  role TEXT DEFAULT 'STUDENT', -- STUDENT, TEACHER, ADMIN
  avatar_emoji TEXT DEFAULT '🎒',
  class_id TEXT,
  teams_webhook_url TEXT,         -- MS Teams incoming webhook URL for push notifications
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Units Table
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  order_num INTEGER UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL, -- GRAMMAR, VOCABULARY, READING, WRITING, LISTENING
  unit_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- Worksheets Table
CREATE TABLE IF NOT EXISTS worksheets (
  id TEXT PRIMARY KEY,
  category_id TEXT,
  title TEXT NOT NULL,
  tier TEXT NOT NULL, -- EXPLORER, VOYAGER, CHALLENGER, SUMMIT
  questions_json TEXT NOT NULL, -- JSON formatted questions
  badge_emoji TEXT DEFAULT '🥇',
  audio_url TEXT,
  image_url TEXT,
  video_url TEXT,
  transcript TEXT,
  is_dialogue INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Attempts Table
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  worksheet_id TEXT NOT NULL,
  score REAL NOT NULL,
  answers_json TEXT NOT NULL, -- JSON formatted answers
  completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(worksheet_id) REFERENCES worksheets(id) ON DELETE CASCADE
);

-- Badges Table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(unit_id) REFERENCES units(id) ON DELETE CASCADE
);

-- Books Table (Book Club)
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chapters Table (Book Club)
CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  book_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  difficulty_order INTEGER NOT NULL,
  questions_json TEXT NOT NULL, -- JSON formatted checking questions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Writing Prompts Table (AI Writing Coach)
CREATE TABLE IF NOT EXISTS writing_prompts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rubrics_json TEXT NOT NULL, -- JSON formatted evaluation rubrics
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Writing Submissions Table (AI Writing Coach)
CREATE TABLE IF NOT EXISTS writing_submissions (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  draft_version INTEGER DEFAULT 1,
  text TEXT NOT NULL,
  feedback_json TEXT NOT NULL, -- JSON formatted AI feedback
  version_history_json TEXT NOT NULL, -- JSON array of draft texts
  feedback_history_json TEXT NOT NULL, -- JSON array of AI feedback responses
  completed INTEGER DEFAULT 0, -- 0 = false, 1 = true
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(prompt_id) REFERENCES writing_prompts(id) ON DELETE CASCADE
);

-- Dictionary Cache Table
CREATE TABLE IF NOT EXISTS dictionary_cache (
  word TEXT PRIMARY KEY,
  definition_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tutor Messages Table (Hermes AI Tutor)
CREATE TABLE IF NOT EXISTS tutor_messages (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  is_push INTEGER DEFAULT 0, -- 0 = false, 1 = true
  origin TEXT DEFAULT 'chat', -- chat, cron_warmup, cron_remedial
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Database Indexes for Optimization
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_class_id ON users(class_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student_id ON attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_worksheet_id ON attempts(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_category_id ON worksheets(category_id);
CREATE INDEX IF NOT EXISTS idx_chapters_book_id ON chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_categories_unit_id ON categories(unit_id);
CREATE INDEX IF NOT EXISTS idx_badges_student_id ON badges(student_id);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_student ON writing_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_writing_submissions_prompt ON writing_submissions(prompt_id);
CREATE INDEX IF NOT EXISTS idx_tutor_messages_student ON tutor_messages(student_id);

-- Notifications Table (LingoPeak Global Alerts)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0, -- 0 = false, 1 = true
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Student Memories Table (Hermes AI Tutor Long-Term Memory)
CREATE TABLE IF NOT EXISTS student_memories (
  student_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(student_id, key),
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_student_memories_student ON student_memories(student_id);

-- Coach narrative observations about students
CREATE TABLE IF NOT EXISTS coach_notes (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',  -- grammar, vocabulary, confidence, engagement, general
  content TEXT NOT NULL,                       -- free-form observation, 1-3 sentences
  priority TEXT NOT NULL DEFAULT 'normal',     -- low, normal, high
  source TEXT NOT NULL DEFAULT 'ai',           -- 'ai', 'teacher', 'cron'
  is_active INTEGER DEFAULT 1,                -- 1 = current, 0 = archived
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_coach_notes_student ON coach_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_coach_notes_active ON coach_notes(student_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coach_notes_category ON coach_notes(student_id, category, is_active);
