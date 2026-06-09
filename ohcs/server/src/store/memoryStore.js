// src/store/memoryStore.js
// Default datastore. Zero external deps so the server runs out of the box.
// PRIVACY LAW (blueprint §6): the works corpus carries NO foreign key to an account.
// Content, not people. Do not add an accountId to a work. See store/README-postgres.md.
import { nanoid } from 'nanoid';

const db = {
  accounts: new Map(),     // sub -> { sub, handle, createdAt }   (personal data; full rights)
  leaderboard: [],         // { handle, score, date }             (self-chosen handle; clearable)
  corpus: [],              // { id, piece, secret, sublimeName, caught, date }  (ANONYMOUS; unlinked)
  reviews: [],             // { review, winner, rounds, caughtCount, date }  (docent wall-text; anonymous)
};

export const Store = {
  // --- accounts (personal data) ---
  async upsertAccount(sub, handle) {
    const existing = db.accounts.get(sub);
    const acct = existing || { sub, createdAt: Date.now() };
    if (handle) acct.handle = handle;
    db.accounts.set(sub, acct);
    return acct;
  },
  async getAccount(sub) { return db.accounts.get(sub) || null; },
  async deleteAccount(sub) {
    // Right to erasure: removes the person. The anonymous corpus is untouched BECAUSE it was never linked.
    db.accounts.delete(sub);
    db.leaderboard = db.leaderboard.filter((r) => r._sub !== sub);
    return true;
  },
  async exportAccount(sub) {
    return {
      account: db.accounts.get(sub) || null,
      leaderboard: db.leaderboard.filter((r) => r._sub === sub).map(({ _sub, ...r }) => r),
    };
  },

  // --- leaderboard (handle + score) ---
  async addScore({ handle, score, sub = null }) {
    db.leaderboard.push({ handle, score, date: new Date().toISOString().slice(0, 10), _sub: sub });
    db.leaderboard.sort((a, b) => b.score - a.score);
    db.leaderboard = db.leaderboard.slice(0, 200);
  },
  async topScores(n = 20) {
    return db.leaderboard.slice(0, n).map(({ _sub, ...r }) => r);
  },

  // --- ratings (paid tier; stored ON the account = personal data, full rights via export/delete) ---
  async getRating(sub) {
    const a = db.accounts.get(sub);
    return a && a.rating != null ? { rating: a.rating, games: a.games || 0 } : null;
  },
  async applyRatings(updates) {            // [{ sub, after, games }]
    for (const u of updates) {
      if (!u.sub) continue;
      const a = db.accounts.get(u.sub) || { sub: u.sub, createdAt: Date.now() };
      a.rating = u.after; a.games = u.games;
      db.accounts.set(u.sub, a);
    }
  },
  async topRatings(n = 20) {
    return [...db.accounts.values()]
      .filter((a) => a.rating != null && (a.games || 0) > 0)
      .sort((x, y) => y.rating - x.rating)
      .slice(0, n)
      .map((a) => ({ handle: a.handle || '\u2014', rating: a.rating, games: a.games || 0 }));
  },

  // --- works corpus (ANONYMOUS, unlinked, kept for as long as the lights stay on) ---
  async addWork(w) {
    const work = { id: nanoid(10), date: new Date().toISOString().slice(0, 10), ...w };
    delete work.accountId; delete work._sub; // belt and suspenders: never store a link
    db.corpus.push(work);
    return work;
  },
  async recentWorks(n = 60) { return db.corpus.slice(-n).reverse(); },
  async corpusSize() { return db.corpus.length; },

  // --- closing reviews (docent wall-text; reports the human verdict, holds no identity) ---
  async addReview(r) {
    db.reviews.push({ date: new Date().toISOString().slice(0, 10), ...r });
    db.reviews = db.reviews.slice(-100);
  },
  async recentReviews(n = 20) { return db.reviews.slice(-n).reverse(); },
};

export default Store;
