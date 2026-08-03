-- Legacy backup metadata may only reference the authenticated user's canonical object key.
-- Remove poisoned metadata without deleting any S3 objects it previously referenced.
DELETE FROM backup_metadata
WHERE s3_key <> pubkey || '/backup_v' || backup_version::text || '.db';

ALTER TABLE backup_metadata
ADD CONSTRAINT backup_metadata_s3_key_matches_owner
CHECK (s3_key = pubkey || '/backup_v' || backup_version::text || '.db');
