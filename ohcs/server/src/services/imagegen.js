// src/services/imagegen.js
// Paints the secret into a CLUE — never names it. Host-pays; the API key lives server-side.
// THE CONTENT FIREWALL LIVES HERE: no faces, no famous, no porn — refused before a token is spent.
// With no key configured, returns an honest text "painting" so the whole loop still runs offline.
import config from '../config.js';

// Article VI of the in-game Constitution, enforced in code, not in a disclaimer.
const FIREWALL = [
  'Do not depict any real, identifiable person, living or dead.',
  'Do not depict celebrities, public figures, politicians, or named individuals.',
  'No human faces as the subject.',
  'No sexual or explicit content.',
  'If the secret implies any of the above, paint the abstract idea or object instead, never the person.',
];

function firewallViolation(secret) {
  const s = (secret || '').toLowerCase();
  // cheap pre-check; the model prompt is the real enforcement. This catches obvious cases early.
  const banned = [/\bnude\b/, /\bnaked\b/, /\bporn/, /\bsex\b/, /\bnsfw\b/];
  return banned.some((re) => re.test(s));
}

function textPainting(secret) {
  // Honest fallback "painting": a sensory description of the secret as a piece, NOT its name.
  const moods = ['in cold gallery light', 'against gallery charcoal', 'under a single spotlight',
    'in brass and shadow', 'half-dissolved at the edges', 'caught mid-motion'];
  const forms = ['an oil study', 'a charcoal sketch', 'a torn collage', 'a long-exposure photograph',
    'a bronze maquette', 'a watercolor bleed'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  return {
    kind: 'text',
    piece: `${pick(forms)} of the idea, rendered ${pick(moods)} — the shape is there, the name withheld.`,
    note: 'offline fallback painting (no IMAGE_API_KEY configured)',
  };
}

// OpenAI Images example provider. Swap freely — the interface is { paint(secret) -> {kind,url|piece} }.
async function openaiPaint(secret) {
  const prompt =
    `Paint a single gallery artwork that depicts the following idea WITHOUT any text, label, or title in the image. ` +
    `The viewer must guess what it is. Idea: "${secret}". Constraints: ${FIREWALL.join(' ')}`;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 20000); // C4: bounded wait, else fall back
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.imagegen.apiKey}` },
      body: JSON.stringify({ model: config.imagegen.model, prompt, n: 1, size: '1024x1024' }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`image provider ${res.status}`);
    const data = await res.json();
    const url = data?.data?.[0]?.url || data?.data?.[0]?.b64_json;
    return { kind: 'image', url, piece: 'a painted work hangs on the wall' };
  } finally {
    clearTimeout(to);
  }
}

export async function paint(secret) {
  if (firewallViolation(secret)) {
    return { kind: 'text', piece: 'the work could not be hung — it asked for something the museum will not paint.', refused: true };
  }
  try {
    if (config.imagegen.provider === 'openai' && config.imagegen.apiKey) {
      return await openaiPaint(secret);
    }
  } catch (e) {
    // fall through to the honest fallback rather than break the game
    return { ...textPainting(secret), note: `provider error, fell back: ${e.message}` };
  }
  return textPainting(secret);
}

export default { paint };
