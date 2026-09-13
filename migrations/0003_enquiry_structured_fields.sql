-- Three structured answers added to the enquiry form.
--
-- Numbered 0003, not 0002: an unmerged branch (turnstile-blocked-fallback)
-- already carries a 0002, and two files with one number would leave nobody
-- sure which had been run.
--
-- Additive only. ADD COLUMN never touches an existing row's data: every row
-- written before this migration reads '' in all three columns, which is the
-- same "not answered" every other optional column in this table already uses
-- (see 0001 — empty string rather than NULL throughout, so later COUNT and
-- GROUP BY queries need no NULL handling).
--
-- Run it ONCE per database. SQLite has no ADD COLUMN IF NOT EXISTS, so a
-- second run fails with "duplicate column name" — harmless, but alarming.
--
-- Run it BEFORE the code that writes these columns deploys. The Function
-- names all three in its INSERT; against a table without them the insert
-- fails, the email is still delivered (storage is written after Resend and a
-- failure is logged, never shown to the visitor), and the row is lost.
-- /api/health reports enquiryStorageReady: false with the missing columns
-- named until this has run.

-- A band from a fixed list, per person, excluding flights: under-500,
-- 500-1500, 1500-3000, 3000-5000, over-5000, not-sure. Optional.
ALTER TABLE enquiries ADD COLUMN budget_range TEXT NOT NULL DEFAULT '';

-- Comma-separated slugs from a fixed list, in the form's order and each once:
-- "culture-heritage,food". Plain text rather than JSON because the only
-- question anyone will ask of it is "how many mentioned X", which is a LIKE.
ALTER TABLE enquiries ADD COLUMN interests TEXT NOT NULL DEFAULT '';

-- Whole days as text, "7". Asked only when the enquiry is for a custom trip,
-- so it is '' on every other row by design, not by omission.
ALTER TABLE enquiries ADD COLUMN trip_length_days TEXT NOT NULL DEFAULT '';
