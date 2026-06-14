// test/elo.test.js — proves the rated-ladder math. Run: node test/elo.test.js
import assert from 'node:assert';
import { expected, outcome, updateGroup } from '../src/game/elo.js';

const C = { start: 1500, kBase: 24, kProvisional: 40, provisionalGames: 10, floor: 100 };
let pass = 0;
const t = (name, fn) => { fn(); pass++; console.log('  \u2713 ' + name); };
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

t('equal ratings => 50% expected', () => assert(near(expected(1500, 1500), 0.5)));
t('expected is symmetric (adds to 1)', () => assert(near(expected(1600, 1400) + expected(1400, 1600), 1)));
t('higher rating => higher expectation', () => assert(expected(1800, 1500) > 0.5 && expected(1500, 1800) < 0.5));
t('outcome maps score order to 1/0.5/0', () => {
  assert.equal(outcome(10, 4), 1); assert.equal(outcome(4, 10), 0); assert.equal(outcome(5, 5), 0.5);
});

t('two equal players: winner +k/2, loser -k/2, zero-sum', () => {
  const r = updateGroup([{ sub: 'a', rating: 1500, games: 20, gameScore: 30 },
                         { sub: 'b', rating: 1500, games: 20, gameScore: 10 }], C);
  const a = r.find(x => x.sub === 'a'), b = r.find(x => x.sub === 'b');
  assert.equal(a.delta, 12);  // 24 * (1 - 0.5)
  assert.equal(b.delta, -12);
  assert.equal(a.delta + b.delta, 0);
});

t('underdog win beats favorite by more', () => {
  const r = updateGroup([{ sub: 'low', rating: 1300, games: 20, gameScore: 30 },
                         { sub: 'high', rating: 1700, games: 20, gameScore: 10 }], C);
  const low = r.find(x => x.sub === 'low');
  assert(low.delta > 12, 'upset should pay more than an even-match win');
});

t('provisional players swing harder (K=40 not 24)', () => {
  const r = updateGroup([{ sub: 'new', rating: 1500, games: 0, gameScore: 30 },
                         { sub: 'vet', rating: 1500, games: 50, gameScore: 10 }], C);
  assert.equal(r.find(x => x.sub === 'new').delta, 20);  // 40 * .5
  assert.equal(r.find(x => x.sub === 'vet').delta, -12); // 24 * .5
  assert(r.find(x => x.sub === 'new').provisional === true);
  assert(r.find(x => x.sub === 'vet').provisional === false);
});

t('rating cannot fall through the floor', () => {
  const r = updateGroup([{ sub: 'bottom', rating: 105, games: 20, gameScore: 0 },
                         { sub: 'top', rating: 105, games: 20, gameScore: 50 }], C);
  const bottom = r.find(x => x.sub === 'bottom');
  assert(bottom.after >= C.floor, 'never below floor');
  assert.equal(bottom.after, 100);
});

t('single rated player is a no-op (cannot rate against no one)', () => {
  const r = updateGroup([{ sub: 'solo', rating: 1500, games: 5, gameScore: 30 }], C);
  assert.equal(r[0].delta, 0); assert.equal(r[0].after, 1500);
});

t('big table: deltas of an equal-rating group sum to ~0', () => {
  const g = [30, 24, 18, 12, 6].map((sc, i) => ({ sub: 's' + i, rating: 1500, games: 20, gameScore: sc }));
  const r = updateGroup(g, C);
  const sum = r.reduce((a, x) => a + x.delta, 0);
  assert(Math.abs(sum) <= 2, 'equal-K group is zero-sum up to rounding, got ' + sum);
  assert(r[0].delta > 0 && r[r.length - 1].delta < 0, 'first gains, last loses');
});

console.log(`\n  ${pass} Elo checks passed.`);
