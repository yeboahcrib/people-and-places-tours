import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {accessFixture} from './dashboard-access-token.mjs';

/* Every figure on the dashboard, checked against a direct SQL query.
 *
 * A real SQLite database is built from the committed migrations — the same
 * files run on D1 — and filled with enquiries shaped like the production
 * table's history: typed countries from before the selector, ISO codes after
 * it, rows from before the four structured columns existed, the owner's own
 * test enquiry, and answers of every kind including "not sure" and none.
 *
 * The dashboard Function then reads that database through a D1-shaped adapter,
 * and each number it returns is compared with a query written independently,
 * in SQL, the way somebody checking the dashboard in the D1 console would.
 * The same queries are in docs/enquiry-dashboard.md for exactly that. */

const {onRequest: figuresRoute} = await import('../functions/api/dashboard/index.js');
const {onRequest: enquiryRoute} = await import('../functions/api/dashboard/enquiry.js');

const sqlite = new DatabaseSync(':memory:');
for (const file of ['0001_enquiries.sql', '0003_enquiry_structured_fields.sql']) {
  sqlite.exec(await readFile(new URL(`../migrations/${file}`, import.meta.url), 'utf8'));
}
assert.equal(sqlite.prepare("SELECT COUNT(*) AS n FROM pragma_table_info('enquiries')").get().n, 25, 'the migrations build the 25-column table');

const d1 = {
  prepare(sql) {
    let args = [];
    const statement = {
      bind(...values) { args = values; return statement; },
      async all() { return {results: sqlite.prepare(sql).all(...args).map(row => ({...row}))}; },
    };
    return statement;
  },
};

/* ── Enquiries ─────────────────────────────────────────────────────────── */

const now = new Date();
const today = now.toISOString().slice(0, 10);
const at = days => new Date(now.getTime() - days * 86_400_000).toISOString();
const month = offset => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7);

let serial = 0;
const enquiry = (days, fields) => ({
  id: `id-${++serial}`, reference: `PP-T${String(serial).padStart(5, '0')}`, created_at: at(days), status: 'new',
  source: 'Website inquiry', first_name: 'Guest', last_name: String(serial), email: `guest${serial}@example.com`,
  phone: '', country: 'GH', tour_interest: 'cape-coast', tour_name: 'Cape Coast Ancestral Tour', group_size: '3-5',
  travel_date: '', departure_date: '', date_flexibility: '', traveling_with_children: '', children_age_ranges: '',
  accommodation: '', contact_method: '', message: '', budget_range: '', interests: '', trip_length_days: '', travel_month: '',
  ...fields,
});

const ROWS = [
  // Before the selector and before the structured columns: typed countries, blanks.
  enquiry(400, {country: 'Ghana', travel_date: `${month(-10)}-03`, group_size: '', contact_method: 'email'}),
  enquiry(210, {country: 'ghana ', tour_interest: 'just-go-ghana', tour_name: 'Just Go Ghana', travel_date: `${month(-4)}-12`, accommodation: 'shared'}),
  enquiry(200, {country: 'United States', tour_interest: 'just-go-ghana', tour_name: 'Just Go Ghana', group_size: '2', travel_date: `${month(1)}-01`, accommodation: 'private', contact_method: 'whatsapp', phone: '+1 555 0100'}),
  enquiry(150, {country: 'USA', tour_interest: 'accra-food', tour_name: 'Accra After Dark Food Tour', group_size: 'solo'}),
  enquiry(120, {country: 'United', tour_interest: '', tour_name: '', group_size: '6-10', travel_date: '', travel_month: ''}),
  enquiry(100, {country: '', tour_interest: 'kumasi', tour_name: 'Kumasi Cultural Tour', group_size: '11-15', traveling_with_children: 'yes', children_age_ranges: '8–10'}),
  enquiry(95, {country: 'Nigeria', tour_interest: 'accra-city', tour_name: 'Accra City Tour'}),
  // After the selector and the structured columns.
  enquiry(60, {country: 'NG', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '15+', budget_range: 'over-5000', interests: 'history-ancestry,community', trip_length_days: '21', travel_month: month(4), accommodation: 'family', traveling_with_children: 'yes'}),
  enquiry(45, {country: 'GB', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: 'not-sure', budget_range: 'not-sure', interests: 'not-sure', trip_length_days: '', travel_month: 'not-sure', contact_method: 'email'}),
  enquiry(40, {country: 'US', tour_interest: 'open-to-ideas', tour_name: 'Open to ideas', budget_range: '3000-5000', interests: 'food,nightlife,photography', travel_date: `${month(2)}-20`, departure_date: `${month(2)}-28`, traveling_with_children: 'no'}),
  enquiry(29, {country: 'CA', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '2', budget_range: '1500-3000', interests: 'nature-waterfalls,wildlife,adventure', trip_length_days: '7', travel_date: `${month(25)}-05`, accommodation: 'private', contact_method: 'whatsapp'}),
  enquiry(20, {country: 'GH', tour_interest: 'accra-food', tour_name: 'Accra After Dark Food Tour', group_size: 'solo', budget_range: 'under-500', interests: 'food', travel_date: `${month(0)}-28`, traveling_with_children: 'no'}),
  enquiry(10, {country: 'US', tour_interest: 'cape-coast', group_size: '3-5', budget_range: '500-1500', interests: 'culture-heritage,history-ancestry', travel_month: month(18), contact_method: 'email'}),
  enquiry(4, {country: 'GH', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '6-10', budget_range: '1500-3000', interests: 'beaches-relaxation,shopping-crafts', trip_length_days: '14', travel_month: month(3), accommodation: 'shared'}),
  enquiry(1, {country: 'US', tour_interest: 'just-go-ghana', tour_name: 'Just Go Ghana', group_size: '3-5', budget_range: '', interests: '', travel_date: `${month(6)}-01`}),
  // The owner's production test, as it was stored on 14 September 2026.
  {...enquiry(0, {}), reference: 'PP-K4ZG7P', first_name: 'Test', last_name: 'Cutover', email: 'test.cutover@example.com', country: 'GH',
    tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '2', travel_month: '2027-03', trip_length_days: '10',
    budget_range: '1500-3000', interests: 'culture-heritage,food'},
];
const columns = Object.keys(ROWS[0]);
const insert = sqlite.prepare(`INSERT INTO enquiries (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`);
for (const row of ROWS) insert.run(...columns.map(column => row[column]));

/* ── Direct SQL ────────────────────────────────────────────────────────── */

// The dashboard's country rule written out for these rows. On real data the
// console query groups raw values and the reader adds GH and Ghana together.
const COUNTRY = `CASE
  WHEN upper(trim(country)) IN ('GH', 'GHANA') THEN 'GH'
  WHEN upper(trim(country)) IN ('US', 'USA', 'UNITED STATES') THEN 'US'
  WHEN upper(trim(country)) IN ('NG', 'NIGERIA') THEN 'NG'
  WHEN upper(trim(country)) IN ('GB') THEN 'GB'
  WHEN upper(trim(country)) IN ('CA') THEN 'CA'
  WHEN trim(country) = '' THEN 'none'
  ELSE 'raw:' || trim(country) END`;
const EXPERIENCE = "COALESCE(NULLIF(trim(tour_interest), ''), 'none')";

function where({from, to, country, experience}) {
  const clauses = [];
  const args = [];
  if (from) { clauses.push('substr(created_at, 1, 10) >= ?'); args.push(from); }
  if (to) { clauses.push('substr(created_at, 1, 10) <= ?'); args.push(to); }
  if (country) { clauses.push(`(${COUNTRY}) = ?`); args.push(country); }
  if (experience) { clauses.push(`${EXPERIENCE} = ?`); args.push(experience); }
  return {sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', args};
}
const scalar = (sql, args) => Object.values(sqlite.prepare(sql).get(...args))[0];
const grouped = (expression, filter) => {
  const {sql, args} = where(filter);
  return Object.fromEntries(sqlite.prepare(`SELECT ${expression} AS k, COUNT(*) AS n FROM enquiries ${sql} GROUP BY k`).all(...args).map(row => [row.k, row.n]));
};

/* ── Compare ───────────────────────────────────────────────────────────── */

const access = await accessFixture();
const restore = access.installCerts();
const read = async query => {
  const response = await figuresRoute({
    request: new Request(`https://preview.pages.dev/api/dashboard${query}`, {headers: {'Cf-Access-Jwt-Assertion': await access.token()}}),
    env: {...access.env, DB: d1},
  });
  assert.equal(response.status, 200, `${query} answered`);
  return response.json();
};

const addDays = (day, count) => new Date(Date.parse(`${day}T00:00:00Z`) + count * 86_400_000).toISOString().slice(0, 10);
const cases = [
  ['', {}],
  ['?range=30d', {from: addDays(today, -29), to: today}],
  ['?range=90d', {from: addDays(today, -89), to: today}],
  ['?range=12m', {from: `${month(-11)}-01`, to: today}],
  ['?country=GH', {country: 'GH'}],
  ['?country=US&range=90d', {country: 'US', from: addDays(today, -89), to: today}],
  ['?country=raw%3AUnited', {country: 'raw:United'}],
  ['?experience=custom', {experience: 'custom'}],
  [`?range=custom&from=${addDays(today, -200)}&to=${addDays(today, -40)}`, {from: addDays(today, -200), to: addDays(today, -40)}],
];

const comparisons = [];
try {
  for (const [query, filter] of cases) {
    const data = await read(query);
    const {sql, args} = where(filter);
    const label = query || '(all enquiries)';
    const check = (name, dashboard, direct) => {
      assert.deepEqual(dashboard, direct, `${label}: ${name} — dashboard ${JSON.stringify(dashboard)}, SQL ${JSON.stringify(direct)}`);
      comparisons.push(name);
    };

    const total = scalar(`SELECT COUNT(*) FROM enquiries ${sql}`, args);
    check('total', data.summary.total, total);

    // Leaders, ties included. Unmatched text is not a country; "Open to ideas"
    // and "Not selected" are not experiences.
    const leaders = rows => (rows.length ? rows.filter(row => row.n === rows[0].n).map(row => row.k).sort() : null);
    const COUNTRY_NAMES = {GH: 'Ghana', US: 'United States', NG: 'Nigeria', GB: 'United Kingdom', CA: 'Canada'};
    const TOUR_NAMES = Object.fromEntries(ROWS.map(row => [row.tour_interest, row.tour_name]));
    const topCountry = leaders(sqlite.prepare(`SELECT ${COUNTRY} AS k, COUNT(*) AS n FROM enquiries ${sql} GROUP BY k HAVING k <> 'none' AND k NOT LIKE 'raw:%' ORDER BY n DESC`).all(...args));
    check('top country', data.summary.topCountry ? [...data.summary.topCountry.labels].sort() : null, topCountry ? topCountry.map(code => COUNTRY_NAMES[code]).sort() : null);
    const topExperience = leaders(sqlite.prepare(`SELECT ${EXPERIENCE} AS k, COUNT(*) AS n FROM enquiries ${sql} GROUP BY k HAVING k NOT IN ('none', 'open-to-ideas') ORDER BY n DESC`).all(...args));
    check('most requested experience', data.summary.topExperience ? [...data.summary.topExperience.labels].sort() : null, topExperience ? topExperience.map(slug => TOUR_NAMES[slug]).sort() : null);

    const monthStart = `${today.slice(0, 7)}-01`;
    if (data.summary.thisMonth.inRange) {
      const {sql: monthSql, args: monthArgs} = where({...filter, from: filter.from && filter.from > monthStart ? filter.from : monthStart, to: filter.to && filter.to < today ? filter.to : today});
      check('this month', data.summary.thisMonth.count, scalar(`SELECT COUNT(*) FROM enquiries ${monthSql}`, monthArgs));
    }

    const byCountry = grouped(COUNTRY, filter);
    const dashboardCountries = Object.fromEntries([...data.countries.items.map(item => [item.key, item.count]),
      ...(data.countries.notProvided ? [['none', data.countries.notProvided]] : [])]);
    assert.equal(data.countries.other.count, 0, 'fewer than nine countries, so none are grouped as other');
    check('countries', dashboardCountries, byCountry);

    const byExperience = grouped(EXPERIENCE, filter);
    check('experiences', Object.fromEntries([...data.experiences.items.map(item => [item.key, item.count]),
      ...(data.experiences.notSelected ? [['none', data.experiences.notSelected]] : [])]), byExperience);

    for (const [name, column, figure, hasNotSure] of [
      ['group size', 'group_size', data.groupSize, true], ['budget', 'budget_range', data.budget, true],
      ['accommodation', 'accommodation', data.accommodation, false], ['children', 'traveling_with_children', data.children, false],
      ['contact method', 'contact_method', data.contact, false],
    ]) {
      const direct = grouped(`trim(${column})`, filter);
      const dashboard = Object.fromEntries([
        ...figure.items.filter(item => item.count).map(item => [item.key, item.count]),
        ...(hasNotSure && figure.notSure ? [['not-sure', figure.notSure]] : []),
        ...(figure.blank ? [['', figure.blank]] : []),
      ]);
      check(name, dashboard, direct);
    }

    for (const item of data.interests.items) {
      check(`interest ${item.key}`, item.count, scalar(`SELECT COUNT(*) FROM enquiries ${sql ? `${sql} AND` : 'WHERE'} ',' || interests || ',' LIKE ?`, [...args, `%,${item.key},%`]));
    }
    check('interests: asked us to recommend', data.interests.recommend, scalar(`SELECT COUNT(*) FROM enquiries ${sql ? `${sql} AND` : 'WHERE'} ',' || interests || ',' LIKE '%,not-sure,%'`, args));
    check('interests: none chosen', data.interests.none, scalar(`SELECT COUNT(*) FROM enquiries ${sql ? `${sql} AND` : 'WHERE'} trim(interests) = ''`, args));

    // The migration's own expression for one travel month per enquiry.
    const TRAVEL = "COALESCE(NULLIF(substr(travel_date, 1, 7), ''), travel_month)";
    const travel = grouped(`CASE WHEN travel_date <> '' THEN 'exact:' ELSE 'rough:' END || ${TRAVEL}`, filter);
    const dashboardTravel = {};
    const bump = (key, count) => { if (count) dashboardTravel[key] = (dashboardTravel[key] || 0) + count; };
    for (const point of data.travel.points) { bump(`exact:${point.month}`, point.exact); bump(`rough:${point.month}`, point.approximate); }
    const outside = Object.entries(travel).filter(([key]) => /:\d{4}-\d{2}$/.test(key) && (key.slice(-7) < data.travel.points[0].month || key.slice(-7) > data.travel.points.at(-1).month));
    for (const [key, count] of outside) bump(key, count);
    assert.equal(outside.filter(([key]) => key.slice(-7) < data.travel.points[0].month).reduce((sum, [, count]) => sum + count, 0),
      data.travel.earlier.exact + data.travel.earlier.approximate, `${label}: travel before this month`);
    assert.equal(outside.filter(([key]) => key.slice(-7) > data.travel.points.at(-1).month).reduce((sum, [, count]) => sum + count, 0),
      data.travel.later.exact + data.travel.later.approximate, `${label}: travel beyond the window`);
    bump('rough:not-sure', data.travel.notSure);
    bump('rough:', data.travel.blank);
    check('travel months', dashboardTravel, travel);

    const {sql: customSql, args: customArgs} = where({...filter, experience: 'custom'});
    const lengths = sqlite.prepare(`SELECT COUNT(*) AS n, AVG(CAST(trip_length_days AS INTEGER)) AS mean, MIN(CAST(trip_length_days AS INTEGER)) AS lo, MAX(CAST(trip_length_days AS INTEGER)) AS hi
      FROM enquiries ${customSql} AND trip_length_days <> ''`).get(...customArgs);
    const median = sqlite.prepare(`SELECT AVG(d) AS m FROM (SELECT CAST(trip_length_days AS INTEGER) AS d FROM enquiries ${customSql} AND trip_length_days <> ''
      ORDER BY d LIMIT 2 - (SELECT COUNT(*) FROM enquiries ${customSql} AND trip_length_days <> '') % 2
      OFFSET (SELECT (COUNT(*) - 1) / 2 FROM enquiries ${customSql} AND trip_length_days <> ''))`).get(...customArgs, ...customArgs, ...customArgs);
    check('custom trips', data.tripLength.applicable, scalar(`SELECT COUNT(*) FROM enquiries ${customSql}`, customArgs));
    check('trip length given', data.tripLength.given, lengths.n);
    check('trip length average', data.tripLength.mean, lengths.n ? Math.round(lengths.mean * 10) / 10 : null);
    check('trip length median', data.tripLength.median, lengths.n ? median.m : null);
    check('trip length range', [data.tripLength.min, data.tripLength.max], lengths.n ? [lengths.lo, lengths.hi] : [null, null]);

    const weekly = data.timeline.granularity === 'week';
    const period = weekly ? "date(substr(created_at, 1, 10), 'weekday 0', '-6 days')" : 'substr(created_at, 1, 7)';
    check('over time', Object.fromEntries(data.timeline.points.filter(point => point.count).map(point => [point.period, point.count])), grouped(period, filter));

    const recent = sqlite.prepare(`SELECT reference, first_name || ' ' || last_name AS name FROM enquiries ${sql} ORDER BY created_at DESC LIMIT 25`).all(...args);
    check('recent enquiries', data.recent.items.map(item => [item.reference, item.name]), recent.map(row => [row.reference, row.name]));
  }

  // The owner's test enquiry, read back in full.
  const response = await enquiryRoute({
    request: new Request('https://preview.pages.dev/api/dashboard/enquiry?reference=PP-K4ZG7P', {headers: {'Cf-Access-Jwt-Assertion': await access.token()}}),
    env: {...access.env, DB: d1},
  });
  const {enquiry: detail} = await response.json();
  const stored = sqlite.prepare("SELECT * FROM enquiries WHERE reference = 'PP-K4ZG7P'").get();
  assert.equal(detail.traveler.email, stored.email);
  assert.equal(detail.trip.experience.value, stored.tour_name);
  assert.deepEqual(detail.trip.timing, {kind: 'approximate', month: 'March 2027'});
  assert.deepEqual(detail.trip.tripLength, {value: `${stored.trip_length_days} days`});
  assert.deepEqual(detail.preferences.budget, {value: '$1,500 – $3,000'});
  assert.deepEqual(detail.preferences.interests.items, ['Culture & heritage', 'Food']);
  assert.equal(detail.record.receivedAt, stored.created_at);
} finally {
  restore();
}

console.log(`Dashboard figures match direct SQL (${comparisons.length} comparisons across ${cases.length} filter combinations, ${ROWS.length} enquiries).`);
