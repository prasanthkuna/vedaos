ALTER TABLE veda_profiles
  ADD COLUMN IF NOT EXISTS birth_time_input_mode TEXT,
  ADD COLUMN IF NOT EXISTS birth_time_window_code TEXT,
  ADD COLUMN IF NOT EXISTS birth_nakshatra_hint TEXT,
  ADD COLUMN IF NOT EXISTS birth_time_notes TEXT;

UPDATE veda_profiles
SET birth_time_input_mode = CASE
  WHEN birth_time_input_mode IS NOT NULL THEN birth_time_input_mode
  WHEN birth_time_certainty IN ('verified', 'confident') THEN 'exact_time'
  ELSE 'unknown'
END;

ALTER TABLE veda_profiles
  ALTER COLUMN birth_time_input_mode SET DEFAULT 'exact_time';

ALTER TABLE veda_profiles
  ALTER COLUMN birth_time_input_mode SET NOT NULL;

CREATE TABLE IF NOT EXISTS veda_phase_runs (
  phase_run_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  source_mode TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  as_of_utc TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_phase_segments (
  phase_segment_id TEXT PRIMARY KEY,
  phase_run_id TEXT NOT NULL REFERENCES veda_phase_runs(phase_run_id),
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  level TEXT NOT NULL,
  md_lord TEXT NOT NULL,
  ad_lord TEXT,
  pd_lord TEXT,
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  ord INT NOT NULL,
  confidence_band TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_phase_highlights (
  phase_highlight_id TEXT PRIMARY KEY,
  phase_segment_id TEXT NOT NULL REFERENCES veda_phase_segments(phase_segment_id),
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  trigger_type TEXT NOT NULL,
  trigger_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_narrative_runs (
  narrative_run_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  phase_run_id TEXT REFERENCES veda_phase_runs(phase_run_id),
  engine_version TEXT NOT NULL,
  provider TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  language_code TEXT NOT NULL,
  explanation_mode TEXT NOT NULL,
  grounding_passed BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_narrative_blocks (
  narrative_block_id TEXT PRIMARY KEY,
  narrative_run_id TEXT NOT NULL REFERENCES veda_narrative_runs(narrative_run_id),
  phase_segment_id TEXT REFERENCES veda_phase_segments(phase_segment_id),
  block_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_line TEXT,
  caution_line TEXT,
  timing_ref TEXT,
  why_factors JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_vedic_glossary_entries (
  glossary_id TEXT PRIMARY KEY,
  term_key TEXT NOT NULL,
  vedic_term TEXT NOT NULL,
  simple_line TEXT NOT NULL,
  why_it_matters TEXT NOT NULL,
  example_line TEXT,
  tone_level TEXT NOT NULL,
  do_not_translate BOOLEAN NOT NULL DEFAULT FALSE,
  aliases_json JSONB,
  review_status TEXT NOT NULL,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  UNIQUE(term_key, vedic_term)
);

CREATE TABLE IF NOT EXISTS veda_localized_content_blocks (
  block_id TEXT PRIMARY KEY,
  content_key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  tone_level TEXT NOT NULL,
  content_json JSONB NOT NULL,
  prompt_template TEXT,
  version TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(content_key, language_code, tone_level, version)
);

CREATE INDEX IF NOT EXISTS idx_profiles_input_mode ON veda_profiles(birth_time_input_mode);
CREATE INDEX IF NOT EXISTS idx_phase_runs_profile ON veda_phase_runs(profile_id);
CREATE INDEX IF NOT EXISTS idx_phase_segments_profile ON veda_phase_segments(profile_id);
CREATE INDEX IF NOT EXISTS idx_phase_segments_run_ord ON veda_phase_segments(phase_run_id, ord);
CREATE INDEX IF NOT EXISTS idx_phase_highlights_profile ON veda_phase_highlights(profile_id);
CREATE INDEX IF NOT EXISTS idx_narrative_runs_profile ON veda_narrative_runs(profile_id);
CREATE INDEX IF NOT EXISTS idx_narrative_blocks_run ON veda_narrative_blocks(narrative_run_id);
CREATE INDEX IF NOT EXISTS idx_glossary_term_key ON veda_vedic_glossary_entries(term_key);
CREATE INDEX IF NOT EXISTS idx_localized_content_key ON veda_localized_content_blocks(content_key, language_code);
