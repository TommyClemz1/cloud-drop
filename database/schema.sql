CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  original_name TEXT NOT NULL,
  s3_key TEXT NOT NULL UNIQUE,
  mime_type TEXT,
  size_bytes BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
