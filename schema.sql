-- CarrotWorld Explorer — D1 schema
-- Each table stores its records as a JSON blob in `data`, matching the
-- JS objects the frontend already uses. This keeps the API layer thin:
-- no column-by-column mapping, just JSON.parse / JSON.stringify.

CREATE TABLE IF NOT EXISTS students (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS adventures (
  id         TEXT PRIMARY KEY,   -- `${studentId}::${programId}`
  student_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  data       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suggestions (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_adventures_student ON adventures(student_id);
CREATE INDEX IF NOT EXISTS idx_adventures_program ON adventures(program_id);
