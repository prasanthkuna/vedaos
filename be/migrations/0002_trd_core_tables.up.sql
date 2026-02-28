CREATE TABLE IF NOT EXISTS veda_dasha_slices (
  slice_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  level TEXT NOT NULL,
  lord TEXT NOT NULL,
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  run_id TEXT REFERENCES veda_engine_runs(run_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_transit_hits (
  transit_hit_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  run_id TEXT REFERENCES veda_engine_runs(run_id),
  planet TEXT NOT NULL,
  tag TEXT NOT NULL,
  start_utc TIMESTAMPTZ NOT NULL,
  end_utc TIMESTAMPTZ NOT NULL,
  confidence_score DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_claim_templates (
  template_code TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  language_code TEXT NOT NULL,
  weight_class TEXT NOT NULL,
  body TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_rectification_prompts (
  prompt_id TEXT NOT NULL,
  language_code TEXT NOT NULL,
  text TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (prompt_id, language_code)
);

CREATE TABLE IF NOT EXISTS veda_rectification_answers (
  answer_id TEXT PRIMARY KEY,
  rect_run_id TEXT NOT NULL REFERENCES veda_rectification_runs(rect_run_id),
  prompt_id TEXT NOT NULL,
  yn BOOLEAN,
  year INT,
  quarter INT,
  range_start_year INT,
  range_end_year INT,
  text_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_calibration_weights (
  profile_id TEXT PRIMARY KEY REFERENCES veda_profiles(profile_id),
  weights_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_claim_lineage (
  lineage_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES veda_claims(claim_id),
  dasha_slice_ids JSONB,
  transit_hit_ids JSONB,
  trigger_flags JSONB,
  specificity_score DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_policy_versions (
  policy_version TEXT PRIMARY KEY,
  policy_text TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_billing_customers (
  user_id TEXT PRIMARY KEY REFERENCES veda_users(user_id),
  ios_original_transaction_id TEXT,
  android_obfuscated_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_billing_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES veda_users(user_id),
  platform TEXT NOT NULL,
  product_id TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_billing_events (
  event_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_json JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dasha_profile ON veda_dasha_slices(profile_id);
CREATE INDEX IF NOT EXISTS idx_transit_profile ON veda_transit_hits(profile_id);
CREATE INDEX IF NOT EXISTS idx_claim_lineage_claim ON veda_claim_lineage(claim_id);
CREATE INDEX IF NOT EXISTS idx_billing_sub_user ON veda_billing_subscriptions(user_id);

INSERT INTO veda_rectification_prompts (prompt_id, language_code, text, active)
VALUES
  ('job_shift', 'en', 'Did you face a major job shift around a specific year?', true),
  ('relocation', 'en', 'Did relocation happen with strong pressure in any year?', true),
  ('exam_result', 'en', 'Was there a defining exam or certification period?', true),
  ('family_responsibility', 'en', 'Did family responsibility increase sharply in any period?', true),
  ('financial_stress', 'en', 'Did financial pressure peak in any narrow window?', true),
  ('job_shift', 'hi', 'Kya kisi varsh me career me bada badlav hua?', true),
  ('relocation', 'hi', 'Kya kisi avadhi me sthan parivartan dabav me hua?', true),
  ('exam_result', 'hi', 'Kya koi pariksha ya pramanan kal nirnayak raha?', true),
  ('family_responsibility', 'hi', 'Kya parivar ki zimmedari achanak badhi?', true),
  ('financial_stress', 'hi', 'Kya kisi samay arthik dabav charam par tha?', true),
  ('job_shift', 'te', 'Oka samvatsaram lo udyogam lo pedda marpu jariginda?', true),
  ('relocation', 'te', 'Oka kalam lo ottidito sthala marpu jariginda?', true),
  ('exam_result', 'te', 'Oka pariksha leka certification kalam nirnayakamaina da?', true),
  ('family_responsibility', 'te', 'Kutumba badhyata okkasariga perigina kalam unda?', true),
  ('financial_stress', 'te', 'Arthika ottidi atyadhikanga unna samayam unda?', true)
ON CONFLICT (prompt_id, language_code) DO NOTHING;
