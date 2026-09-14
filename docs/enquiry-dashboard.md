# Enquiry dashboard

The internal dashboard at `/dashboard` reads enquiries back as figures. It is a
tool for the team, not a page of the website: no navigation, never indexed,
never linked, and private at two layers.

## Who can open it

1. **Cloudflare Access** sits in front of the route. On previews it covers the
   whole `*.people-and-places-tours.pages.dev` host.
2. **The Functions verify Access's token themselves**
   (`src/dashboard/access.mjs`): RS256 signature against Access's published
   keys, audience (`ACCESS_AUD`), issuer (`ACCESS_TEAM_DOMAIN`), expiry. Every
   failure is the same `401 {"error":"This dashboard is private."}`, and a
   refused request never reaches the database. With either variable unset the
   endpoints refuse everyone — misconfiguration closes the door, it does not
   open it.

The page itself contains no data. Everything comes from two endpoints:

| Endpoint | Returns | Personal detail |
| --- | --- | --- |
| `GET /api/dashboard?range&from&to&country&experience&recent` | Every figure on the page, for one filtered set of enquiries | Name only, and only for the ≤100 enquiries in the recent list, read by a second bounded query |
| `GET /api/dashboard/enquiry?reference=PP-XXXXXX` | One enquiry, grouped for reading | Everything on that one enquiry, when somebody opens it |

The figures query names its columns and never selects email, phone, message,
names or children's ages. `tests/dashboard-function.mjs` fails if it ever does.
D1 is bound only inside the Functions; the browser has no binding and no query.

**Before this reaches production** an Access application must protect
`peopleplacesgh.com/dashboard` and `peopleplacesgh.com/api/dashboard` (paths
match their sub-paths), and `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` must be set in
the Production scope with that application's audience tag. Without them the
page loads and every figure is refused.

## The page

- **Overview** — total enquiries, this month, top country, most requested
  experience. Four figures only. Ties are shown as ties. "Top country" ignores
  unmatched text and missing answers; "most requested experience" ignores
  "Open to ideas" and "Not selected", which are answers but not experiences.
- **Demand** — enquiries over time (weekly for spans up to 120 days, monthly
  beyond, every empty period drawn as 0); countries; experiences; planned travel
  month for this month and the 18 after it, split into exact dates and rough
  months.
- **Trip and preferences** — group size and budget as ordered columns with the
  median stated range; custom-trip length with median, average and range over
  custom enquiries that gave one; interests as a share of enquiries (several can
  be chosen, so they do not add to 100%); accommodation as a donut; children and
  contact preference as split bars.
- **Enquiries** — the latest 25 (then 50, then 100) of the same filtered set.
  A reference opens the full enquiry in a drawer: Traveller, Trip, Preferences,
  Message, Record. Escape or the close button returns focus to the row.

Filters are date range, country and experience. They are sent to the Function,
which applies them before counting anything, so the headline figures, every
chart and the list always describe the same enquiries. The filters are kept in
the URL.

### No figure, three ways

| Shown as | Means | Example |
| --- | --- | --- |
| `0` | A real answer nobody in view gave | "More than 15" with no enquiries |
| **Not sure yet** (gold) | Somebody chose "Not sure yet" | `group_size = 'not-sure'` |
| **No answer** (hatched) | The value is empty: skipped, the form's default, not asked for that trip, or asked only after the enquiry was made | `budget_range = ''` |

An empty value is never counted as zero and never folded into an answer. Each
chart says what its empty value can mean, because it differs by question:
accommodation and date flexibility are not asked on day tours; children and
contact method store `''` for their default option.

No average is taken of a range. Group size and budget report a median range;
only trip length, which is a number of days, has an average.

## Country normalisation

Countries are reconciled when figures are read. **No row is changed.**

- An ISO code (`GH`) or the exact country name in any case or spacing
  (`Ghana`, ` ghana `) is that country.
- A short list of names with exactly one meaning is matched too: `USA`, `UK`,
  `England`, `Holland`, `Ivory Coast`, former names such as `Swaziland`.
  Accents and curly apostrophes are ignored.
- Anything else — `United`, `America`, `Congo`, `Korea` — is **unmatched**. It
  is counted, shown as written with an "unmatched" tag, and listed under the
  country chart. It is never guessed into a country.

## Checking the figures in the D1 console

`tests/dashboard-sql.mjs` builds a real SQLite database from the migrations and
checks every figure against queries like these. On real data, run them in the
D1 console and compare with the dashboard on **All time**, no filters. The
console groups raw values, so add `GH` and `Ghana` together yourself.

```sql
SELECT COUNT(*) AS total FROM enquiries;

SELECT COUNT(*) AS this_month FROM enquiries
WHERE substr(created_at, 1, 7) = strftime('%Y-%m', 'now');

SELECT country, COUNT(*) AS n FROM enquiries GROUP BY country ORDER BY n DESC;

SELECT tour_interest, tour_name, COUNT(*) AS n FROM enquiries
GROUP BY tour_interest, tour_name ORDER BY n DESC;

SELECT group_size, COUNT(*) AS n FROM enquiries GROUP BY group_size;
SELECT budget_range, COUNT(*) AS n FROM enquiries GROUP BY budget_range;
SELECT accommodation, COUNT(*) AS n FROM enquiries GROUP BY accommodation;
SELECT traveling_with_children, COUNT(*) AS n FROM enquiries GROUP BY traveling_with_children;
SELECT contact_method, COUNT(*) AS n FROM enquiries GROUP BY contact_method;

SELECT
  SUM(',' || interests || ',' LIKE '%,culture-heritage,%') AS culture_heritage,
  SUM(',' || interests || ',' LIKE '%,food,%') AS food,
  SUM(',' || interests || ',' LIKE '%,history-ancestry,%') AS history_ancestry,
  SUM(',' || interests || ',' LIKE '%,nature-waterfalls,%') AS nature_waterfalls,
  SUM(',' || interests || ',' LIKE '%,wildlife,%') AS wildlife,
  SUM(',' || interests || ',' LIKE '%,adventure,%') AS adventure,
  SUM(',' || interests || ',' LIKE '%,beaches-relaxation,%') AS beaches_relaxation,
  SUM(',' || interests || ',' LIKE '%,nightlife,%') AS nightlife,
  SUM(',' || interests || ',' LIKE '%,community,%') AS community,
  SUM(',' || interests || ',' LIKE '%,photography,%') AS photography,
  SUM(',' || interests || ',' LIKE '%,shopping-crafts,%') AS shopping_crafts,
  SUM(',' || interests || ',' LIKE '%,not-sure,%') AS asked_to_recommend,
  SUM(interests = '') AS none_chosen
FROM enquiries;

SELECT
  CASE WHEN travel_date <> '' THEN 'exact date' WHEN travel_month = 'not-sure' THEN 'not sure yet'
       WHEN travel_month <> '' THEN 'rough month' ELSE 'no timing' END AS kind,
  COALESCE(NULLIF(substr(travel_date, 1, 7), ''), NULLIF(travel_month, 'not-sure')) AS month,
  COUNT(*) AS n
FROM enquiries GROUP BY kind, month ORDER BY month;

SELECT COUNT(*) AS custom_enquiries,
  SUM(trip_length_days <> '') AS gave_a_length,
  ROUND(AVG(CASE WHEN trip_length_days <> '' THEN CAST(trip_length_days AS INTEGER) END), 1) AS average_days,
  MIN(CASE WHEN trip_length_days <> '' THEN CAST(trip_length_days AS INTEGER) END) AS shortest,
  MAX(CASE WHEN trip_length_days <> '' THEN CAST(trip_length_days AS INTEGER) END) AS longest
FROM enquiries WHERE tour_interest = 'custom';

SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS n FROM enquiries GROUP BY month ORDER BY month;

SELECT reference, created_at, first_name, last_name FROM enquiries ORDER BY created_at DESC LIMIT 25;
```

## Test enquiries

Nothing is hidden or deleted automatically, and nothing on the dashboard
decides that an enquiry is a test. Known test enquiries — the owner's
production check `PP-K4ZG7P` among them — count like any other until the owner
chooses how to exclude them.

A rule that guesses — the name "Test", an `example.com` address, the owner's
own email — would sooner or later remove a real customer, so none is used. The
safe options, for the owner to choose between:

1. **An explicit exclusion list** (recommended for now): a Production variable
   such as `DASHBOARD_EXCLUDED_REFERENCES=PP-K4ZG7P,…`, read only by the
   figures Function. Excluded enquiries still appear in the list marked
   "Test", the page states how many figures exclude, and removing a reference
   restores it. No row changes.
2. **A `test` status**, set deliberately on each test enquiry once status
   workflows exist in a later phase. It changes a workflow field, never an
   answer.
