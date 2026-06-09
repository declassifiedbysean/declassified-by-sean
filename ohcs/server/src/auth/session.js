// src/auth/session.js — our own session token. Guests and Google users both end up here.
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import config from '../config.js';

// Guest: no identity kept. A random id + a chosen handle. This is the privacy-clean default.
export function issueGuest(handle) {
  const id = 'guest_' + nanoid(10);
  const token = jwt.sign({ id, handle: handle || 'Guest', guest: true }, config.jwtSecret, { expiresIn: '12h' });
  return { token, user: { id, handle: handle || 'Guest', guest: true } };
}

// Authenticated: keyed by the opaque Google subject id. NOTHING else is required.
export function issueUser(sub, handle) {
  const id = 'u_' + sub;
  const token = jwt.sign({ id, sub, handle, guest: false }, config.jwtSecret, { expiresIn: '30d' });
  return { token, user: { id, sub, handle, guest: false } };
}

export function verify(token) {
  try { return jwt.verify(token, config.jwtSecret); } catch { return null; }
}

export default { issueGuest, issueUser, verify };
