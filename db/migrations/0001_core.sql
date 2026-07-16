-- Forensic Crawler WORKING relational projection.
-- PostgreSQL 18 / PostGIS 3.6 target; the portable JSON package remains authoritative.

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE investigation_status AS ENUM ('working', 'under_review', 'paused', 'closed', 'superseded');
CREATE TYPE evidence_state AS ENUM (
  'directly_observed_primary_evidence', 'authenticated_official_record',
  'independently_corroborated', 'attributed_unverified', 'disputed',
  'contradicted', 'inferred', 'interpolated', 'unresolved', 'superseded', 'retracted'
);
CREATE TYPE storage_state AS ENUM ('permitted', 'restricted', 'metadata_only', 'link_only', 'quarantined', 'deleted');

CREATE TABLE investigations (
  id text PRIMARY KEY CHECK (id ~ '^fc_inv_'),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  status investigation_status NOT NULL DEFAULT 'working',
  purpose text NOT NULL,
  scope jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE source_registry_entries (
  id text PRIMARY KEY CHECK (id ~ '^fc_reg_'),
  canonical_origin text NOT NULL CHECK (canonical_origin ~ '^https://'),
  allowed_paths jsonb NOT NULL,
  status text NOT NULL,
  access_class text NOT NULL,
  network_use_approved boolean NOT NULL DEFAULT false,
  storage_mode text NOT NULL,
  rights_mode text NOT NULL,
  purpose text NOT NULL,
  owner_role text NOT NULL,
  reviewed_at timestamptz NOT NULL,
  expires_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE rights_decisions (
  id text PRIMARY KEY CHECK (id ~ '^fc_rgt_'),
  subject_id text NOT NULL,
  subject_type text NOT NULL,
  rights_status text NOT NULL,
  storage_permission text NOT NULL,
  display_permission text NOT NULL,
  export_permission text NOT NULL,
  rationale text NOT NULL,
  basis_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewer_role text NOT NULL,
  reviewed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE sources (
  id text PRIMARY KEY CHECK (id ~ '^fc_src_'),
  registry_entry_id text NOT NULL REFERENCES source_registry_entries(id),
  rights_decision_id text NOT NULL REFERENCES rights_decisions(id) DEFERRABLE INITIALLY DEFERRED,
  title text NOT NULL,
  publisher text NOT NULL,
  author text,
  source_type text NOT NULL,
  canonical_url text NOT NULL CHECK (canonical_url ~ '^https://'),
  published_at text,
  retrieved_at timestamptz NOT NULL,
  last_checked_at timestamptz NOT NULL,
  locators jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE source_snapshots (
  id text PRIMARY KEY CHECK (id ~ '^fc_snap_'),
  source_id text NOT NULL REFERENCES sources(id),
  url text NOT NULL CHECK (url ~ '^https://'),
  checked_at timestamptz NOT NULL,
  http_status integer,
  content_hash char(64),
  storage_state storage_state NOT NULL,
  limitations text NOT NULL,
  created_at timestamptz NOT NULL,
  CHECK ((content_hash IS NULL) OR (content_hash ~ '^[0-9a-f]{64}$'))
);

CREATE TABLE entities (
  id text PRIMARY KEY CHECK (id ~ '^fc_ent_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  canonical_name text NOT NULL,
  entity_type text NOT NULL,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL
);

CREATE TABLE claims (
  id text PRIMARY KEY CHECK (id ~ '^fc_clm_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  evidence_state evidence_state NOT NULL,
  procedural_status text,
  current_revision_id text,
  unresolved_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL
);

CREATE TABLE claim_revisions (
  id text PRIMARY KEY CHECK (id ~ '^fc_clmr_'),
  claim_id text NOT NULL REFERENCES claims(id),
  revision_number integer NOT NULL CHECK (revision_number > 0),
  claimant text NOT NULL,
  text text NOT NULL,
  change_reason text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (claim_id, revision_number)
);

ALTER TABLE claims ADD CONSTRAINT claims_current_revision_fk
  FOREIGN KEY (current_revision_id) REFERENCES claim_revisions(id)
  DEFERRABLE INITIALLY DEFERRED;

CREATE TABLE claim_source_relationships (
  id text PRIMARY KEY CHECK (id ~ '^fc_rel_'),
  claim_id text NOT NULL REFERENCES claims(id),
  source_id text NOT NULL REFERENCES sources(id),
  source_snapshot_id text REFERENCES source_snapshots(id),
  relationship_function text NOT NULL,
  rationale text NOT NULL,
  independence_note text NOT NULL,
  locator jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE events (
  id text PRIMARY KEY CHECK (id ~ '^fc_evt_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  title text NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE temporal_anchors (
  id text PRIMARY KEY CHECK (id ~ '^fc_tmp_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  source_id text NOT NULL REFERENCES sources(id),
  label text NOT NULL,
  original_expression text NOT NULL,
  time_system text NOT NULL,
  mission_elapsed_seconds numeric,
  normalized_utc timestamptz,
  precision_seconds numeric NOT NULL CHECK (precision_seconds >= 0),
  uncertainty_lower_seconds numeric NOT NULL CHECK (uncertainty_lower_seconds >= 0),
  uncertainty_upper_seconds numeric NOT NULL CHECK (uncertainty_upper_seconds >= 0),
  conversion_rationale text NOT NULL,
  locator jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE spatial_anchors (
  id text PRIMARY KEY CHECK (id ~ '^fc_spa_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  source_id text REFERENCES sources(id),
  label text NOT NULL,
  geometry geometry(Geometry, 4326),
  horizontal_uncertainty_meters numeric,
  method text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE contradictions (
  id text PRIMARY KEY CHECK (id ~ '^fc_ctr_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  review_status text NOT NULL,
  magnitude_seconds numeric,
  alternate_explanations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL
);

CREATE TABLE assets (
  id text PRIMARY KEY CHECK (id ~ '^fc_ast_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  rights_decision_id text NOT NULL REFERENCES rights_decisions(id) DEFERRABLE INITIALLY DEFERRED,
  title text NOT NULL,
  media_type text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE asset_captures (
  id text PRIMARY KEY CHECK (id ~ '^fc_cap_'),
  asset_id text NOT NULL REFERENCES assets(id),
  captured_at timestamptz NOT NULL,
  acquisition_method text NOT NULL,
  software_version text NOT NULL,
  sha256 char(64) NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint NOT NULL CHECK (byte_size >= 0),
  mime_type text NOT NULL,
  local_path text NOT NULL,
  storage_state storage_state NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE reconstruction_revisions (
  id text PRIMARY KEY CHECK (id ~ '^fc_recr_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  revision_number integer NOT NULL CHECK (revision_number > 0),
  method text NOT NULL,
  input_ids jsonb NOT NULL,
  parameters jsonb NOT NULL,
  output_hash char(64) NOT NULL CHECK (output_hash ~ '^[0-9a-f]{64}$'),
  uncertainty jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE editorial_reviews (
  id text PRIMARY KEY CHECK (id ~ '^fc_rev_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  review_type text NOT NULL,
  reviewer_role text NOT NULL,
  subject_ids jsonb NOT NULL,
  findings jsonb NOT NULL,
  limitations jsonb NOT NULL,
  reviewed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE audit_events (
  id text PRIMARY KEY CHECK (id ~ '^fc_aud_'),
  investigation_id text NOT NULL REFERENCES investigations(id),
  sequence bigint NOT NULL,
  event_type text NOT NULL,
  actor_id text NOT NULL,
  actor_type text NOT NULL,
  occurred_at timestamptz NOT NULL,
  subject_ids jsonb NOT NULL,
  details jsonb NOT NULL,
  previous_hash char(64),
  event_hash char(64) NOT NULL CHECK (event_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL,
  UNIQUE (investigation_id, sequence),
  UNIQUE (event_hash),
  CHECK ((previous_hash IS NULL) OR (previous_hash ~ '^[0-9a-f]{64}$'))
);

CREATE INDEX claim_source_claim_idx ON claim_source_relationships (claim_id);
CREATE INDEX claim_source_source_idx ON claim_source_relationships (source_id);
CREATE INDEX temporal_anchor_met_idx ON temporal_anchors (investigation_id, mission_elapsed_seconds);
CREATE INDEX spatial_anchor_geometry_idx ON spatial_anchors USING gist (geometry);
CREATE INDEX audit_events_sequence_idx ON audit_events (investigation_id, sequence);

-- Rights rows point at heterogeneous subject IDs; application-level package validation
-- enforces exact source/asset subject matching before this projection is accepted.

COMMIT;
