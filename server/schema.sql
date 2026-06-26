-- ==========================================================================
-- IELTS STUDY HUB - POSTGRESQL DATABASE SCHEMA
-- ==========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  target_band VARCHAR(10) DEFAULT '6.5',
  study_hours REAL DEFAULT 1.5,
  streak INTEGER DEFAULT 1,
  last_active_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Vocabulary Notebook Table
CREATE TABLE IF NOT EXISTS vocabularies (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word VARCHAR(100) NOT NULL,
  ipa VARCHAR(100),
  meaning_vi TEXT NOT NULL,
  meaning_en TEXT,
  part_of_speech VARCHAR(50) DEFAULT 'noun',
  example TEXT,
  topic VARCHAR(50) DEFAULT 'General',
  source VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'Trung bình',
  status VARCHAR(20) DEFAULT 'Chưa thuộc',
  next_review_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vocab_user ON vocabularies(user_id);

-- 3. Vocabulary Tests History
CREATE TABLE IF NOT EXISTS vocabulary_tests (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  score INTEGER NOT NULL,
  test_type VARCHAR(50) DEFAULT 'Vocabulary Test',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tests_user ON vocabulary_tests(user_id);

-- 4. Practice attempts (Reading / Listening / Writing)
CREATE TABLE IF NOT EXISTS test_attempts (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_title VARCHAR(100) NOT NULL,
  test_number VARCHAR(20) NOT NULL,
  skill VARCHAR(20) NOT NULL, -- 'Reading' | 'Listening' | 'Writing' | 'Speaking'
  score VARCHAR(20) DEFAULT '0/40',
  total_correct INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0, -- seconds
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_answers JSONB,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON test_attempts(user_id);

-- 5. Speaking Voice Records
CREATE TABLE IF NOT EXISTS speaking_records (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  file_path VARCHAR(255) NOT NULL, -- Saved audio file url path
  duration VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_speaking_user ON speaking_records(user_id);

-- 6. Mistake Notebook Table
CREATE TABLE IF NOT EXISTS mistakes (
  id VARCHAR(100) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill VARCHAR(20) NOT NULL,
  test_title VARCHAR(100) NOT NULL,
  question_number INTEGER NOT NULL,
  user_answer VARCHAR(100),
  correct_answer VARCHAR(100) NOT NULL,
  reason VARCHAR(100) DEFAULT 'Chưa phân tích',
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mistakes_user ON mistakes(user_id);

-- 7. Study Planner Calendar
CREATE TABLE IF NOT EXISTS study_plans (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_id VARCHAR(10) NOT NULL, -- 'mon', 'tue', etc.
  day_name VARCHAR(20) NOT NULL, -- 'Thứ 2', etc.
  task TEXT,
  completed BOOLEAN DEFAULT FALSE,
  subtasks JSONB,
  PRIMARY KEY (user_id, day_id)
);
