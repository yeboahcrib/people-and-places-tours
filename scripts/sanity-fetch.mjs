// Every content adapter reads Sanity exactly once per build. A single dropped
// connection therefore fails the whole build, and on Cloudflare a failed build
// means the publish webhook fires and nothing reaches the site. The CDN was
// observed timing out on roughly one local build in three, so these reads
// retry rather than taking the deploy down with them.
const ATTEMPTS = 3;
const BACKOFF_MS = 400;

const wait = ms => new Promise(resolve => { setTimeout(resolve, ms); });

export async function fetchSanity(url, {fetchImpl = fetch, label = 'Sanity', attempts = ATTEMPTS} = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
      if (!response.ok) throw new Error(`${label} request failed with HTTP ${response.status}`);
      const body = await response.json();
      if (body.error) throw new Error(`${label} request failed: ${body.error.description || body.error.type}`);
      return body;
    } catch (error) {
      lastError = error;
      // An HTTP status or a GROQ error is the answer, not a hiccup: retrying
      // returns the same thing and hides a real problem behind three delays.
      if (/failed with HTTP|request failed:/.test(error.message)) throw error;
      if (attempt < attempts) await wait(BACKOFF_MS * attempt);
    }
  }
  throw new Error(`${label} could not be reached after ${attempts} attempts: ${lastError.message}`);
}
