-- A rate limit for enquiries Turnstile could not vouch for.
--
-- Turnstile runs in the visitor's browser, so a content blocker can stop it
-- minting a token and the Function accepts the enquiry anyway rather than
-- punishing a real person for their extensions. That opening is only safe if
-- one source cannot walk through it repeatedly, and Cloudflare's own rate
-- limiting rules are a paid feature on this plan. This is the same control,
-- built from the database the enquiries already use.
--
-- Nothing here identifies anyone. The privacy policy promises no tracking and
-- no cookies of our own, so no IP address is stored: what is written is a
-- truncated SHA-256 of the address under a random salt this database generates
-- for itself, and every row is deleted once it is older than the window. The
-- salt never leaves the database and is never sent anywhere.
--
-- Verified enquiries never reach this table. Under normal traffic it is empty.

CREATE TABLE IF NOT EXISTS enquiry_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS enquiry_attempts (
  -- 16 hex characters of a salted digest. Enough to separate sources, far too
  -- little to work backwards from, and meaningless once the salt is unknown.
  fingerprint  TEXT NOT NULL,
  attempted_at TEXT NOT NULL   -- ISO 8601, UTC
);

CREATE INDEX IF NOT EXISTS idx_attempts_window ON enquiry_attempts (fingerprint, attempted_at);
CREATE INDEX IF NOT EXISTS idx_attempts_age    ON enquiry_attempts (attempted_at);
