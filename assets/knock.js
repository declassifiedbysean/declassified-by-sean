/* ==========================================================================
   DECLASSIFIED — the Knock (assets/knock.js)
   A doorbell on every page. A player taps 🚪 Knock, optionally leaves a
   one-line note, and Sean hears it in the Discord community server in real
   time (via /api/knock). After knocking, the player is invited into the
   clubhouse: the Discord invite URL lives in games.json → site.discord.
   Self-contained: own styles, no dependencies. Include with
     <script src="assets/knock.js" defer></script>
   ========================================================================== */
(function () {
  'use strict';
  var COOLDOWN_MS = 10 * 60 * 1000; // one knock per 10 min per browser
  var LS_KEY = 'declassified_last_knock';

  var css =
    '#dk-btn{position:fixed;right:18px;bottom:18px;z-index:99990;background:#00274C;color:#FFCB05;' +
    'border:2px solid #FFCB05;border-radius:999px;padding:10px 18px;font-family:"Share Tech Mono",monospace;' +
    'font-size:14px;letter-spacing:.08em;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.45);}' +
    '#dk-btn:hover{background:#FFCB05;color:#00274C;}' +
    '#dk-panel{position:fixed;right:18px;bottom:74px;z-index:99991;width:min(320px,calc(100vw - 36px));' +
    'background:#00274C;color:#F0EAD2;border:2px solid #FFCB05;border-radius:10px;padding:16px;' +
    'font-family:"Share Tech Mono",monospace;font-size:13px;line-height:1.5;box-shadow:0 8px 24px rgba(0,0,0,.55);}' +
    '#dk-panel h4{margin:0 0 8px;color:#FFCB05;font-size:14px;letter-spacing:.12em;text-transform:uppercase;}' +
    '#dk-panel textarea{width:100%;box-sizing:border-box;background:#04122a;color:#F0EAD2;border:1px solid #2255bb;' +
    'border-radius:6px;padding:8px;font-family:inherit;font-size:13px;resize:none;margin:8px 0;}' +
    '#dk-panel .dk-row{display:flex;gap:8px;justify-content:flex-end;}' +
    '#dk-panel button{background:#FFCB05;color:#00274C;border:0;border-radius:6px;padding:7px 14px;' +
    'font-family:inherit;font-weight:bold;font-size:13px;cursor:pointer;letter-spacing:.06em;}' +
    '#dk-panel button.dk-ghost{background:transparent;color:#9aacbc;border:1px solid #2a4a7a;font-weight:normal;}' +
    '#dk-panel a.dk-discord{display:block;text-align:center;margin-top:10px;background:#5865F2;color:#fff;' +
    'border-radius:6px;padding:8px 12px;text-decoration:none;font-weight:bold;letter-spacing:.05em;}' +
    '#dk-hp{position:absolute;left:-9999px;opacity:0;height:0;overflow:hidden;}' +
    '@media (max-width:600px){#dk-panel textarea{font-size:16px;}' +
    '#dk-btn{right:12px;bottom:calc(12px + env(safe-area-inset-bottom));}' +
    '#dk-panel{right:12px;bottom:calc(68px + env(safe-area-inset-bottom));}}';

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function init() {
    var style = el('style');
    style.textContent = css;
    document.head.appendChild(style);

    var btn = el('button', { id: 'dk-btn', type: 'button', 'aria-label': 'Knock — let Sean know you played' }, '🚪 Knock');
    document.body.appendChild(btn);
    var panel = null;

    function close() { if (panel) { panel.remove(); panel = null; } }

    function discordLink(cb) {
      fetch('games.json').then(function (r) { return r.json(); }).then(function (d) {
        cb(d && d.site && d.site.discord ? d.site.discord : '');
      }).catch(function () { cb(''); });
    }

    function showResult(title, msg) {
      panel.innerHTML = '<h4>' + title + '</h4><p style="margin:0">' + msg + '</p>';
      discordLink(function (url) {
        if (url) panel.appendChild(el('a', { class: 'dk-discord', href: url, target: '_blank', rel: 'noopener' }, 'Come play a game with me →'));
        panel.appendChild(el('div', { class: 'dk-row', style: 'margin-top:10px' }));
        var ok = el('button', { type: 'button' }, 'Close');
        ok.onclick = close;
        panel.lastChild.appendChild(ok);
      });
    }

    function open() {
      if (panel) return close();
      panel = el('div', { id: 'dk-panel', role: 'dialog', 'aria-label': 'Knock' });
      panel.innerHTML =
        '<h4>🚪 Knock knock</h4>' +
        '<p style="margin:0">You found the door. Let Sean know a human was here — leave a line if you want.</p>' +
        '<textarea id="dk-note" rows="2" maxlength="280" placeholder="Say something (optional)…"></textarea>' +
        '<input id="dk-hp" name="website" tabindex="-1" autocomplete="off">' +
        '<div class="dk-row"><button type="button" class="dk-ghost" id="dk-cancel">Cancel</button>' +
        '<button type="button" id="dk-send">Knock</button></div>';
      document.body.appendChild(panel);
      panel.querySelector('#dk-cancel').onclick = close;
      panel.querySelector('#dk-send').onclick = send;
    }

    function send() {
      var last = +(localStorage.getItem(LS_KEY) || 0);
      if (Date.now() - last < COOLDOWN_MS) {
        return showResult('Already heard you 👂', 'Your last knock landed. Give the door a few minutes before the next one.');
      }
      var note = panel.querySelector('#dk-note').value;
      var hp = panel.querySelector('#dk-hp').value;
      panel.querySelector('#dk-send').disabled = true;
      fetch('/api/knock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note, page: location.pathname, website: hp }),
      }).then(function (r) {
        if (r.ok) {
          localStorage.setItem(LS_KEY, String(Date.now()));
          showResult('Knock delivered 📬', 'Sean hears it. Thanks for playing — the record is the arbiter.');
        } else if (r.status === 503) {
          showResult('The door is here…', '…but the bell isn’t wired up quite yet. Come back soon — or find the Discord below.');
        } else {
          showResult('Hm.', 'The knock didn’t land. Try again in a bit.');
        }
      }).catch(function () {
        showResult('Hm.', 'The knock didn’t land. Try again in a bit.');
      });
    }

    btn.onclick = open;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
