CREATE TABLE password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, payload TEXT NOT NULL CHECK(json_valid(payload)),
user_id INTEGER GENERATED ALWAYS AS (json_extract(payload, '$.user_id')) VIRTUAL REFERENCES users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED);
CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX idx_password_resets_token_hash ON password_resets(json_extract(payload,'$.token_hash'));
