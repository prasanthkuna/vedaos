DROP INDEX IF EXISTS idx_localized_content_key;
DROP INDEX IF EXISTS idx_glossary_term_key;
DROP INDEX IF EXISTS idx_narrative_blocks_run;
DROP INDEX IF EXISTS idx_narrative_runs_profile;
DROP INDEX IF EXISTS idx_phase_highlights_profile;
DROP INDEX IF EXISTS idx_phase_segments_run_ord;
DROP INDEX IF EXISTS idx_phase_segments_profile;
DROP INDEX IF EXISTS idx_phase_runs_profile;
DROP INDEX IF EXISTS idx_profiles_input_mode;

DROP TABLE IF EXISTS veda_localized_content_blocks;
DROP TABLE IF EXISTS veda_vedic_glossary_entries;
DROP TABLE IF EXISTS veda_narrative_blocks;
DROP TABLE IF EXISTS veda_narrative_runs;
DROP TABLE IF EXISTS veda_phase_highlights;
DROP TABLE IF EXISTS veda_phase_segments;
DROP TABLE IF EXISTS veda_phase_runs;

ALTER TABLE veda_profiles
  DROP COLUMN IF EXISTS birth_time_notes,
  DROP COLUMN IF EXISTS birth_nakshatra_hint,
  DROP COLUMN IF EXISTS birth_time_window_code,
  DROP COLUMN IF EXISTS birth_time_input_mode;
