// src/config.js — one place for every knob. Reads env, falls back to safe defaults.
import 'dotenv/config';

const num = (v, d) => (v === undefined || v === '' ? d : Number(v));
const bool = (v, d) => (v === undefined || v === '' ? d : /^(1|true|yes)$/i.test(v));

export const config = {
  port: num(process.env.PORT, 3000),
  publicUrl: process.env.PUBLIC_URL || `http://localhost:${num(process.env.PORT, 3000)}`,

  // --- session / auth ---
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    // redirect must be registered in the Google Cloud console for OAuth to complete
    redirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${num(process.env.PORT, 3000)}/auth/google/callback`,
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  },

  // --- matchmaking: the storm & the batcher ---
  table: {
    target: num(process.env.TABLE_TARGET, 4),   // ideal seats (>=4 unlocks the Imposter crown)
    min: num(process.env.TABLE_MIN, 3),          // launch floor
    max: num(process.env.TABLE_MAX, 9),
    waitMs: num(process.env.QUEUE_WAIT_MS, 20000), // max time in the storm before the batcher resolves you
  },
  // when the storm can't fill a table in time: 'bots' (machine wears human masks),
  // 'small' (launch under target), or 'solo' (one human vs the machine).
  // Blueprint open-decision #1 — RESOLVED here to 'bots'. See README.
  waitFallback: process.env.WAIT_FALLBACK || 'bots',
  botBackfill: bool(process.env.BOT_BACKFILL, true),

  // --- the round ---
  // rounds = players + 2 (auto-derived per game; doubles as the image-cost cap)
  roundsBonus: num(process.env.ROUNDS_BONUS, 3),
  nameSeconds: num(process.env.NAME_SECONDS, 60),

  // --- heat (NBA Jam, capped x3) ---
  heat: {
    lightningWindow: num(process.env.HEAT_LIGHTNING_S, 20), // first 20s of the 60s name clock = x3
    warmWindow: num(process.env.HEAT_WARM_S, 40),           // 20–40s = x2 ; after = x1
    cap: 3,
    onFireStreak: num(process.env.HEAT_ONFIRE_STREAK, 3),   // 3 straight lightning locks => ON FIRE
  },

  // --- services (host-pays). Empty key => honest offline fallback so the loop still runs. ---
  imagegen: {
    provider: process.env.IMAGE_PROVIDER || 'none', // 'openai' | 'none'
    apiKey: process.env.IMAGE_API_KEY || '',
    model: process.env.IMAGE_MODEL || 'gpt-image-1-mini',
  },
  llm: {
    provider: process.env.LLM_PROVIDER || 'none', // 'anthropic' | 'none'
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'claude-sonnet-4-20250514',
  },

  // --- moderation ---
  moderation: {
    maxNameLen: num(process.env.MAX_NAME_LEN, 80),
    rateLimitPerMin: num(process.env.RATE_LIMIT_PER_MIN, 40),
  },

  // --- the rated ladder (paid tier only; the ELO Metric made literal) ---
  // Off by default: the wall holds until a real Pass/entitlement source exists. See auth/entitlement.js.
  ratings: {
    enabled: bool(process.env.RATINGS_ENABLED, false),
    start: num(process.env.RATING_START, 1500),
    kBase: num(process.env.RATING_K, 24),                       // settled players move slowly
    kProvisional: num(process.env.RATING_K_PROVISIONAL, 40),    // new players move fast
    provisionalGames: num(process.env.RATING_PROVISIONAL_GAMES, 10),
    floor: num(process.env.RATING_FLOOR, 100),                  // a rating cannot fall through the floor
  },
};

export default config;
