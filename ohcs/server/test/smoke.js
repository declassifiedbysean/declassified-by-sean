// test/smoke.js — proves the whole stack boots and runs ONE full game end-to-end with bot-backfill.
// Fast settings via env, then a real WebSocket client auto-plays a private room to FINALE.
process.env.PORT = process.env.PORT || '4123';
process.env.NAME_SECONDS = '1';
process.env.QUEUE_WAIT_MS = '2000';
process.env.JWT_SECRET = 'test-secret';

const PORT = process.env.PORT;
const base = `http://localhost:${PORT}`;
let failed = false;
const fail = (m) => { console.error('  ✗', m); failed = true; };
const ok = (m) => console.log('  ✓', m);

await import('../src/index.js');                 // boot the server
await new Promise((r) => setTimeout(r, 400));    // let it listen

// health
const health = await fetch(`${base}/api/health`).then((r) => r.json());
health.ok ? ok('server is up; /api/health responds') : fail('health check failed');

// guest auth
const { token, user } = await fetch(`${base}/auth/guest`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ handle: 'Smoke' }),
}).then((r) => r.json());
token ? ok(`guest session minted (${user.handle})`) : fail('guest auth failed');

// connect ws and auto-play
const { WebSocket } = await import('ws');
const ws = new WebSocket(`ws://localhost:${PORT}/ws`);
let myCode = null, sawStart = false, rounds = 0, finale = null;

const send = (o) => ws.send(JSON.stringify(o));

ws.on('open', () => send({ t: 'auth', token }));
ws.on('message', (buf) => {
  const m = JSON.parse(buf.toString());
  if (m.t === 'auth.ok') { ok('ws authenticated'); send({ t: 'room.create' }); }
  if (m.t === 'room.joined') { myCode = m.code; ok(`private room created (${m.code}); bot-backfill on start`); send({ t: 'room.start', code: m.code }); }
  if (m.t === 'game.start') { sawStart = true; ok(`game started — ${m.rounds} rounds, ${m.players.length} seats (humans + bots)`); }
  if (m.t === 'phase') {
    if (m.name === 'PAINT') { rounds = m.round; setTimeout(() => send({ t: 'name.submit', name: `Title No.${m.round}` }), 50); }
    if (m.name === 'CROWN' && m.entries?.length >= 2) send({ t: 'crown.vote', sublime: m.entries[0].id, troll: m.entries[1].id });
    if (m.name === 'FLAG' && m.entries?.length) send({ t: 'flag.cast', entryId: m.entries[0].id });
    if (m.name === 'FINALE') { finale = m; done(); }
  }
});

function done() {
  sawStart ? ok('ran through the rounds') : fail('never started');
  rounds >= 3 ? ok(`reached round ${rounds}`) : fail(`only reached round ${rounds}`);
  finale?.scoreboard?.length ? ok(`FINALE with scoreboard of ${finale.scoreboard.length}`) : fail('no finale scoreboard');
  finale?.works?.length ? ok(`${finale.works.length} works produced & vaulted`) : fail('no works');
  finale?.review ? ok(`closing review (docent wall-text): "${finale.review.slice(0, 60)}…"`) : fail('no review');
  console.log(failed ? '\nSMOKE: FAIL\n' : '\nSMOKE: PASS — the codebase boots and plays a full game.\n');
  process.exit(failed ? 1 : 0);
}

setTimeout(() => { fail('timed out before finale'); done(); }, 30000);
