import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {accessFixture, projectingDb} from './dashboard-access-token.mjs';

// The dashboard's two endpoints: who gets in, what they are given, and that
// nothing personal leaves the server except on the one request that must.

const figuresRoute = await import('../functions/api/dashboard/index.js');
const enquiryRoute = await import('../functions/api/dashboard/enquiry.js');
const {normaliseCountry, ANALYTIC_COLUMNS, DETAIL_COLUMNS} = await import('../src/dashboard/analytics.mjs');
const fields = await import('../src/dashboard/fields.mjs');

const access = await accessFixture();
const base = 'https://enquiry-dashboard.people-and-places-tours.pages.dev';
const request = (path, jwt, method = 'GET') => new Request(`${base}${path}`, {
  method, headers: jwt ? {'Cf-Access-Jwt-Assertion': jwt} : {},
});

const now = new Date();
const daysAgo = count => new Date(now.getTime() - count * 86_400_000).toISOString();
const monthsAhead = count => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + count, 1)).toISOString().slice(0, 7);

const ROWS = [
  {id: 'a', reference: 'PP-K4ZG7P', created_at: daysAgo(0), status: 'new', source: 'Website inquiry',
    first_name: 'Test', last_name: 'Cutover', email: 'test.cutover@example.com', phone: '+233 20 000 0000',
    country: 'GH', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '2',
    travel_date: '', departure_date: '', travel_month: monthsAhead(6), date_flexibility: '', traveling_with_children: 'no',
    children_age_ranges: '', accommodation: 'private', contact_method: 'email', message: 'Private message text',
    budget_range: '1500-3000', interests: 'culture-heritage,food', trip_length_days: '10'},
  {id: 'b', reference: 'PP-3ED8JU', created_at: daysAgo(3), status: 'new', source: 'Website inquiry',
    first_name: 'Albert', last_name: 'Mensah', email: 'albert@example.com', phone: '',
    country: 'Ghana', tour_interest: 'accra-food', tour_name: 'Accra After Dark Food Tour', group_size: '3-5',
    travel_date: `${monthsAhead(2)}-14`, departure_date: `${monthsAhead(2)}-20`, travel_month: '', date_flexibility: 'yes',
    traveling_with_children: 'yes', children_age_ranges: 'Ages 4 and 9', accommodation: '', contact_method: 'whatsapp',
    message: '', budget_range: '', interests: '', trip_length_days: ''},
  {id: 'c', reference: 'PP-UNITED', created_at: daysAgo(40), status: 'new', source: 'Website inquiry',
    first_name: 'Legacy', last_name: 'Row', email: 'legacy@example.com', phone: '',
    country: 'United', tour_interest: '', tour_name: '', group_size: '', travel_date: '', departure_date: '',
    travel_month: '', date_flexibility: '', traveling_with_children: '', children_age_ranges: '', accommodation: '',
    contact_method: '', message: '', budget_range: '', interests: '', trip_length_days: ''},
];

const restore = access.installCerts();
try {
  for (const [route, path] of [[figuresRoute, '/api/dashboard'], [enquiryRoute, '/api/dashboard/enquiry?reference=PP-K4ZG7P']]) {
    let response = await route.onRequest({request: request(path, await access.token(), 'POST'), env: {...access.env, DB: projectingDb(ROWS)}});
    assert.equal(response.status, 405, `${path}: only GET`);

    for (const [label, jwt, environment] of await access.refusals()) {
      const db = projectingDb(ROWS);
      response = await route.onRequest({request: request(path, jwt), env: {...(environment || access.env), DB: db}});
      assert.equal(response.status, 401, `${path}: ${label} must be refused`);
      const body = await response.json();
      assert.deepEqual(body, {error: 'This dashboard is private.'}, `${path}: a refusal must not say why`);
      assert.equal(db.statements.length, 0, `${path}: ${label} must not reach the database at all`);
      assert.equal(response.headers.get('Cache-Control'), 'no-store');
    }

    // A refusal does not say why, but the log does, and "alg: none" must be
    // refused for its algorithm before any key is consulted — not merely
    // because the signature then happens not to verify.
    const logged = [];
    const warn = console.warn;
    console.warn = (message, detail) => logged.push(detail?.reason);
    try {
      const unsigned = (await access.refusals()).find(([label]) => label === 'alg: none')[1];
      await route.onRequest({request: request(path, unsigned), env: {...access.env, DB: projectingDb(ROWS)}});
    } finally { console.warn = warn; }
    assert.deepEqual(logged, ['unexpected-algorithm'], `${path}: alg none is refused for its algorithm`);

    // No database is a deployment fault, reported only to somebody already in.
    response = await route.onRequest({request: request(path, await access.token()), env: {...access.env}});
    assert.equal(response.status, 503, `${path}: no binding`);
  }

  /* ── Figures ────────────────────────────────────────────────────────── */
  {
    const db = projectingDb(ROWS);
    const response = await figuresRoute.onRequest({request: request('/api/dashboard', await access.token()), env: {...access.env, DB: db}});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const data = await response.json();

    const [analytic, names, ...rest] = db.statements;
    assert.equal(rest.length, 0, 'two statements: the figures and the names on the recent list');
    const selected = sql => sql.match(/^SELECT\s+(.+?)\s+FROM/is)[1].split(',').map(name => name.trim());
    assert.deepEqual(selected(analytic.sql), ANALYTIC_COLUMNS);
    for (const personal of ['email', 'phone', 'message', 'first_name', 'last_name', 'children_age_ranges', 'id']) {
      assert(!selected(analytic.sql).includes(personal), `the figures must never select ${personal}`);
    }
    assert.deepEqual(selected(names.sql), ['reference', 'created_at', 'first_name', 'last_name'],
      'the second statement reads names and nothing more');
    assert.match(names.sql, /WHERE reference IN \((\?, )*\?\)$/, 'references are bound, never spliced into SQL');
    assert(names.args.length <= 25, 'names are read only for the enquiries being listed');
    assert(!db.statements.some(({sql}) => /SELECT\s+\*/i.test(sql)), 'no statement selects every column');

    const serialised = JSON.stringify(data);
    for (const secret of ['@', 'Private message text', '+233', 'Ages 4 and 9']) {
      assert(!serialised.includes(secret), `the figures payload must not carry ${secret}`);
    }
    assert.deepEqual(Object.keys(data.recent.items[0]).sort(),
      ['country', 'countryUnmatched', 'createdAt', 'experience', 'groupSize', 'name', 'reference', 'status', 'timing']);
    assert.equal(data.recent.items[0].name, 'Test Cutover');
    // Names appear only beside the enquiries being listed, never in a figure.
    const {recent, ...aggregate} = data;
    for (const name of ['Test', 'Cutover', 'Albert', 'Mensah', 'Legacy']) {
      assert(!JSON.stringify(aggregate).includes(name), `no figure may carry the name "${name}"`);
    }

    assert.equal(data.summary.total, 3);
    assert.deepEqual(data.summary.topCountry, {labels: ['Ghana'], count: 2}, '"GH" and "Ghana" are one country');
    assert.deepEqual(data.countries.unmatched, [{label: 'United', count: 1}], '"United" is not guessed at');
    assert.equal(data.options.countries.find(item => item.key === 'raw:United').unmatched, true);
    assert.equal(data.travel.points.length, 19, 'planned travel covers this month and the 18 after it, as the form does');
    assert.equal(data.travel.points[0].month, monthsAhead(0));
    assert.equal(data.travel.points.at(-1).month, monthsAhead(18));
  }

  /* ── Filters narrow every figure together ───────────────────────────── */
  for (const [query, expected] of [
    ['?country=GH', 2],
    ['?country=raw%3AUnited', 1],
    ['?experience=custom', 1],
    ['?experience=none', 1],
    ['?range=30d', 2],
    ['?range=custom&from=2000-01-01&to=2000-12-31', 0],
    ['?country=%27%20OR%201%3D1', 3],
    ['?range=nonsense&recent=9999', 3],
  ]) {
    const response = await figuresRoute.onRequest({request: request(`/api/dashboard${query}`, await access.token()), env: {...access.env, DB: projectingDb(ROWS)}});
    const data = await response.json();
    assert.equal(data.summary.total, expected, `${query} narrows to ${expected}`);
    const sum = items => items.reduce((total, item) => total + item.count, 0);
    for (const key of ['groupSize', 'budget']) {
      const figure = data[key];
      assert.equal(sum(figure.items) + figure.notSure + figure.blank + sum(figure.other), expected, `${query}: ${key} accounts for every enquiry`);
    }
    for (const key of ['accommodation', 'children', 'contact']) {
      const figure = data[key];
      assert.equal(sum(figure.items) + figure.blank + sum(figure.other), expected, `${query}: ${key} accounts for every enquiry`);
    }
    assert.equal(sum(data.countries.items) + data.countries.other.count + data.countries.notProvided, expected, `${query}: countries`);
    assert.equal(sum(data.experiences.items) + data.experiences.notSelected, expected, `${query}: experiences`);
    const travel = data.travel;
    assert.equal(travel.points.reduce((total, point) => total + point.exact + point.approximate, 0)
      + travel.earlier.exact + travel.earlier.approximate + travel.later.exact + travel.later.approximate
      + travel.notSure + travel.blank + travel.other, expected, `${query}: travel timing`);
    assert.equal(sum(data.timeline.points), expected, `${query}: the timeline counts the same enquiries`);
    assert.equal(data.recent.total, expected, `${query}: the list counts the same enquiries`);
    assert(data.recent.limit === 25, 'the list is bounded whatever the URL asks for');
  }

  /* ── One enquiry ────────────────────────────────────────────────────── */
  {
    let db = projectingDb(ROWS);
    let response = await enquiryRoute.onRequest({request: request('/api/dashboard/enquiry?reference=PP-K4ZG7P', await access.token()), env: {...access.env, DB: db}});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const {enquiry, sharedReference} = await response.json();
    assert.equal(sharedReference, false);
    assert.equal(db.statements.length, 1);
    assert.deepEqual(db.statements[0].sql.match(/^SELECT\s+(.+?)\s+FROM/is)[1].split(',').map(name => name.trim()), DETAIL_COLUMNS);
    assert(!DETAIL_COLUMNS.includes('id'), 'the idempotency key is not part of the record');
    assert.match(db.statements[0].sql, /WHERE reference = \? ORDER BY created_at DESC LIMIT 2$/);
    assert.deepEqual(db.statements[0].args, ['PP-K4ZG7P']);

    assert.equal(enquiry.traveler.name, 'Test Cutover');
    assert.equal(enquiry.traveler.email, 'test.cutover@example.com');
    assert.deepEqual(enquiry.traveler.country, {value: 'Ghana', unmatched: false});
    assert.deepEqual(enquiry.trip.timing, {kind: 'approximate', month: new Date(`${monthsAhead(6)}-01T00:00:00Z`).toLocaleString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'})});
    assert.deepEqual(enquiry.trip.tripLength, {value: '10 days'});
    assert.deepEqual(enquiry.preferences.budget, {value: '$1,500 – $3,000'});
    assert.deepEqual(enquiry.preferences.interests.items, ['Culture & heritage', 'Food']);
    assert.equal(enquiry.message, 'Private message text');
    assert.deepEqual(enquiry.trip.flexibility, {value: fields.BLANK.flexibility.label, missing: true});

    response = await enquiryRoute.onRequest({request: request('/api/dashboard/enquiry?reference=PP-3ED8JU', await access.token()), env: {...access.env, DB: projectingDb(ROWS)}});
    const albert = (await response.json()).enquiry;
    assert.equal(albert.trip.tripLength, null, 'trip length is not a question on a day tour, so it is not shown as unanswered');
    assert.equal(albert.trip.timing.kind, 'exact');
    assert.deepEqual(albert.preferences.budget, {value: 'No answer', missing: true});
    assert.equal(albert.trip.children.ages, 'Ages 4 and 9');

    response = await enquiryRoute.onRequest({request: request('/api/dashboard/enquiry?reference=PP-UNITED', await access.token()), env: {...access.env, DB: projectingDb(ROWS)}});
    const legacy = (await response.json()).enquiry;
    assert.deepEqual(legacy.traveler.country, {value: 'United', unmatched: true});
    assert.deepEqual(legacy.trip.groupSize, {value: 'Not recorded', missing: true});
    assert.equal(legacy.trip.timing.kind, 'blank');

    for (const [query, status] of [['', 400], ['?reference=%27%20OR%201%3D1', 400], ['?reference=PP-NOPE99', 404]]) {
      db = projectingDb(ROWS);
      response = await enquiryRoute.onRequest({request: request(`/api/dashboard/enquiry${query}`, await access.token()), env: {...access.env, DB: db}});
      assert.equal(response.status, status, `detail ${query || '(no reference)'} is ${status}`);
      if (status === 400) assert.equal(db.statements.length, 0, 'a malformed reference never reaches the database');
    }

    const twins = [...ROWS, {...ROWS[0], id: 'z', created_at: daysAgo(1)}];
    response = await enquiryRoute.onRequest({request: request('/api/dashboard/enquiry?reference=pp-k4zg7p', await access.token()), env: {...access.env, DB: projectingDb(twins)}});
    assert.equal((await response.json()).sharedReference, true, 'a reference shared by two enquiries is said to be shared');
  }
} finally {
  restore();
}

/* ── The dashboard reads the form's own vocabulary ────────────────────── */
{
  const html = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
  const optionsOf = id => {
    const select = html.match(new RegExp(`<select[^>]*id="${id}"[^>]*>([\\s\\S]*?)</select>`))[1];
    return [...select.matchAll(/<option value="([^"]*)"[^>]*>([^<]*)</g)].map(([, value, label]) => [value, label.replace(/&amp;/g, '&')]);
  };
  const known = (pairs, extra = []) => new Set([...pairs.map(([key]) => key), ...extra, '']);
  for (const [id, pairs, extra] of [
    ['group-size', fields.GROUP_SIZES, ['not-sure']],
    ['budget-range', fields.BUDGET_RANGES, ['not-sure']],
    ['accommodation', fields.ACCOMMODATION],
    ['traveling-with-children', fields.CHILDREN],
    ['contact-method', fields.CONTACT_METHODS],
    ['date-flexibility', fields.DATE_FLEXIBILITY],
  ]) {
    const values = optionsOf(id);
    assert(values.length, `${id} options were found in the form`);
    for (const [value] of values) assert(known(pairs, extra).has(value), `the dashboard does not know the form's ${id} value "${value}"`);
    for (const [key] of pairs) assert(values.some(([value]) => value === key), `the dashboard's ${id} value "${key}" is not on the form`);
  }
  for (const id of ['budget-range', 'accommodation', 'contact-method']) {
    const pairs = {'budget-range': fields.BUDGET_RANGES, accommodation: fields.ACCOMMODATION, 'contact-method': fields.CONTACT_METHODS}[id];
    for (const [key, label] of pairs) assert.equal(optionsOf(id).find(([value]) => value === key)[1], label, `${id} "${key}" reads as the form does`);
  }
  const boxes = [...html.matchAll(/name="interests" value="([^"]+)" \/><span>([^<]+)</g)].map(([, value, label]) => [value, label.replace(/&amp;/g, '&')]);
  assert.deepEqual(boxes.filter(([value]) => value !== 'not-sure'), fields.INTERESTS, 'interests match the form, in the form\'s order');
}

/* ── Normalisation, directly ──────────────────────────────────────────── */
assert.deepEqual(normaliseCountry('GH'), {code: 'GH', label: 'Ghana', resolved: true});
assert.deepEqual(normaliseCountry('  ghana '), {code: 'GH', label: 'Ghana', resolved: true});
assert.deepEqual(normaliseCountry('USA'), {code: 'US', label: 'United States', resolved: true});
assert.deepEqual(normaliseCountry('U.K.'), {code: 'GB', label: 'United Kingdom', resolved: true});
assert.deepEqual(normaliseCountry('the netherlands'), {code: 'NL', label: 'Netherlands', resolved: true});
assert.equal(normaliseCountry("Cote d'Ivoire").code, 'CI', 'accents and apostrophes are not what makes a country');
for (const ambiguous of ['United', 'America', 'Congo', 'Korea', 'Nowhere']) {
  assert.equal(normaliseCountry(ambiguous).resolved, false, `"${ambiguous}" has more than one honest reading and must stay unmatched`);
  assert.equal(normaliseCountry(ambiguous).label, ambiguous, 'an unmatched value keeps its own text');
}
assert.equal(normaliseCountry('').label, 'Not provided');

console.log('Dashboard function tests passed.');
