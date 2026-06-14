// src/moderation/filter.js — strangers + generated content = a public surface. Floor, not polish.
import config from '../config.js';

const BANNED = [
  /\bn[i1]gg/i, /\bf[a@]gg/i, /\bk[i1]ke\b/i, /\bsp[i1]c\b/i, /\bch[i1]nk\b/i,
  /\bcunt\b/i, /\bporn\b/i, /\brape\b/i, /\bkill yourself\b/i,
];

export function cleanName(raw) {
  let s = String(raw ?? '').replace(/\s+/g, ' ').trim().slice(0, config.moderation.maxNameLen);
  if (!s) s = 'Untitled';
  for (const re of BANNED) if (re.test(s)) return '[withheld]';
  return s;
}

export function isAbusive(raw) {
  const s = String(raw ?? '');
  return BANNED.some((re) => re.test(s));
}

// naive token-bucket rate limiter per key (connection id / ip)
const buckets = new Map();
export function allow(key) {
  const now = Date.now();
  const b = buckets.get(key) || { n: 0, reset: now + 60000 };
  if (now > b.reset) { b.n = 0; b.reset = now + 60000; }
  b.n += 1; buckets.set(key, b);
  return b.n <= config.moderation.rateLimitPerMin;
}

// report sink — production: write to a moderation queue + notify. Here: log.
const reports = [];
export function report({ by, code, entryId, reason }) {
  reports.push({ by, code, entryId, reason, at: Date.now() });
  console.log(`[moderation] report from ${by} in ${code} on ${entryId}: ${reason || 'n/a'}`);
}
export function listReports() { return reports.slice(-100); }

export default { cleanName, isAbusive, allow, report, listReports };
