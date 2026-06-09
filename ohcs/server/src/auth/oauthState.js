// auth/oauthState.js — single-use, short-lived OAuth `state` tokens. (Red-team C11.)
// Before: states were held in a Map and only deleted on a *successful* callback, so every
// abandoned login leaked a forever-valid entry (memory growth + indefinite CSRF-token validity).
// Now: each state carries a creation time, is consumed exactly once, expires after a TTL, and a
// periodic sweep drops abandoned ones. Extracted so the TTL/sweep logic is deterministically testable.
import { nanoid } from 'nanoid';

const DEFAULT_TTL_MS = 10 * 60 * 1000; // 10 minutes — a login slower than this is abandoned.

export function createOAuthStateStore({ ttlMs = DEFAULT_TTL_MS } = {}) {
  const states = new Map(); // state -> createdAt(ms)
  return {
    // mint a fresh state for an outbound /auth/google redirect
    issue() {
      const s = nanoid(16);
      states.set(s, Date.now());
      return s;
    },
    // single-use: returns true only for a known, unexpired state, and ALWAYS removes it (so a
    // captured state can't be replayed — even an expired-but-present one is consumed here).
    consume(state, now = Date.now()) {
      const ts = states.get(state);
      if (ts === undefined) return false;
      states.delete(state);
      return now - ts <= ttlMs;
    },
    // drop abandoned states so they can't accumulate (memory) or stay valid forever — C11.
    sweep(now = Date.now()) {
      for (const [s, ts] of states) if (now - ts > ttlMs) states.delete(s);
    },
    get size() { return states.size; },
  };
}

export default createOAuthStateStore;
