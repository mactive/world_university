CREATE TABLE IF NOT EXISTS university_aliases (
  alias TEXT PRIMARY KEY,
  university_id TEXT NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_university_aliases_university_id
  ON university_aliases(university_id);

INSERT OR IGNORE INTO university_aliases (alias, university_id, notes, created_at, updated_at)
WITH seed(alias, university_id, notes, created_at, updated_at) AS (
  VALUES
    ('mit', 'massachusetts-institute-of-technology', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('stanford', 'stanford-university', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('harvard', 'harvard-university', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('berkeley', 'university-of-california-berkeley', '历史短链兼容', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('oxford', 'university-of-oxford', '历史短链兼容', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('cambridge', 'university-of-cambridge', '历史短链兼容', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('imperial', 'imperial-college-london', '历史短链兼容', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('ucl', 'university-college-london', '历史短链兼容', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('nus', 'national-university-of-singapore', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('ntu-sg', 'nanyang-technological-university', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('hku', 'the-university-of-hong-kong', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('hkust', 'the-hong-kong-university-of-science-and-technology', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('cuhk', 'the-chinese-university-of-hong-kong', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('toronto', 'university-of-toronto', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('mcgill', 'mcgill-university', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('ubc', 'university-of-british-columbia', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('melbourne', 'the-university-of-melbourne', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('sydney', 'the-university-of-sydney', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z'),
    ('anu', 'australian-national-university', '常用简称短链', '2026-06-10T00:00:00.000Z', '2026-06-10T00:00:00.000Z')
)
SELECT seed.alias, seed.university_id, seed.notes, seed.created_at, seed.updated_at
FROM seed
WHERE EXISTS (SELECT 1 FROM universities WHERE id = seed.university_id);
