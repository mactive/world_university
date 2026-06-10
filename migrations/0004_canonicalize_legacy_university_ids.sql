UPDATE universities
SET slug = '__legacy_ucl'
WHERE id = 'ucl'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-college-london');

INSERT INTO universities (
  id, slug, name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
)
SELECT
  'university-college-london', 'university-college-london', name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
FROM universities
WHERE id = 'ucl'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-college-london');

UPDATE university_offer_records
SET university_id = 'university-college-london'
WHERE university_id = 'ucl'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-college-london');

DELETE FROM universities
WHERE id = 'ucl'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-college-london');

UPDATE universities
SET slug = '__legacy_imperial'
WHERE id = 'imperial'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'imperial-college-london');

INSERT INTO universities (
  id, slug, name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
)
SELECT
  'imperial-college-london', 'imperial-college-london', name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
FROM universities
WHERE id = 'imperial'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'imperial-college-london');

UPDATE university_offer_records
SET university_id = 'imperial-college-london'
WHERE university_id = 'imperial'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'imperial-college-london');

DELETE FROM universities
WHERE id = 'imperial'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'imperial-college-london');

UPDATE universities
SET slug = '__legacy_berkeley'
WHERE id = 'berkeley'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-california-berkeley');

INSERT INTO universities (
  id, slug, name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
)
SELECT
  'university-of-california-berkeley', 'university-of-california-berkeley', name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
FROM universities
WHERE id = 'berkeley'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-california-berkeley');

UPDATE university_offer_records
SET university_id = 'university-of-california-berkeley'
WHERE university_id = 'berkeley'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-california-berkeley');

DELETE FROM universities
WHERE id = 'berkeley'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-california-berkeley');

UPDATE universities
SET slug = '__legacy_cambridge'
WHERE id = 'cambridge'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-cambridge');

INSERT INTO universities (
  id, slug, name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
)
SELECT
  'university-of-cambridge', 'university-of-cambridge', name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
FROM universities
WHERE id = 'cambridge'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-cambridge');

UPDATE university_offer_records
SET university_id = 'university-of-cambridge'
WHERE university_id = 'cambridge'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-cambridge');

DELETE FROM universities
WHERE id = 'cambridge'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-cambridge');

UPDATE universities
SET slug = '__legacy_oxford'
WHERE id = 'oxford'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-oxford');

INSERT INTO universities (
  id, slug, name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
)
SELECT
  'university-of-oxford', 'university-of-oxford', name_en, name_zh, abbreviation, country, country_code, city,
  latitude, longitude, qs_rank, rank_year, ranking_system, enrollment, website, admissions_url,
  tuition_json, mainland_china_intake_json, strengths_json, housing_json,
  requirements_json, admission_history_json, sources_json, tags_json, status, updated_at
FROM universities
WHERE id = 'oxford'
  AND NOT EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-oxford');

UPDATE university_offer_records
SET university_id = 'university-of-oxford'
WHERE university_id = 'oxford'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-oxford');

DELETE FROM universities
WHERE id = 'oxford'
  AND EXISTS (SELECT 1 FROM universities WHERE id = 'university-of-oxford');
