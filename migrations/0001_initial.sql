CREATE TABLE IF NOT EXISTS universities (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  abbreviation TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  city TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  qs_rank INTEGER,
  rank_year INTEGER,
  website TEXT NOT NULL DEFAULT '',
  admissions_url TEXT NOT NULL DEFAULT '',
  tuition_json TEXT,
  mainland_china_intake_json TEXT,
  strengths_json TEXT NOT NULL DEFAULT '[]',
  housing_json TEXT,
  requirements_json TEXT NOT NULL DEFAULT '{}',
  admission_history_json TEXT NOT NULL DEFAULT '[]',
  sources_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_universities_country_code
  ON universities(country_code);

CREATE INDEX IF NOT EXISTS idx_universities_qs_rank
  ON universities(qs_rank);

CREATE INDEX IF NOT EXISTS idx_universities_status
  ON universities(status);
