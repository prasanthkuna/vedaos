CREATE TABLE IF NOT EXISTS veda_users (
  user_id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_profiles (
  profile_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES veda_users(user_id),
  display_name TEXT NOT NULL,
  dob TEXT NOT NULL,
  tob_local TEXT NOT NULL,
  pob_text TEXT NOT NULL,
  tz_iana TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  birth_time_certainty TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  language_mode TEXT NOT NULL DEFAULT 'auto',
  calendar_mode TEXT NOT NULL DEFAULT 'civil',
  current_city TEXT,
  current_lat DOUBLE PRECISION,
  current_lon DOUBLE PRECISION,
  is_guest_profile BOOLEAN NOT NULL DEFAULT FALSE,
  birth_time_risk_level TEXT,
  rectified_tob_local TEXT,
  rectification_completed BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_engine_runs (
  run_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  mode TEXT NOT NULL,
  engine_version TEXT NOT NULL,
  years_json JSONB NOT NULL,
  feed_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_claims (
  claim_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES veda_engine_runs(run_id),
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  year INT NOT NULL,
  text TEXT NOT NULL,
  weight_class TEXT NOT NULL,
  confidence_score DOUBLE PRECISION NOT NULL,
  template_code TEXT NOT NULL,
  trigger_flags JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_validations (
  validation_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  run_id TEXT NOT NULL REFERENCES veda_engine_runs(run_id),
  claim_id TEXT NOT NULL REFERENCES veda_claims(claim_id),
  label TEXT NOT NULL,
  topics JSONB,
  direction TEXT,
  confidence_level TEXT,
  quarter INT,
  wrong_reason TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, run_id, claim_id)
);

CREATE TABLE IF NOT EXISTS veda_score_snapshots (
  profile_id TEXT PRIMARY KEY REFERENCES veda_profiles(profile_id),
  psa DOUBLE PRECISION NOT NULL,
  pcs DOUBLE PRECISION NOT NULL,
  validated_count INT NOT NULL,
  year_coverage INT NOT NULL,
  diversity_score DOUBLE PRECISION NOT NULL,
  future_unlocked BOOLEAN NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_rectification_runs (
  rect_run_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES veda_profiles(profile_id),
  window_start TEXT NOT NULL,
  window_end TEXT NOT NULL,
  confidence DOUBLE PRECISION NOT NULL,
  effective_tob_local TEXT NOT NULL,
  solver_trace_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_entitlements (
  user_id TEXT PRIMARY KEY REFERENCES veda_users(user_id),
  plan_code TEXT NOT NULL DEFAULT 'basic',
  trial_active BOOLEAN NOT NULL DEFAULT FALSE,
  pro_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  family_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_consents (
  consent_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES veda_users(user_id),
  purpose_code TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS veda_deletion_requests (
  request_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES veda_users(user_id),
  reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON veda_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_profile ON veda_engine_runs(profile_id);
CREATE INDEX IF NOT EXISTS idx_claims_profile ON veda_claims(profile_id);
CREATE INDEX IF NOT EXISTS idx_validations_profile ON veda_validations(profile_id);
