// src/game/heat.js — NBA Jam heat, capped at x3. Persistence, not bigger numbers.
import config from '../config.js';

// Map a lock time (seconds into the 60s name clock) to a speed multiplier.
export function speedMultiplier(lockSeconds) {
  const { lightningWindow, warmWindow, cap } = config.heat;
  if (lockSeconds <= lightningWindow) return cap;     // Lightning -> x3
  if (lockSeconds <= warmWindow) return 2;            // Warm -> x2
  return 1;                                           // Cold -> x1
}

// Per-player heat state lives on the player object: { streak, onFire }.
export function applyLockHeat(player, lockSeconds) {
  const isLightning = lockSeconds <= config.heat.lightningWindow;
  if (isLightning) player.streak = (player.streak || 0) + 1;
  else player.streak = 0;
  if (player.streak >= config.heat.onFireStreak) player.onFire = true;
}

// Called at end of round: winning >=1 crown keeps you lit; a crownless round cools you.
export function settleRoundHeat(player, wonAnyCrown) {
  if (player.onFire && !wonAnyCrown) {
    player.onFire = false;
    player.streak = 0;
  }
}

// Effective multiplier for a lock, honoring ON FIRE (pinned at cap).
export function effectiveMultiplier(player, lockSeconds) {
  return player.onFire ? config.heat.cap : speedMultiplier(lockSeconds);
}

export default { speedMultiplier, applyLockHeat, settleRoundHeat, effectiveMultiplier };
