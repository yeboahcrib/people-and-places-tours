import {fetchSanity} from './sanity-fetch.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const API_VERSION = '2026-08-02';

// Every key the contact page can bind to. Keeping the list explicit means a
// typo in Sanity (or in booking.json) fails the build instead of silently
// leaving stale copy on the live page.
const TEXT_KEYS = [
  'heroSubtitle',
  'eyebrow', 'title', 'intro',
  'step1Name', 'step1Legend', 'step1Help', 'nextLabel', 'nextNote',
  'step2Name', 'step2Legend', 'step2Help', 'submitLabel', 'submitNote',
  'privacyNote', 'altPrompt',
  'successTitle', 'successText',
  'nextStepsTitle', 'nextStepsIntro', 'talkTitle', 'talkText',
];

const TRUST_ICONS = new Set(['pin', 'clock', 'lock']);

function validateBooking(booking, source) {
  if (!booking || typeof booking !== 'object') {
    throw new Error(`${source} is missing booking flow content`);
  }
  for (const key of TEXT_KEYS) {
    if (typeof booking[key] !== 'string' || !booking[key].trim()) {
      throw new Error(`${source} is missing booking flow copy for "${key}"`);
    }
  }
  if (!Array.isArray(booking.trustPoints) || booking.trustPoints.length === 0) {
    throw new Error(`${source} is missing booking flow trust points`);
  }
  for (const [index, point] of booking.trustPoints.entries()) {
    if (!point?.label || !TRUST_ICONS.has(point.icon)) {
      throw new Error(`${source} trust point ${index + 1} needs a label and one of: ${[...TRUST_ICONS].join(', ')}`);
    }
  }
  if (!Array.isArray(booking.nextSteps) || booking.nextSteps.length === 0) {
    throw new Error(`${source} is missing the "what happens next" steps`);
  }
  for (const [index, step] of booking.nextSteps.entries()) {
    if (!step?.title || !step?.description) throw new Error(`${source} next step ${index + 1} is incomplete`);
  }
  if (!Array.isArray(booking.faqs) || booking.faqs.length === 0) {
    throw new Error(`${source} is missing booking FAQs`);
  }
  for (const [index, faq] of booking.faqs.entries()) {
    if (!faq?.question || !faq?.answer) throw new Error(`${source} FAQ ${index + 1} is incomplete`);
  }
  return booking;
}

export async function loadLocalBookingContent(projectRoot) {
  const file = JSON.parse(await readFile(join(projectRoot, 'src/content/booking.json'), 'utf8'));
  return validateBooking(file?.bookingFlow, 'Local booking content');
}

export async function loadBookingContent({localContent, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';

  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    return {content: localContent, source: 'local'};
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `*[_id == "bookingFlow"][0]{
    ${TEXT_KEYS.join(', ')},
    trustPoints[]{icon, label},
    nextSteps[]{title, description},
    faqs[]{question, answer},
    "heroPhoto": heroPhoto{
      "src": image.asset->url,
      "alt": altText,
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height,
      placeholderState, publicApprovalState
    }
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const body = await fetchSanity(url, {fetchImpl, label: 'Sanity booking'});

  // When Sanity is configured, publish what editors approved or fail loudly —
  // never quietly fall back to the committed copy.
  return {content: validateBooking(body.result, 'Sanity booking content'), source: 'sanity'};
}

export {TEXT_KEYS};
