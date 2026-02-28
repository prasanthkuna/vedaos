DROP INDEX IF EXISTS idx_billing_sub_user;
DROP INDEX IF EXISTS idx_claim_lineage_claim;
DROP INDEX IF EXISTS idx_transit_profile;
DROP INDEX IF EXISTS idx_dasha_profile;

DROP TABLE IF EXISTS veda_billing_events;
DROP TABLE IF EXISTS veda_billing_subscriptions;
DROP TABLE IF EXISTS veda_billing_customers;
DROP TABLE IF EXISTS veda_policy_versions;
DROP TABLE IF EXISTS veda_claim_lineage;
DROP TABLE IF EXISTS veda_calibration_weights;
DROP TABLE IF EXISTS veda_rectification_answers;
DROP TABLE IF EXISTS veda_rectification_prompts;
DROP TABLE IF EXISTS veda_claim_templates;
DROP TABLE IF EXISTS veda_transit_hits;
DROP TABLE IF EXISTS veda_dasha_slices;
