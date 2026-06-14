// src/auth/google.js — Google OpenID Connect. Optional. Guests play without it.
// Requests the MINIMUM: openid (+ profile only for a display name). Stores only the opaque `sub`.
import { OAuth2Client } from 'google-auth-library';
import config from '../config.js';
import { issueUser } from './session.js';

const client = config.google.enabled
  ? new OAuth2Client(config.google.clientId, config.google.clientSecret, config.google.redirectUri)
  : null;

export const googleEnabled = () => config.google.enabled;

// Step 1: where to send the browser to consent.
export function authUrl(state) {
  if (!client) return null;
  return client.generateAuthUrl({
    access_type: 'online',
    scope: ['openid', 'profile'], // NO email unless a feature needs it — every scope is a liability
    state,
    prompt: 'select_account',
  });
}

// Step 2: exchange the code, verify the id token, mint our own session keyed by `sub`.
export async function handleCallback(code, store) {
  if (!client) throw new Error('google login not configured');
  const { tokens } = await client.getToken(code);
  const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: config.google.clientId });
  const payload = ticket.getPayload();
  const sub = payload.sub;                          // opaque, stable, the only id we keep
  const handle = payload.given_name || payload.name || 'Player';
  if (store) await store.upsertAccount(sub, handle); // account row = personal data, full rights
  return issueUser(sub, handle);
}

export default { googleEnabled, authUrl, handleCallback };
