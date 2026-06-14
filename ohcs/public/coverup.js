/* Coverup Mode — type "classified" (or run the Konami code) to redact the page. Type it
   again, hit Esc, or click Declassify to lift it. Redacts only <main> prose; nav, footer,
   and controls stay usable. Text is never destroyed — wrapped in visual bars, restored on exit. */
(function(){
  "use strict";
  var TRIGGER = "classified";
  var KONAMI = ["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"];
  var WMS = ["CLASSIFIED","TOP SECRET","EYES ONLY","NOFORN","REDACTED"];
  var SEL = "main h1, main h2, main h3, main p, main li, main .lede, main .eyebrow, main .kicker";
  var buf = "", kbuf = [], on = false, saved = [];

  function block(len){ return "\u2586".repeat(Math.max(2, Math.min(len, 18))); }

  function redactEl(el){
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var texts = [], n;
    while ((n = walker.nextNode())) texts.push(n);
    texts.forEach(function(node){
      if (!node.nodeValue || !node.nodeValue.trim()) return;
      var parent = node.parentNode;
      if (parent && parent.classList && parent.classList.contains("rdct")) return;
      var toks = node.nodeValue.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      var prev = false; // cluster redactions into runs
      toks.forEach(function(tok){
        if (/^\s*$/.test(tok) || tok.length < 3){ frag.appendChild(document.createTextNode(tok)); if(/^\s*$/.test(tok)===false) prev=false; return; }
        var p = prev ? 0.7 : 0.4;
        if (Math.random() < p){
          var s = document.createElement("span");
          s.className = "rdct"; s.tabIndex = 0; s.title = "classified"; s.textContent = tok;
          var r = Math.random();
          if (tok.length >= 7 && r < 0.34){ s.classList.add("tag"); }
          else if (r < 0.7){ s.classList.add("blocks"); s.setAttribute("data-fill", block(tok.length)); }
          frag.appendChild(s); prev = true;
        } else { frag.appendChild(document.createTextNode(tok)); prev = false; }
      });
      parent.replaceChild(frag, node);
    });
  }

  function enable(){
    saved = [];
    [].forEach.call(document.querySelectorAll(SEL), function(el){
      if (el.closest(".cv-stamp")) return;
      saved.push({ el: el, html: el.innerHTML });
      redactEl(el);
    });
    var wm = document.createElement("div");
    wm.className = "cv-wm"; wm.id = "cvWm";
    wm.textContent = WMS[Math.floor(Math.random() * WMS.length)];
    wm.setAttribute("aria-hidden", "true");
    document.body.appendChild(wm);

    var bar = document.createElement("div");
    bar.className = "cv-stamp"; bar.id = "cvStamp"; bar.setAttribute("role", "status");
    bar.innerHTML = '<span>Shh \u2014 it\u2019s classified</span>' +
                    '<button type="button" id="cvOff" aria-label="Declassify the page">Declassify</button>';
    document.body.appendChild(bar);
    document.getElementById("cvOff").addEventListener("click", toggle);
  }

  function disable(){
    saved.forEach(function(s){ s.el.innerHTML = s.html; });
    saved = [];
    ["cvWm", "cvStamp"].forEach(function(id){ var e = document.getElementById(id); if (e) e.remove(); });
    var t = document.createElement("div");
    t.className = "cv-toast"; t.setAttribute("role", "status"); t.textContent = "Declassified";
    document.body.appendChild(t);
    setTimeout(function(){ if (t.parentNode) t.remove(); }, 1400);
  }

  function toggle(){ on = !on; if (on) enable(); else disable(); }

  document.addEventListener("keydown", function(e){
    var t = e.target;
    if (t && /^(input|textarea|select)$/i.test(t.tagName || "")) return;
    var k = (e.key || "").toLowerCase();
    // Konami unlock
    kbuf.push(k); if (kbuf.length > KONAMI.length) kbuf.shift();
    if (kbuf.length === KONAMI.length && kbuf.every(function(v, i){ return v === KONAMI[i]; })){ kbuf = []; toggle(); return; }
    // Esc closes
    if (on && k === "escape"){ toggle(); return; }
    // typed trigger
    if (k.length === 1){ buf = (buf + k).slice(-TRIGGER.length); if (buf === TRIGGER){ buf = ""; toggle(); } }
  });

  try {
    console.log("%cpsst \u2014 some things here are classified. type the word. (or \u2191\u2191\u2193\u2193\u2190\u2192\u2190\u2192 B A)",
                "font:12px ui-monospace,monospace;color:#6c6678");
  } catch (e){}
})();
