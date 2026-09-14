import {COUNTRIES, countryName} from '../data/countries.mjs';
import {
  ACCOMMODATION, BLANK, BUDGET_NOT_SURE, BUDGET_RANGES, CHILDREN, CONTACT_METHODS, DATE_FLEXIBILITY,
  GROUP_NOT_SURE, GROUP_SIZES, INTERESTS, INTERESTS_NOT_SURE, NOT_SURE, TIMING_NOT_SURE, labelFrom,
} from './fields.mjs';

/* Enquiry figures for the internal dashboard, computed from rows.
 *
 * One pass over one set of rows produces every figure on the page, so a
 * filter narrows the headline numbers and every chart together and no two
 * panels can disagree about which enquiries they describe.
 *
 * Pure: no database, no clock except the `now` it is handed. The Function
 * supplies the rows; tests/dashboard-sql.mjs supplies the same rows from a
 * real SQLite database and checks every figure against a direct SQL query. */

/* ── Country normalisation ────────────────────────────────────────────────
   Rows written before the selector hold whatever was typed; rows written
   since hold an ISO alpha-2 code. They are reconciled when the figures are
   read and never in the table: the row is what somebody actually said.

   Only deterministic matches. An exact country name, an ISO code, or a name
   with one unambiguous meaning ("UK", "Holland", a country's former name).
   Anything else — "United", "Congo", "Korea" — keeps its own text and is
   reported as unmatched rather than guessed at. */

const fold = value => String(value || '').normalize('NFD').replace(/\p{M}/gu, '')
  .replace(/[’‘`]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();

const NAME_TO_CODE = new Map(COUNTRIES.map(({code, name}) => [fold(name), code]));

const ALIASES = new Map(Object.entries({
  'usa': 'US', 'u.s.': 'US', 'u.s.a.': 'US', 'u.s': 'US', 'united states of america': 'US',
  'uk': 'GB', 'u.k.': 'GB', 'u.k': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'britain': 'GB', 'great britain': 'GB', 'northern ireland': 'GB',
  'holland': 'NL', 'the netherlands': 'NL', 'ivory coast': 'CI', "cote d'ivoire": 'CI',
  'cape verde': 'CV', 'cape verde islands': 'CV',
  'south korea': 'KR', 'republic of korea': 'KR', 'north korea': 'KP', 'russia': 'RU', 'vietnam': 'VN',
  'uae': 'AE', 'united arab emirates': 'AE', 'drc': 'CD', 'dr congo': 'CD',
  'democratic republic of the congo': 'CD', 'republic of the congo': 'CG',
  'czech republic': 'CZ', 'swaziland': 'SZ', 'burma': 'MM', 'macedonia': 'MK',
  'turkey': 'TR', 'east timor': 'TL',
}));

/** One country value, as a code where that can be established honestly. */
export function normaliseCountry(raw) {
  const value = String(raw || '').trim();
  if (!value) return {code: '', label: BLANK.country.label, resolved: false};

  const upper = value.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && COUNTRIES.some(country => country.code === upper)) {
    return {code: upper, label: countryName(upper), resolved: true};
  }

  const key = fold(value);
  const code = NAME_TO_CODE.get(key) || ALIASES.get(key) || NAME_TO_CODE.get(key.replace(/^the /, ''));
  if (code) return {code, label: countryName(code), resolved: true};

  return {code: '', label: value, resolved: false};
}

/* ── What is read ─────────────────────────────────────────────────────────
   Named one by one, so adding a column to the table can never widen what the
   figures are built from. No name, email, phone, message or children's ages:
   the aggregate view does not need them, so it never selects them. */

export const ANALYTIC_COLUMNS = [
  'reference', 'created_at', 'status', 'country', 'tour_interest', 'tour_name',
  'group_size', 'travel_date', 'travel_month', 'trip_length_days', 'accommodation',
  'traveling_with_children', 'contact_method', 'budget_range', 'interests',
];

// Everything on one enquiry except its idempotency key. Read only when
// somebody opens that enquiry.
export const DETAIL_COLUMNS = [
  'reference', 'created_at', 'status', 'source', 'first_name', 'last_name', 'email', 'phone',
  'country', 'tour_interest', 'tour_name', 'group_size', 'travel_date', 'departure_date',
  'date_flexibility', 'traveling_with_children', 'children_age_ranges', 'accommodation',
  'contact_method', 'message', 'budget_range', 'interests', 'trip_length_days', 'travel_month',
];

/* ── Dates, in UTC ────────────────────────────────────────────────────────
   Enquiries are stamped in UTC, and Ghana keeps UTC all year, so a UTC day is
   the business's own day. */

const DAY_MS = 86_400_000;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LONG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'];

const isoDay = date => date.toISOString().slice(0, 10);
export function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || isoDay(date) !== value ? null : date;
}
const addDays = (day, count) => isoDay(new Date(parseDay(day).getTime() + count * DAY_MS));
const addMonths = (month, count) => {
  const [year, index] = month.split('-').map(Number);
  return new Date(Date.UTC(year, index - 1 + count, 1)).toISOString().slice(0, 7);
};
const mondayOf = day => addDays(day, -((parseDay(day).getUTCDay() + 6) % 7));
const shortMonth = month => `${MONTH_NAMES[Number(month.slice(5, 7)) - 1]} ${month.slice(2, 4)}`;
export const monthLabel = (month, long = false) => {
  const [year, index] = month.split('-').map(Number);
  return `${(long ? LONG_MONTHS : MONTH_NAMES)[index - 1]} ${year}`;
};
const dayLabel = day => {
  const date = parseDay(day);
  return `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
};

/* ── Filters ──────────────────────────────────────────────────────────────
   Three, and only three: when, from where, for what. Anything malformed is
   ignored rather than trusted, so a hand-edited URL narrows nothing it should
   not. */

export const RANGES = [
  ['all', 'All time'],
  ['30d', 'Last 30 days'],
  ['90d', 'Last 90 days'],
  ['12m', 'Last 12 months'],
  ['ytd', 'This year'],
  ['custom', 'Custom dates'],
];

const CONTROL = /[\x00-\x1f\x7f]/;

export function parseFilters(params, now = new Date()) {
  const get = name => String(params.get(name) || '').trim();
  const today = isoDay(now);
  let range = RANGES.some(([key]) => key === get('range')) ? get('range') : 'all';
  let from = null;
  let to = null;
  if (range === '30d') from = addDays(today, -29);
  else if (range === '90d') from = addDays(today, -89);
  else if (range === '12m') from = `${addMonths(today.slice(0, 7), -11)}-01`;
  else if (range === 'ytd') from = `${today.slice(0, 4)}-01-01`;
  else if (range === 'custom') {
    from = parseDay(get('from')) ? get('from') : null;
    to = parseDay(get('to')) ? get('to') : null;
    if (from && to && from > to) [from, to] = [to, from];
    if (!from && !to) range = 'all';
  }
  if (range !== 'all' && range !== 'custom') to = today;

  const rawCountry = get('country');
  const country = /^(?:[A-Z]{2}|none|raw:.{1,100})$/.test(rawCountry) && !CONTROL.test(rawCountry) ? rawCountry : '';
  const experience = /^(?:[a-z0-9-]{1,60}|none)$/.test(get('experience')) ? get('experience') : '';
  const recentLimit = [25, 50, 100].includes(Number(get('recent'))) ? Number(get('recent')) : 25;
  return {range, from, to, country, experience, recentLimit};
}

/* ── Helpers ──────────────────────────────────────────────────────────── */

const text = value => String(value ?? '').trim();
const byCount = (a, b) => b.count - a.count || a.label.localeCompare(b.label);

function tally(items, keyOf, describe) {
  const totals = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const entry = totals.get(key) || {key, count: 0, ...describe(item, key)};
    entry.count += 1;
    totals.set(key, entry);
  }
  return [...totals.values()];
}

// The leader, and everyone level with it. A tie is reported as a tie.
function leader(items) {
  const ranked = [...items].sort(byCount);
  if (!ranked.length) return null;
  const top = ranked[0].count;
  return {labels: ranked.filter(item => item.count === top).map(item => item.label), count: top};
}

/* The median of ordered ranges is meaningful — half the stated answers fall
   at or below it. Their mean is not: "3–5 people" has no arithmetic. When
   the two middle answers sit in different ranges, both are named. */
function ordinalMedian(items, stated) {
  if (!stated) return null;
  const at = position => {
    let seen = 0;
    for (const item of items) {
      seen += item.count;
      if (seen >= position) return item.label;
    }
    return null;
  };
  const lower = at(Math.floor((stated + 1) / 2));
  const upper = at(Math.ceil((stated + 1) / 2));
  return lower === upper ? lower : `${lower} to ${upper}`;
}

// A single-choice question: every stated answer (zeros kept), the explicit
// "not sure", the blanks, and anything the vocabulary does not know — each in
// its own place, never folded into another.
function distribution(view, column, pairs, {notSure = false, ordered = false} = {}) {
  const counts = new Map(pairs.map(([key]) => [key, 0]));
  const other = new Map();
  let unsure = 0;
  let blank = 0;
  for (const {row} of view) {
    const value = text(row[column]);
    if (!value) blank += 1;
    else if (notSure && value === NOT_SURE) unsure += 1;
    else if (counts.has(value)) counts.set(value, counts.get(value) + 1);
    else other.set(value, (other.get(value) || 0) + 1);
  }
  const items = pairs.map(([key, label]) => ({key, label, count: counts.get(key)}));
  const stated = items.reduce((sum, item) => sum + item.count, 0);
  return {
    base: view.length,
    items,
    stated,
    ...(notSure ? {notSure: unsure} : {}),
    blank,
    other: [...other].map(([label, count]) => ({label, count})).sort(byCount),
    ...(ordered ? {median: ordinalMedian(items, stated)} : {}),
  };
}

function timingOf(row) {
  const date = text(row.travel_date);
  if (parseDay(date)) return {kind: 'exact', month: date.slice(0, 7), date};
  const month = text(row.travel_month);
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return {kind: 'approximate', month};
  if (month === NOT_SURE) return {kind: 'not-sure'};
  if (!date && !month) return {kind: 'blank'};
  return {kind: 'other'};
}

const TRIP_BUCKETS = [['1–3 days', 1, 3], ['4–7 days', 4, 7], ['8–14 days', 8, 14], ['15–21 days', 15, 21], ['22+ days', 22, Infinity]];

/* ── Figures ──────────────────────────────────────────────────────────── */

export function buildFigures(rows, filters, now = new Date()) {
  const today = isoDay(now);
  const currentMonth = today.slice(0, 7);

  const all = rows.map(row => {
    const rawCountry = text(row.country);
    const country = normaliseCountry(rawCountry);
    return {
      row,
      day: text(row.created_at).slice(0, 10),
      countryKey: country.code || (rawCountry ? `raw:${country.label}` : 'none'),
      countryLabel: country.label,
      countryUnmatched: Boolean(rawCountry) && !country.resolved,
      experienceKey: text(row.tour_interest) || 'none',
    };
  }).sort((a, b) => text(b.row.created_at).localeCompare(text(a.row.created_at))
    || text(b.row.reference).localeCompare(text(a.row.reference)));

  // A tour's name as it read on its most recent enquiry, so a renamed tour
  // reads as it does now and an old enquiry still counts under the same tour.
  const experienceNames = new Map();
  for (const entry of all) {
    const name = text(entry.row.tour_name);
    if (name && !experienceNames.has(entry.experienceKey)) experienceNames.set(entry.experienceKey, name);
  }
  const experienceLabel = key => (key === 'none' ? BLANK.experience.label : experienceNames.get(key) || key);

  const describeCountry = entry => ({label: entry.countryLabel, unmatched: entry.countryUnmatched});
  const describeExperience = (entry, key) => ({label: experienceLabel(key)});

  const options = {
    countries: tally(all, entry => entry.countryKey, describeCountry).sort(byCount),
    experiences: tally(all, entry => entry.experienceKey, describeExperience).sort(byCount),
  };

  const view = all.filter(entry => (!filters.from || entry.day >= filters.from)
    && (!filters.to || entry.day <= filters.to)
    && (!filters.country || entry.countryKey === filters.country)
    && (!filters.experience || entry.experienceKey === filters.experience));
  const total = view.length;

  /* Headline */
  const monthStart = `${currentMonth}-01`;
  const monthInRange = (!filters.from || filters.from <= today) && (!filters.to || filters.to >= monthStart);
  const countries = tally(view, entry => entry.countryKey, describeCountry).sort(byCount);
  const experiences = tally(view, entry => entry.experienceKey, describeExperience).sort(byCount);

  const summary = {
    total,
    thisMonth: {
      month: currentMonth,
      label: monthLabel(currentMonth, true),
      inRange: monthInRange,
      count: monthInRange ? view.filter(entry => entry.day >= monthStart && entry.day <= today).length : null,
    },
    // Unmatched text is not a country, and a missing answer is not a place.
    topCountry: leader(countries.filter(item => item.key !== 'none' && !item.unmatched)),
    // "Open to ideas" is a real answer but not an experience anyone asked for.
    topExperience: leader(experiences.filter(item => item.key !== 'none' && item.key !== 'open-to-ideas')),
  };

  /* Over time: every period in the span, so a quiet week reads as 0 rather
     than disappearing from the axis. */
  const timeline = (() => {
    const first = filters.from || (view.length ? view[view.length - 1].day : null);
    const last = filters.to || today;
    if (!first || first > last) return {granularity: 'month', points: []};
    const span = (parseDay(last) - parseDay(first)) / DAY_MS + 1;
    const granularity = span <= 120 ? 'week' : 'month';
    const periodOf = day => (granularity === 'month' ? day.slice(0, 7) : mondayOf(day));
    const counts = new Map();
    for (const entry of view) counts.set(periodOf(entry.day), (counts.get(periodOf(entry.day)) || 0) + 1);
    const points = [];
    for (let period = periodOf(first), end = periodOf(last); period <= end;
      period = granularity === 'month' ? addMonths(period, 1) : addDays(period, 7)) {
      points.push({
        period,
        label: granularity === 'month' ? monthLabel(period) : `Week of ${dayLabel(period)}`,
        short: granularity === 'month' ? shortMonth(period) : dayLabel(period).replace(/ \d{4}$/, ''),
        count: counts.get(period) || 0,
      });
    }
    return {granularity, points};
  })();

  /* Where from, and for what */
  const placed = countries.filter(item => item.key !== 'none');
  const countryFigures = {
    base: total,
    items: placed.slice(0, 8),
    other: {count: placed.slice(8).reduce((sum, item) => sum + item.count, 0), countries: Math.max(0, placed.length - 8)},
    notProvided: countries.find(item => item.key === 'none')?.count || 0,
    unmatched: placed.filter(item => item.unmatched).map(({label, count}) => ({label, count})),
  };
  const experienceFigures = {
    base: total,
    items: experiences.filter(item => item.key !== 'none'),
    notSelected: experiences.find(item => item.key === 'none')?.count || 0,
  };

  /* When they want to come: this month and the 18 after it, which is the
     window the form offers for a rough month. */
  const windowEnd = addMonths(currentMonth, 18);
  const travelPoints = new Map();
  for (let month = currentMonth; month <= windowEnd; month = addMonths(month, 1)) {
    travelPoints.set(month, {month, label: monthLabel(month), short: shortMonth(month), exact: 0, approximate: 0});
  }
  const travel = {base: total, earlier: {exact: 0, approximate: 0}, later: {exact: 0, approximate: 0}, notSure: 0, blank: 0, other: 0};
  for (const {row} of view) {
    const timing = timingOf(row);
    if (timing.kind === 'not-sure') travel.notSure += 1;
    else if (timing.kind === 'blank') travel.blank += 1;
    else if (timing.kind === 'other') travel.other += 1;
    else if (timing.month < currentMonth) travel.earlier[timing.kind] += 1;
    else if (timing.month > windowEnd) travel.later[timing.kind] += 1;
    else travelPoints.get(timing.month)[timing.kind] += 1;
  }
  travel.points = [...travelPoints.values()];

  /* Interests: many per enquiry, so shares are of enquiries, not of ticks,
     and they are not meant to add up to 100%. */
  const interestCounts = new Map(INTERESTS.map(([key]) => [key, 0]));
  const interestOther = new Map();
  const interests = {base: total, withAny: 0, recommend: 0, none: 0};
  for (const {row} of view) {
    const values = text(row.interests).split(',').map(value => value.trim()).filter(Boolean);
    if (!values.length) { interests.none += 1; continue; }
    if (values.some(value => interestCounts.has(value))) interests.withAny += 1;
    if (values.includes(NOT_SURE)) interests.recommend += 1;
    for (const value of new Set(values)) {
      if (interestCounts.has(value)) interestCounts.set(value, interestCounts.get(value) + 1);
      else if (value !== NOT_SURE) interestOther.set(value, (interestOther.get(value) || 0) + 1);
    }
  }
  interests.items = INTERESTS.map(([key, label], order) => ({key, label, count: interestCounts.get(key), order}))
    .sort((a, b) => b.count - a.count || a.order - b.order).map(({order, ...item}) => item);
  interests.other = [...interestOther].map(([label, count]) => ({label, count})).sort(byCount);

  /* Custom trips: days are a real number, so a median and a mean both mean
     something here — but only over the custom enquiries that gave one. */
  const custom = view.filter(entry => entry.experienceKey === 'custom');
  const days = custom.map(entry => text(entry.row.trip_length_days))
    .filter(value => /^\d{1,2}$/.test(value)).map(Number).filter(value => value >= 1 && value <= 60)
    .sort((a, b) => a - b);
  const middle = Math.floor(days.length / 2);
  const tripLength = {
    applicable: custom.length,
    given: days.length,
    notGiven: custom.length - days.length,
    median: days.length ? (days.length % 2 ? days[middle] : (days[middle - 1] + days[middle]) / 2) : null,
    mean: days.length ? Math.round((days.reduce((sum, value) => sum + value, 0) / days.length) * 10) / 10 : null,
    min: days.length ? days[0] : null,
    max: days.length ? days[days.length - 1] : null,
    buckets: TRIP_BUCKETS.map(([label, low, high]) => ({label, count: days.filter(value => value >= low && value <= high).length})),
  };

  const recent = {
    total,
    limit: filters.recentLimit,
    items: view.slice(0, filters.recentLimit).map(({row, countryLabel, countryUnmatched, experienceKey}) => {
      const timing = timingOf(row);
      const size = text(row.group_size);
      return {
        reference: text(row.reference),
        createdAt: text(row.created_at),
        country: countryLabel,
        countryUnmatched,
        experience: experienceLabel(experienceKey),
        groupSize: !size ? BLANK.groupSize.label : size === NOT_SURE ? GROUP_NOT_SURE : labelFrom(GROUP_SIZES, size) || size,
        timing: timing.kind === 'exact' ? timing.date
          : timing.kind === 'approximate' ? `${monthLabel(timing.month)} (rough)`
            : timing.kind === 'not-sure' ? TIMING_NOT_SURE : '',
        status: text(row.status) || 'new',
      };
    }),
  };

  const selectedCountry = options.countries.find(item => item.key === filters.country);

  return {
    generatedAt: now.toISOString(),
    applied: {
      ...filters,
      countryLabel: filters.country ? (selectedCountry?.label || filters.country.replace(/^raw:/, '')) : null,
      experienceLabel: filters.experience ? experienceLabel(filters.experience) : null,
    },
    ranges: RANGES.map(([key, label]) => ({key, label})),
    options,
    totals: {all: all.length, view: total, firstEnquiry: all.length ? all[all.length - 1].day : null},
    summary,
    timeline,
    countries: countryFigures,
    experiences: experienceFigures,
    travel,
    groupSize: distribution(view, 'group_size', GROUP_SIZES, {notSure: true, ordered: true}),
    budget: distribution(view, 'budget_range', BUDGET_RANGES, {notSure: true, ordered: true}),
    accommodation: distribution(view, 'accommodation', ACCOMMODATION),
    children: distribution(view, 'traveling_with_children', CHILDREN),
    contact: distribution(view, 'contact_method', CONTACT_METHODS),
    interests,
    tripLength,
    recent,
    blanks: Object.fromEntries(Object.entries(BLANK).map(([key, {label, means}]) => [key, {label, means}])),
  };
}

/* ── One enquiry, grouped for reading ─────────────────────────────────── */

export function describeEnquiry(row) {
  const answer = (pairs, value, blank, notSureLabel) => {
    const stored = text(value);
    if (!stored) return {value: blank.label, missing: true};
    if (notSureLabel && stored === NOT_SURE) return {value: notSureLabel, notSure: true};
    return {value: labelFrom(pairs, stored) || stored};
  };
  const rawCountry = text(row.country);
  const country = normaliseCountry(rawCountry);
  const timing = timingOf(row);
  const tour = text(row.tour_interest);
  const days = text(row.trip_length_days);
  const chosen = text(row.interests).split(',').map(value => value.trim()).filter(Boolean);

  return {
    reference: text(row.reference),
    traveler: {
      name: [text(row.first_name), text(row.last_name)].filter(Boolean).join(' '),
      country: rawCountry
        ? {value: country.label, unmatched: !country.resolved}
        : {value: BLANK.country.label, missing: true},
      email: text(row.email),
      phone: text(row.phone) || null,
      contactMethod: answer(CONTACT_METHODS, row.contact_method, BLANK.contact),
    },
    trip: {
      experience: tour || text(row.tour_name)
        ? {value: text(row.tour_name) || tour}
        : {value: BLANK.experience.label, missing: true},
      groupSize: answer(GROUP_SIZES, row.group_size, BLANK.groupSize, GROUP_NOT_SURE),
      timing: timing.kind === 'exact'
        ? {kind: 'exact', arrival: timing.date, departure: parseDay(text(row.departure_date)) ? text(row.departure_date) : null}
        : timing.kind === 'approximate'
          ? {kind: 'approximate', month: monthLabel(timing.month, true)}
          : timing.kind === 'not-sure'
            ? {kind: 'not-sure', value: TIMING_NOT_SURE}
            : {kind: 'blank', value: BLANK.timing.label},
      flexibility: answer(DATE_FLEXIBILITY, row.date_flexibility, BLANK.flexibility),
      // Asked only for a custom trip. On any other trip there is no question
      // to have left blank, so nothing is shown rather than "Not given".
      tripLength: tour === 'custom'
        ? (/^\d{1,2}$/.test(days) ? {value: `${Number(days)} ${Number(days) === 1 ? 'day' : 'days'}`} : {value: BLANK.tripLength.label, missing: true})
        : null,
      accommodation: answer(ACCOMMODATION, row.accommodation, BLANK.accommodation),
      children: {
        ...answer(CHILDREN, row.traveling_with_children, BLANK.children),
        ages: text(row.children_age_ranges) || null,
      },
    },
    preferences: {
      budget: answer(BUDGET_RANGES, row.budget_range, BLANK.budget, BUDGET_NOT_SURE),
      interests: {
        items: chosen.filter(value => value !== NOT_SURE).map(value => labelFrom(INTERESTS, value) || value),
        recommend: chosen.includes(NOT_SURE),
        recommendLabel: INTERESTS_NOT_SURE,
        missing: !chosen.length,
        blankLabel: BLANK.interests.label,
      },
    },
    message: text(row.message) || null,
    record: {
      reference: text(row.reference),
      receivedAt: text(row.created_at),
      source: text(row.source) || null,
      status: text(row.status) || 'new',
    },
  };
}
