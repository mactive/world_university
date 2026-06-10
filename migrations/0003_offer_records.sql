CREATE TABLE IF NOT EXISTS mainland_schools (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  school_type TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  tags_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mainland_schools_city
  ON mainland_schools(province, city);

CREATE INDEX IF NOT EXISTS idx_mainland_schools_status
  ON mainland_schools(status);

CREATE TABLE IF NOT EXISTS university_offer_records (
  id TEXT PRIMARY KEY,
  year INTEGER NOT NULL,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  mainland_school_id TEXT REFERENCES mainland_schools(id) ON DELETE SET NULL,
  offer_count INTEGER NOT NULL CHECK (offer_count >= 0),
  applicant_count INTEGER CHECK (applicant_count IS NULL OR applicant_count >= 0),
  enrolled_count INTEGER CHECK (enrolled_count IS NULL OR enrolled_count >= 0),
  degree_level TEXT NOT NULL DEFAULT 'undergraduate'
    CHECK (degree_level IN ('undergraduate', 'graduate', 'foundation', 'other')),
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_snapshot TEXT,
  source_kind TEXT NOT NULL DEFAULT 'screenshot'
    CHECK (source_kind IN ('screenshot', 'official', 'api', 'manual')),
  filters_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_offer_records_university
  ON university_offer_records(university_id);

CREATE INDEX IF NOT EXISTS idx_offer_records_year
  ON university_offer_records(year);

CREATE INDEX IF NOT EXISTS idx_offer_records_mainland_school
  ON university_offer_records(mainland_school_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_offer_records_dedupe
  ON university_offer_records(
    year,
    university_id,
    COALESCE(mainland_school_id, ''),
    degree_level,
    source_name,
    COALESCE(source_snapshot, '')
  );
