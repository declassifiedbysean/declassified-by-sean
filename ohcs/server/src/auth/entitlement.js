// src/auth/entitlement.js — the wall around the rated ladder.
//
// Ratings are a paid-tier feature. A player is rated only if they are (a) logged in (have an
// opaque `sub`) AND (b) hold an active Pass. Guests and anonymous free play are never rated —
// there is no identity to attach a rating to, and that is by design, not omission.
//
// Until a payment processor and subscription store exist, NOBODY is paid. This returns false
// on purpose: the rated ladder cannot rate anyone before the Pass is real. The wall holds by
// default; turning ratings on without an entitlement source would be the bug.
import config from '../config.js';

export function isPaid(sub) {
  if (!sub) return false;                 // guests / anonymous are never rated
  if (!config.ratings.enabled) return false;
  // TODO(paid-tier): look up an active subscription/entitlement for `sub` in the billing store.
  // Wire the processor (Stripe/BTC council, per the blueprint) here. Returns false until then.
  return false;
}

export default { isPaid };
