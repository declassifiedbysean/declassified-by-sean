// src/index.js — wires HTTP + WebSocket + the static client.
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import config from './config.js';
import Store from './store/memoryStore.js';
import { issueGuest } from './auth/session.js';
import google from './auth/google.js';
import createOAuthStateStore from './auth/oauthState.js';
import { attachWebSocket } from './realtime/wsServer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- health / config probe (client uses this to know if Google login is available) ---
app.get('/api/health', async (_req, res) => {
  res.json({ ok: true, googleLogin: google.googleEnabled(), corpus: await Store.corpusSize() });
});

// --- guest login: no identity kept (the privacy-clean default door) ---
app.post('/auth/guest', (req, res) => {
  const handle = (req.body?.handle || '').toString().slice(0, 40) || 'Guest';
  res.json(issueGuest(handle));
});

// --- Google OIDC (optional; only live when configured) ---
// C11: states are single-use, TTL-bounded, and swept so abandoned logins can't leak or replay.
const oauthStates = createOAuthStateStore();
const stateSweep = setInterval(() => oauthStates.sweep(), 60 * 1000);
stateSweep.unref(); // never keep the process alive just for the sweep (clean exit in tests/shutdown)
app.get('/auth/google', (_req, res) => {
  if (!google.googleEnabled()) return res.status(404).send('google login not configured');
  res.redirect(google.authUrl(oauthStates.issue()));
});
app.get('/auth/google/callback', async (req, res) => {
  try {
    if (!oauthStates.consume(req.query.state)) return res.status(400).send('bad state');
    const session = await google.handleCallback(req.query.code, Store);
    // hand the token back to the SPA via fragment (kept out of server logs / referers)
    res.redirect(`/#token=${encodeURIComponent(session.token)}&handle=${encodeURIComponent(session.user.handle)}`);
  } catch (e) {
    res.status(500).send(`login failed: ${e.message}`);
  }
});

// --- leaderboard (handles + scores) ---
app.get('/api/leaderboard', async (req, res) => {
  if ((req.query.type || '') === 'rating') return res.json(await Store.topRatings(20));
  res.json(await Store.topScores(20));
});

// --- the rated ladder: a player's own rating (paid, logged in) ---
app.get('/api/ratings/me', async (req, res) => {
  const { verify } = await import('./auth/session.js');
  const claims = verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!claims || claims.guest) return res.status(401).json({ error: 'login required' });
  res.json((await Store.getRating(claims.sub)) || { rating: null, games: 0 });
});

// --- the works corpus (anonymous, unlinked) ---
app.get('/api/works', async (_req, res) => res.json(await Store.recentWorks(60)));

// --- closing reviews (docent wall-text, paired with the leaderboard) ---
app.get('/api/reviews', async (_req, res) => res.json(await Store.recentReviews(20)));

// --- data-subject rights (the obligations login switches on) ---
app.post('/api/account/export', async (req, res) => {
  const { verify } = await import('./auth/session.js');
  const claims = verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!claims || claims.guest) return res.status(401).json({ error: 'login required' });
  res.json(await Store.exportAccount(claims.sub));
});
app.post('/api/account/delete', async (req, res) => {
  const { verify } = await import('./auth/session.js');
  const claims = verify((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  if (!claims || claims.guest) return res.status(401).json({ error: 'login required' });
  await Store.deleteAccount(claims.sub);
  res.json({ deleted: true, note: 'account + leaderboard rows removed; the anonymous corpus was never linked' });
});

const server = http.createServer(app);
attachWebSocket(server, Store);

// C1: client tokens are only as safe as this secret. Do not boot prod on the dev default.
if (process.env.NODE_ENV === 'production') {
  const s = process.env.JWT_SECRET || '';
  if (!s || s === 'dev-insecure-secret-change-me' || s.length < 24) {
    console.error('FATAL: set a strong JWT_SECRET (>= 24 chars) before running in production.');
    process.exit(1);
  }
} else if (config.jwtSecret === 'dev-insecure-secret-change-me') {
  console.warn('  ⚠ using the insecure dev JWT secret — fine for local, never for production.');
}

server.listen(config.port, () => {
  console.log(`\n  ONLY HUMANS CAN SCORE — server up`);
  console.log(`  http://localhost:${config.port}`);
  console.log(`  google login: ${google.googleEnabled() ? 'ENABLED' : 'guest-only (set GOOGLE_CLIENT_ID/SECRET to enable)'}`);
  console.log(`  image gen: ${config.imagegen.provider !== 'none' && config.imagegen.apiKey ? config.imagegen.provider : 'offline fallback (set IMAGE_API_KEY to paint for real)'}`);
  console.log(`  machine brain: ${config.llm.provider !== 'none' && config.llm.apiKey ? config.llm.provider : 'house deck (set LLM_API_KEY to think for real)'}\n`);
});

export default server;
