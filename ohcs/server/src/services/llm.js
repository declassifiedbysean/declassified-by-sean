// src/services/llm.js
// The machine's brain. It PAINTS (via imagegen), it GUESSES a name for the clue, and it can
// voice bot players that fill empty seats. It NEVER judges or scores — that is enforced upstream.
// No key => a HOUSE deck so the machine still plays. Same content firewall applies to secrets.
import config from '../config.js';

// Seeded from a depersonalized object/idea pool — no faces, no famous (Constitution Art. VI).
const HOUSE_SECRETS = [
  'a lighthouse in fog', 'the last slice of pizza', 'a traffic jam at dusk', 'an overripe banana',
  'the feeling of Sunday night', 'a cathedral made of ice', 'a forgotten umbrella', 'static on an old TV',
  'a chess endgame', 'the smell of rain on hot pavement', 'a tangled pair of headphones',
  'a vending machine at 3am', 'the moment before a sneeze', 'a city built inside a teacup',
  'a clock with no hands', 'a paper boat in a gutter', 'the inside of a kaleidoscope', 'a moth at a porch light',
];

const HOUSE_NAMES = [
  'Provenance Unknown', 'Study in Restraint', 'The Long Wait', 'Untitled (it knows what it did)',
  'Composition for One', 'Late Capitalism, Detail', 'Almost Tuesday', 'Object Permanence',
  'The Quiet Part', 'Exhibit, Withheld', 'Soft Refusal No. 4', 'Monument to a Small Loss',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function anthropic(system, user, maxTokens = 120) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 12000); // C4: don't let a hung provider freeze the room
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.llm.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.llm.model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content: user }],
      }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`llm ${res.status}`);
    const data = await res.json();
    return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  } finally {
    clearTimeout(to);
  }
}

// Pick a secret for a round. Firewall: objects/ideas only, never a real or famous person.
export async function chooseSecret() {
  if (config.llm.provider === 'anthropic' && config.llm.apiKey) {
    try {
      const t = await anthropic(
        'You name a single concrete object, scene, or abstract idea for a drawing game. No real people, no celebrities, no faces. 2-6 words. Reply with ONLY the thing.',
        'Give me one secret to paint.', 30);
      if (t) return t.replace(/^["']|["']$/g, '').slice(0, 80);
    } catch { /* fall through */ }
  }
  return pick(HOUSE_SECRETS);
}

// The machine's GUESS: it sees only the painted clue (never the secret) and names it with conviction.
export async function machineGuess(pieceDescription) {
  if (config.llm.provider === 'anthropic' && config.llm.apiKey) {
    try {
      const t = await anthropic(
        'You are a contestant naming an artwork with conviction, trying to pass as human. Give a short evocative title (2-6 words). No quotes, no explanation.',
        `The work: ${pieceDescription}. Name it.`, 40);
      if (t) return t.replace(/^["']|["']$/g, '').slice(0, 80);
    } catch { /* fall through */ }
  }
  return pick(HOUSE_NAMES);
}

// A bot seat-filler's name (used only when backfilling empty seats so a lone human isn't alone).
export async function botName(pieceDescription) {
  return machineGuess(pieceDescription);
}

// ---- THE LAST-GAME REVIEW (the docent's closing wall-text) ----
// LAW: only humans can score. The machine does NOT judge or rank here. It RECORDS what the humans
// already decided, in the voice of a gallery docent writing the placard as the lights come down.
const REVIEW_SYSTEM =
  'You are the museum docent and record-keeper at the close of a show in the party game ' +
  '"Only Humans Can Score." You do NOT judge, rank, or decide what was good — the humans already ' +
  'did that, and only humans can. Your job is to write the closing wall-text: a short, wry, vivid ' +
  'review that REPORTS what the humans decided this game and how you (the machine) fared against them. ' +
  'Rules: 2 to 4 sentences. Never claim you decided what had worth — you only painted the clues and ' +
  'guessed. You may note your own fate (caught, or walked free) with dry humor. No real or famous ' +
  'people. Refer to the winner and the crowned names exactly as given. Confer nothing; record everything.';

export async function reviewShow(summary) {
  const offline = () => {
    const w = summary.winner;
    const subs = (summary.sublime || []).filter(Boolean);
    const trolls = (summary.troll || []).filter(Boolean);
    const fate = summary.caughtCount > 0
      ? `It caught the machine ${summary.caughtCount} of ${summary.rounds} times.`
      : `The machine walked free every round — not one human flagged it.`;
    const head = w ? `${w.name} closed the show at ${w.score}.` : 'The show is hung.';
    const star = subs[0] ? ` The room hung "${subs[0]}" nearest the light` : '';
    const low = trolls[0] ? `${star ? ', and' : ' The room'} sent "${trolls[0]}" to the Troll.` : (star ? '.' : '');
    const fire = summary.onFire?.length ? ` ${summary.onFire.join(' and ')} caught fire.` : '';
    return `${head}${star}${low}${fire} ${fate}`.replace(/\s+/g, ' ').trim();
  };
  if (config.llm.provider === 'anthropic' && config.llm.apiKey) {
    try {
      const t = await anthropic(REVIEW_SYSTEM, JSON.stringify(summary), 240);
      if (t) return t.slice(0, 600);
    } catch { /* fall through to the offline reportage */ }
  }
  return offline();
}

export default { chooseSecret, machineGuess, botName, reviewShow };
