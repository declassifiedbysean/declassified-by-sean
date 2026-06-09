// src/matchmaking/Batcher.js — "storm and batch". The queue is the storm; the batcher forms tables.
// The promise it keeps: no player waits forever. When the storm can't fill a table in time,
// the configured fallback resolves them (bots / small / solo). Blueprint open-decision #1.
import config from '../config.js';

export class Batcher {
  constructor({ onFormRoom }) {
    this.queue = [];           // [{ id, name, sub, enqueuedAt, notify }]
    this.onFormRoom = onFormRoom; // (members[], { fallback }) => roomCode
    this.timer = setInterval(() => this.tick(), 1000);
  }
  stop() { clearInterval(this.timer); }

  size() { return this.queue.length; }

  join(player) {
    if (this.queue.find((p) => p.id === player.id)) return;
    this.queue.push({ ...player, enqueuedAt: Date.now() });
    player.notify?.({ t: 'queue.waiting', size: this.queue.length, position: this.queue.length });
    this.tick();
  }
  leave(id) { this.queue = this.queue.filter((p) => p.id !== id); }

  tick() {
    const { target, min, waitMs } = config.table;

    // 1) form full/target tables greedily
    while (this.queue.length >= target) {
      const members = this.queue.splice(0, target);
      this.onFormRoom(members, { fallback: null });
    }

    // 2) resolve anyone who has waited too long, rather than leave them in the storm
    if (this.queue.length > 0) {
      const oldest = this.queue[0];
      const waited = Date.now() - oldest.enqueuedAt;
      if (waited >= waitMs) {
        if (this.queue.length >= min) {
          // launch a smaller-but-valid table now
          const members = this.queue.splice(0, Math.min(this.queue.length, target));
          this.onFormRoom(members, { fallback: 'small' });
        } else {
          // not enough humans: honor the fallback so the lone player isn't stranded
          const members = this.queue.splice(0, this.queue.length);
          this.onFormRoom(members, { fallback: config.waitFallback }); // 'bots' | 'solo'
        }
      }
    }
  }
}

export default Batcher;
