ALTER TABLE users
ADD COLUMN nostr_pubkey TEXT
    CHECK (nostr_pubkey IS NULL OR nostr_pubkey ~ '^[0-9a-f]{64}$');
