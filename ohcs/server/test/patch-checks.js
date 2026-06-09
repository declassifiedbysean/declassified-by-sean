// test/patch-checks.js — proves C1, C2, C3, C11, C14 actually do what the fix claims.
process.env.NAME_SECONDS = '1';
import { spawn } from 'node:child_process';
import Store from '../src/store/memoryStore.js';
import { RoomManager } from '../src/matchmaking/RoomManager.js';
import Room from '../src/game/Room.js';
import createOAuthStateStore from '../src/auth/oauthState.js';

let fails = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { console.error('  ✗', m); fails++; };

// ---- C2: host-only / member-only start, enforced server-side ----
const rm = new RoomManager({ store: Store, sendToConn: () => {} });
const room = rm.createRoom({ isPrivate: true });
rm.joinRoom(room.code, { id: 'h1', name: 'Host' }, 'c1');
rm.joinRoom(room.code, { id: 'm1', name: 'Member' }, 'c2');
room.hostId === 'h1' ? ok('C2 host recorded as first human seated') : bad('C2 host not recorded');
rm.startRoom(room.code, 'ghost').error ? ok('C2 non-member cannot start') : bad('C2 non-member started a room');
rm.startRoom(room.code, 'm1').error ? ok('C2 non-host member cannot start') : bad('C2 non-host started the room');
rm.startRoom(room.code, 'h1').ok ? ok('C2 host can start') : bad('C2 host was blocked');

// ---- C3: a vote resolves once a mid-vote disconnect is removed (no stall to timeout) ----
const room2 = new Room({ code: 'TEST', bus: { send() {}, broadcast() {} }, store: Store });
let resolved = false;
room2._collect = { type: 'crown', expected: new Set(['a', 'b']), got: new Map(), fields: ['sublime', 'troll'], resolve: () => { resolved = true; } };
room2.castVote('a', 'sublime', 'x'); room2.castVote('a', 'troll', 'y');
!resolved ? ok('C3 waits while both humans are expected') : bad('C3 resolved too early');
room2._collect.expected.delete('b'); room2._maybeResolve();
resolved ? ok('C3 resolves immediately when the disconnected human is removed') : bad('C3 still stalls after a disconnect');

// ---- C11: OAuth state is single-use, TTL-bounded, and swept ----
const ss = createOAuthStateStore({ ttlMs: 1000 });
const s1 = ss.issue();
ss.consume(s1, Date.now()) ? ok('C11 a fresh state is accepted') : bad('C11 rejected a fresh state');
ss.consume(s1, Date.now()) === false ? ok('C11 state is single-use (replay rejected)') : bad('C11 state was reusable');
const s2 = ss.issue();
ss.consume(s2, Date.now() + 2000) === false ? ok('C11 expired state is rejected') : bad('C11 accepted an expired state');
ss.issue(); ss.sweep(Date.now() + 2000);
ss.size === 0 ? ok('C11 sweep drops abandoned states') : bad('C11 sweep left stale states');

// ---- C14: collection resolvers are explicitly one-shot (a second trigger is a guarded no-op) ----
const room3 = new Room({ code: 'T14', bus: { send() {}, broadcast() {} }, store: Store });
room3.players.push({ id: 'h', name: 'H', isBot: false, connected: true, score: 0 });
const votesP = room3.collectVotes('crown', ['sublime', 'troll']);
const c14 = room3._collect; // live collection (resolved is unset/false here)
room3.castVote('h', 'sublime', 'x'); room3.castVote('h', 'troll', 'y'); // all fields in -> resolves
await votesP;
c14.resolved === true ? ok('C14 collection marked resolved after completion') : bad('C14 resolved flag not set');
room3._collect === null ? ok('C14 active collection cleared on resolve') : bad('C14 did not clear _collect');
let threw = false; try { c14.resolve(); } catch { threw = true; }
(!threw && room3._collect === null) ? ok('C14 second resolve is a guarded no-op') : bad('C14 double-resolve was not guarded');

// ---- C1: production refuses a weak JWT secret ----
const child = spawn(process.execPath, ['src/index.js'], {
  env: { ...process.env, NODE_ENV: 'production', JWT_SECRET: 'short', PORT: '4999' },
  cwd: process.cwd(),
});
let cerr = '';
child.stderr.on('data', (d) => (cerr += d));
child.on('exit', (code) => {
  code !== 0 ? ok(`C1 prod refuses weak JWT_SECRET (exit ${code})`) : bad('C1 booted with a weak secret in prod');
  console.log(fails ? '\nPATCH CHECKS: FAIL\n' : '\nPATCH CHECKS: PASS\n');
  process.exit(fails ? 1 : 0);
});
setTimeout(() => { child.kill(); bad('C1 child did not exit in time'); process.exit(1); }, 6000);
