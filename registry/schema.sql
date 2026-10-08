CREATE TABLE IF NOT EXISTS aestum_documents (
 id TEXT PRIMARY KEY,
 artist TEXT NOT NULL,
 title TEXT NOT NULL,
 kind TEXT NOT NULL,
 issued_at TEXT NOT NULL,
 registered_at TEXT NOT NULL,
 sha256 TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'artist-issued' CHECK(status IN ('artist-issued','superseded','withdrawn')),
 replacement_id TEXT,
 updated_at TEXT NOT NULL,
 consent_version TEXT NOT NULL
);
