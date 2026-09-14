/* The enquiry form's answers, as the dashboard reads them back.
 *
 * Slugs and labels match the live form (contact.html) and the inquiry
 * Function. They are repeated here rather than imported from the Function so
 * the dashboard can never change what the form accepts; tests/dashboard-function.mjs
 * reads the built form and fails if the two ever disagree.
 *
 * Three kinds of "no figure" are kept apart everywhere:
 *   - a real answer with no enquiries behind it, shown as 0;
 *   - "Not sure yet", which is an answer somebody chose (stored as not-sure);
 *   - an empty value, which means the question was skipped, left on its
 *     default, not asked for that kind of trip, or asked only after the
 *     enquiry was made. It is never counted as zero and never as an answer.
 */

export const NOT_SURE = 'not-sure';

// Ordered: these are ranges, and a chart of ranges sorted by size is not a
// distribution.
export const GROUP_SIZES = [
  ['solo', 'Just me'],
  ['2', '2 people'],
  ['3-5', '3–5 people'],
  ['6-10', '6–10 people'],
  ['11-15', '11–15 people'],
  ['15+', 'More than 15'],
];

export const BUDGET_RANGES = [
  ['under-500', 'Under $500'],
  ['500-1500', '$500 – $1,500'],
  ['1500-3000', '$1,500 – $3,000'],
  ['3000-5000', '$3,000 – $5,000'],
  ['over-5000', 'More than $5,000'],
];

export const ACCOMMODATION = [
  ['shared', 'Shared / double occupancy'],
  ['private', 'Private / single occupancy'],
  ['family', 'Family or mixed configuration'],
];

export const CHILDREN = [['yes', 'Yes'], ['no', 'No']];

export const CONTACT_METHODS = [['email', 'Email'], ['whatsapp', 'WhatsApp']];

export const DATE_FLEXIBILITY = [['yes', 'Yes, they can shift'], ['no', 'No, the dates are fixed']];

// The form's order. "not-sure" is not an interest: it hands the choice over.
export const INTERESTS = [
  ['culture-heritage', 'Culture & heritage'],
  ['food', 'Food'],
  ['history-ancestry', 'History / ancestry'],
  ['nature-waterfalls', 'Nature & waterfalls'],
  ['wildlife', 'Wildlife'],
  ['adventure', 'Adventure'],
  ['beaches-relaxation', 'Beaches & relaxation'],
  ['nightlife', 'Nightlife'],
  ['community', 'Local / community experiences'],
  ['photography', 'Photography'],
  ['shopping-crafts', 'Shopping / crafts'],
];

export const GROUP_NOT_SURE = 'Not sure yet';
export const BUDGET_NOT_SURE = 'Not sure yet';
export const TIMING_NOT_SURE = 'Not sure yet';
export const INTERESTS_NOT_SURE = 'Asked us to recommend';

/* What an empty value is called, field by field, and what it can mean. Each
   one is worded from what the form actually does with that question. */
export const BLANK = {
  country: {label: 'Not provided', means: 'No country was given.'},
  experience: {label: 'Not selected', means: 'No experience was chosen.'},
  groupSize: {label: 'Not recorded', means: 'Group size was not stored. The form requires it, so these predate that rule.'},
  budget: {label: 'No answer', means: '"Rather not say", or an enquiry made before budget was asked.'},
  accommodation: {label: 'Not specified', means: '"We\'ll decide together", a day tour (where it is not asked), or an older enquiry.'},
  flexibility: {label: 'Not sure / no answer', means: '"Not sure yet" is the form\'s default, so this includes anyone who left it, and day tours, where it is not asked.'},
  children: {label: 'Not sure / no answer', means: '"Not sure yet" is the form\'s default, so this includes anyone who left it.'},
  contact: {label: 'No preference', means: '"No preference" is the form\'s default.'},
  interests: {label: 'None chosen', means: 'No interests ticked, or an enquiry made before interests were asked.'},
  timing: {label: 'No timing recorded', means: 'Neither an arrival date nor a rough month was stored. Every enquiry since timing became required has one.'},
  tripLength: {label: 'Not given', means: 'A custom trip with no length given. Length is asked only for custom trips.'},
};

export const labelFrom = (pairs, value) => (pairs.find(([key]) => key === value) || [])[1];
