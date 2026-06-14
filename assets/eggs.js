/* eggs.js — a lightweight typed-code easter-egg engine for DECLASSIFIED. Standalone
   and self-styled (no dependence on site.css vars), so it can be dropped on any page
   with one <script> tag. Type a code word; an egg fires. Input-field-guarded.

   This is the SERIOUS site — it stays political on purpose. The editions here are
   overt by the site owner's explicit direction (see VOTE BLUE, the grand joke). */
(function () {
  'use strict';
  var buf = '';

  var st = document.createElement('style');
  st.textContent = [
    '.dbs-toast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);z-index:100051;max-width:90vw;',
    'font-family:"Share Tech Mono",ui-monospace,monospace;font-size:13px;line-height:1.6;text-align:center;',
    'padding:13px 18px;border-radius:10px;box-shadow:0 20px 60px -18px rgba(0,0,0,.8)}',
    '.dbs-veil{position:fixed;inset:0;z-index:100060;display:flex;align-items:center;justify-content:center;',
    'padding:24px;text-align:center;animation:dbsf .35s ease both;cursor:pointer;',
    'font-family:"Oswald",system-ui,sans-serif}',
    '@keyframes dbsf{from{opacity:0}to{opacity:1}}',
    '.dbs-veil h2{font-size:clamp(40px,12vw,104px);margin:0;letter-spacing:.04em;line-height:.96;font-weight:700}',
    '.dbs-veil p{font-family:"Share Tech Mono",monospace;font-size:14px;line-height:1.7;max-width:520px;margin:14px auto 0}',
    '.dbs-veil .x{margin-top:22px;font-family:"Share Tech Mono",monospace;font-size:12px;letter-spacing:.12em;',
    'text-transform:uppercase;border:1px solid currentColor;background:none;color:inherit;border-radius:8px;padding:11px 20px;cursor:pointer}',
    '.dbs-stripes{position:fixed;inset:0;z-index:100059;pointer-events:none;opacity:.16;',
    'background:repeating-linear-gradient(180deg,#b22234 0,#b22234 7.6%,#fff 7.6%,#fff 15.3%)}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);

  function toast(html, bg, fg, bd) {
    var t = document.createElement('div'); t.className = 'dbs-toast';
    t.style.background = bg; t.style.color = fg; t.style.border = '1px solid ' + bd;
    t.innerHTML = html; document.body.appendChild(t);
    setTimeout(function () { try { t.remove(); } catch (e) {} }, 6000);
  }
  function veil(bg, fg, html) {
    var v = document.createElement('div'); v.className = 'dbs-veil';
    v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true');
    v.style.background = bg; v.style.color = fg;
    v.innerHTML = '<div>' + html + '<br><button type="button" class="x" data-x>Close</button></div>';
    document.body.appendChild(v);
    function close() { try { v.remove(); } catch (e) {} document.removeEventListener('keydown', esc, true); }
    function esc(e) { if (e.key === 'Escape') close(); }
    v.addEventListener('click', function (e) { if (e.target === v || (e.target.closest && e.target.closest('[data-x]'))) close(); });
    document.addEventListener('keydown', esc, true);
    try { v.querySelector('[data-x]').focus(); } catch (e) {}
  }

  // ── USA / PATRIOTS: a stars-and-stripes flourish ──
  function usa() {
    var s = document.createElement('div'); s.className = 'dbs-stripes'; s.setAttribute('aria-hidden', 'true');
    document.body.appendChild(s); setTimeout(function () { try { s.remove(); } catch (e) {} }, 5000);
    toast('🇺🇸 <b>PATRIOTS EDITION</b> — true patriotism is checking the record before you salute the claim. <br>Dissent, documented, is the most American thing in this archive.', '#0a142e', '#eaf0ff', '#3c5ca8');
  }
  // ── 1600 PENNSYLVANIA: the address every claim here orbits ──
  function whitehouse() {
    toast('🏛 <b>1600 PENNSYLVANIA</b> — the address every claim in this archive orbits. <br>Power is the subject, not the source. Read the record.', '#16130a', '#f0e6c8', '#8a6f2e');
  }
  // ── VOTE BLUE: the grand joke (overt, by the owner's direction) ──
  function voteblue() {
    veil('linear-gradient(180deg,#0a1f5c,#06122f)', '#eaf0ff',
      '<h2 style="color:#fff">VOTE BLUE</h2>' +
      '<p>The grand joke of declassifiedbysean.com — except it isn’t one. Six acts of documented claims walked you here. The punchline is just a ballot.</p>' +
      '<p style="opacity:.8">— Sean. Now go read the record, then go vote.</p>');
  }

  // ── DAVID PAKMAN: a shoutout to sourced, independent commentary ──
  function pakman() {
    toast('🎙 <b>DAVID PAKMAN EDITION</b> — independent, sourced, unbothered.<br>Cite like him: claim, evidence, on the record. The opposite of a hot take.', '#0a142e', '#eaf0ff', '#3c5ca8');
  }

  var EGGS = [
    { re: /(usa|patriots)$/, fn: usa },
    { re: /(whitehouse|1600pennsylvania|1600penn)$/, fn: whitehouse },
    { re: /(davidpakman|pakman)$/, fn: pakman },
    { re: /voteblue$/, fn: voteblue }
  ];
  document.addEventListener('keydown', function (e) {
    if (!e.key || e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
    var n = e.target && e.target.nodeName; if (n === 'INPUT' || n === 'TEXTAREA' || n === 'SELECT' || (e.target && e.target.isContentEditable)) return;
    buf = (buf + e.key.toLowerCase()).replace(/[^a-z0-9]/g, '').slice(-16);
    for (var i = 0; i < EGGS.length; i++) { if (EGGS[i].re.test(buf)) { buf = ''; EGGS[i].fn(); break; } }
  });
  window.DBSEggs = { usa: usa, whitehouse: whitehouse, voteblue: voteblue };
})();
