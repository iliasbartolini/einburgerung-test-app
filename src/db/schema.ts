export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    topic TEXT NOT NULL,
    bundesland_id INTEGER,
    has_image INTEGER DEFAULT 0,
    image_asset_path TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS bookmarks (
    question_id INTEGER PRIMARY KEY REFERENCES questions(id),
    created_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS exam_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    score INTEGER,
    total INTEGER DEFAULT 33,
    passed INTEGER,
    bundesland_id INTEGER NOT NULL,
    time_taken_seconds INTEGER
  )`,

  `CREATE TABLE IF NOT EXISTS question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL REFERENCES questions(id),
    selected_option TEXT NOT NULL,
    is_correct INTEGER NOT NULL,
    mode TEXT NOT NULL,
    exam_session_id INTEGER REFERENCES exam_sessions(id),
    attempted_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS translation_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_text TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    word_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(source_text, target_language)
  )`,

  `CREATE VIEW IF NOT EXISTS question_stats AS
  SELECT q.id AS question_id,
    COUNT(qa.id) AS total_attempts,
    COALESCE(SUM(qa.is_correct), 0) AS correct_count,
    CASE WHEN COUNT(qa.id) = 0 THEN 0.0
         ELSE ROUND(CAST(SUM(qa.is_correct) AS REAL) / COUNT(qa.id) * 100, 1)
    END AS accuracy,
    CASE WHEN COUNT(qa.id) = 0 THEN 'unseen'
         WHEN COUNT(qa.id) >= 3 AND CAST(SUM(qa.is_correct) AS REAL)/COUNT(qa.id) >= 0.9 THEN 'mastered'
         WHEN COUNT(qa.id) >= 2 AND CAST(SUM(qa.is_correct) AS REAL)/COUNT(qa.id) >= 0.7 THEN 'comfortable'
         WHEN COUNT(qa.id) >= 2 AND CAST(SUM(qa.is_correct) AS REAL)/COUNT(qa.id) >= 0.4 THEN 'struggling'
         WHEN COUNT(qa.id) >= 2 THEN 'difficult'
         ELSE 'unseen'
    END AS difficulty_tier,
    MAX(qa.attempted_at) AS last_attempted_at
  FROM questions q
  LEFT JOIN question_attempts qa ON q.id = qa.question_id
  GROUP BY q.id`,
];

export const CREATE_INDEXES_SQL = [
  `CREATE INDEX IF NOT EXISTS idx_attempts_question ON question_attempts(question_id)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_mode ON question_attempts(mode)`,
  `CREATE INDEX IF NOT EXISTS idx_attempts_session ON question_attempts(exam_session_id)`,
  `CREATE INDEX IF NOT EXISTS idx_translation_cache ON translation_cache(source_text, target_language)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_bundesland ON questions(bundesland_id)`,
  `CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic)`,
];
