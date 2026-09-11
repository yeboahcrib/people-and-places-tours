-- Enquiries captured from the Contact page form.
--
-- One row per delivered enquiry. The email to the team remains the system of
-- record for actually receiving an enquiry; this table exists so the same
-- information can be counted later without reading an inbox.
--
-- Every column here is something the form already collects, or a system field
-- the Function generates. No new question is asked of the visitor.
--
-- Two columns are here because the privacy policy already promises them, not
-- because a dashboard wants them. The policy says enquiries are "kept while a
-- conversation is live, and deleted once it clearly is not going anywhere",
-- and Ghana's Data Protection Act 2012 gives a person the right to ask what is
-- held about them. `status` is how "live" is recorded, and the index on
-- `email` is how a subject-access or deletion request is answered without a
-- full table scan.

CREATE TABLE IF NOT EXISTS enquiries (
  -- The Function's idempotency key, so a client retry cannot create a second
  -- row for one enquiry. Matches the key sent to Resend.
  id                      TEXT PRIMARY KEY,
  -- The guest-facing reference, "PP-K7M2QX", quoted in the email and read back
  -- over the phone.
  reference               TEXT NOT NULL,
  created_at              TEXT NOT NULL,          -- ISO 8601, UTC
  status                  TEXT NOT NULL DEFAULT 'new',
  source                  TEXT NOT NULL DEFAULT 'Website inquiry',

  first_name              TEXT NOT NULL,
  last_name               TEXT NOT NULL,
  email                   TEXT NOT NULL,
  phone                   TEXT NOT NULL DEFAULT '',
  country                 TEXT NOT NULL DEFAULT '',

  -- The slug is what reporting groups by; it is stable. The display name is
  -- stored beside it as it read on the day, so a later rename of a tour does
  -- not silently rewrite history.
  tour_interest           TEXT NOT NULL DEFAULT '',
  tour_name               TEXT NOT NULL DEFAULT '',

  group_size              TEXT NOT NULL DEFAULT '',
  travel_date             TEXT NOT NULL DEFAULT '',   -- arrival, YYYY-MM-DD
  departure_date          TEXT NOT NULL DEFAULT '',
  date_flexibility        TEXT NOT NULL DEFAULT '',
  traveling_with_children TEXT NOT NULL DEFAULT '',
  children_age_ranges     TEXT NOT NULL DEFAULT '',
  accommodation           TEXT NOT NULL DEFAULT '',
  contact_method          TEXT NOT NULL DEFAULT '',
  message                 TEXT NOT NULL DEFAULT ''
);

-- Empty string rather than NULL throughout, because the Function already
-- normalises every optional field to a trimmed string. One representation for
-- "not answered" keeps later COUNT and GROUP BY queries free of NULL handling.

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at  ON enquiries (created_at);
CREATE INDEX IF NOT EXISTS idx_enquiries_tour        ON enquiries (tour_interest);
CREATE INDEX IF NOT EXISTS idx_enquiries_country     ON enquiries (country);
CREATE INDEX IF NOT EXISTS idx_enquiries_travel_date ON enquiries (travel_date);
CREATE INDEX IF NOT EXISTS idx_enquiries_status      ON enquiries (status);
-- Not for the dashboard: this one answers "what do you hold about me" and the
-- deletion request that may follow it.
CREATE INDEX IF NOT EXISTS idx_enquiries_email       ON enquiries (email);
