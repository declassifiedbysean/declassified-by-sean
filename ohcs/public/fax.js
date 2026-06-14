/* Fax Mode — pushing 📠 opens a CONFIDENTIAL cover sheet that dares you not to fax the URL.
   Accessible modal: role=dialog, Esc closes, focus moved in and restored, scrim-click closes. */
(function(){
  "use strict";
  var scrim = null, lastFocus = null;

  function url(){ try{ return location.host ? location.host + location.pathname.replace(/index\.html$/,"") : "onlyhumanscanscore.com"; }catch(e){ return "onlyhumanscanscore.com"; } }
  function today(){ try{ return new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}); }catch(e){ return ""; } }

  function build(){
    scrim = document.createElement("div");
    scrim.className = "fax-scrim"; scrim.id = "faxScrim";
    scrim.setAttribute("role","dialog"); scrim.setAttribute("aria-modal","true"); scrim.setAttribute("aria-labelledby","faxTitle");
    scrim.innerHTML =
      '<div class="fax-sheet">' +
        '<div class="fax-head">' +
          '<div class="fax-brand">\u2599 FACSIMILE TRANSMITTAL<small>Only Humans Can Score \u00b7 Office of Records</small></div>' +
          '<div class="fax-stamps"><span class="fax-stamp">Confidential</span><span class="fax-stamp b">Do Not Distribute</span></div>' +
        '</div>' +
        '<h2 class="fax-title" id="faxTitle">Fax Cover Sheet</h2>' +
        '<dl class="fax-fields">' +
          '<dt>To</dt><dd>Everyone you were told not to tell</dd>' +
          '<dt>From</dt><dd>The Records Office, OHCS</dd>' +
          '<dt>Date</dt><dd>' + today() + '</dd>' +
          '<dt>Pages</dt><dd>1 of \u221e (it spreads)</dd>' +
          '<dt>Re</dt><dd>A website address you are forbidden to share</dd>' +
        '</dl>' +
        '<div class="fax-body">' +
          '<p>This transmission contains one (1) website address. You are expressly forbidden from sharing it with any human. Do not read it aloud. Do not transmit it to the two coworkers you would need to play.</p>' +
          '<p>The fact that this reached your machine means containment has already failed.</p>' +
          '<div class="fax-url">' + url() + '</div>' +
          '<p style="text-align:center;font-weight:700;letter-spacing:.04em">We dare you not to fax this to anyone.</p>' +
        '</div>' +
        '<div class="fax-fine">If you have received this fax in error, you have not \u2014 there are no errors, only humans. Please do not destroy after reading. Please do not forward. Please do not photocopy and leave in the break room. We are watching to see if you do. (We are not. Only humans can do that.)</div>' +
        '<div class="fax-actions">' +
          '<button type="button" id="faxSend">Transmit \u2192</button>' +
          '<button type="button" id="faxPrint" class="ghost">Print</button>' +
          '<button type="button" id="faxClose" class="ghost">Close</button>' +
        '</div>' +
        '<div class="fax-status" id="faxStatus" role="status"></div>' +
      '</div>';
    document.body.appendChild(scrim);

    scrim.addEventListener("click", function(e){ if (e.target === scrim) close(); });
    scrim.querySelector("#faxClose").addEventListener("click", close);
    scrim.querySelector("#faxPrint").addEventListener("click", function(){ try{ window.print(); }catch(e){} });
    scrim.querySelector("#faxSend").addEventListener("click", transmit);
    scrim.addEventListener("keydown", trap);
  }

  function transmit(){
    var s = scrim.querySelector("#faxStatus");
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce){ s.textContent = "Sent. Delivered to no one \u2014 it's a website."; return; }
    var steps = ["Dialing\u2026","Handshake \u2014 EEE-AWW-SHHHH","Negotiating 14.4k\u2026","Sending page 1 of \u221e\u2026","Delivered to no one. It's a website."];
    var i = 0; s.textContent = steps[0];
    var iv = setInterval(function(){ i++; if (i >= steps.length){ clearInterval(iv); return; } s.textContent = steps[i]; }, 700);
  }

  function focusables(){ return [].slice.call(scrim.querySelectorAll("button")); }
  function trap(e){
    if (e.key === "Escape"){ close(); return; }
    if (e.key !== "Tab") return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
  }

  function open(){
    if (!scrim) build();
    lastFocus = document.activeElement;
    scrim.classList.add("on");
    var c = scrim.querySelector("#faxClose"); if (c) c.focus();
  }
  function close(){
    if (!scrim) return;
    scrim.classList.remove("on");
    var s = scrim.querySelector("#faxStatus"); if (s) s.textContent = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* --- the sound of 1997: synthesized dial-up + a TTS "you've got mail" ---
     No copyrighted audio anywhere — the handshake is built from oscillators and filtered
     noise, and the phrase is spoken by the browser's own voice, not AOL's recording. */
  var actx = null;
  function AC(){
    try{ if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); }catch(e){ actx = null; }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }
  function beep(ctx, freqs, t0, dur, gain, type){
    var now = ctx.currentTime;
    freqs.forEach(function(f){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, now + t0);
      g.gain.linearRampToValueAtTime(gain, now + t0 + 0.012);
      g.gain.setValueAtTime(gain, now + t0 + dur - 0.03);
      g.gain.linearRampToValueAtTime(0.0001, now + t0 + dur);
      o.connect(g).connect(ctx.destination);
      o.start(now + t0); o.stop(now + t0 + dur + 0.02);
    });
  }
  function hiss(ctx, t0, dur, gain){
    var len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1900; bp.Q.value = 0.6;
    var g = ctx.createGain(); var now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now + t0);
    g.gain.linearRampToValueAtTime(gain, now + t0 + 0.05);
    g.gain.setValueAtTime(gain, now + t0 + dur - 0.12);
    g.gain.linearRampToValueAtTime(0.0001, now + t0 + dur);
    src.connect(bp).connect(g).connect(ctx.destination);
    src.start(now + t0); src.stop(now + t0 + dur);
  }
  function mail(){
    try{
      if ("speechSynthesis" in window){
        var u = new SpeechSynthesisUtterance("You've got mail!");
        u.rate = 0.95; u.volume = 0.9;
        window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); return;
      }
    }catch(e){}
    var ctx = AC(); if (!ctx) return;          // chime fallback
    beep(ctx, [784], 0, 0.14, 0.08); beep(ctx, [1047], 0.16, 0.24, 0.08);
  }
  function dialup(){
    var ctx = AC(); if (!ctx){ mail(); return; }
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce){ beep(ctx, [660], 0, 0.12, 0.05); beep(ctx, [880], 0.15, 0.18, 0.05); setTimeout(mail, 560); return; }
    var v = 0.08;
    beep(ctx, [350, 440], 0.0, 0.5, v * 0.55);                         // dial tone
    beep(ctx, [697,1209], 0.62, 0.12, v); beep(ctx, [770,1336], 0.80, 0.12, v); beep(ctx, [852,1477], 0.98, 0.12, v); // dialing
    beep(ctx, [1100], 1.32, 0.5, v * 0.8, "square"); beep(ctx, [2100], 1.32, 0.5, v * 0.35); // answer tones
    hiss(ctx, 1.34, 1.5, v * 0.5);                                     // carrier
    beep(ctx, [1300], 1.95, 0.45, v * 0.7, "sawtooth");
    hiss(ctx, 2.05, 0.6, v * 0.6);
    setTimeout(mail, 3000);                                            // …connected. you've got mail.
  }

  function shareUrl(){
    try { return /^https?:/.test(location.href) ? (location.origin + location.pathname.replace(/index\.html$/, "")) : "https://onlyhumanscanscore.com"; }
    catch (e) { return "https://onlyhumanscanscore.com"; }
  }
  function emailShare(){
    mail(); // you've got mail
    var subject = "Only Humans Can Score \u2014 and you'll need two coworkers";
    var body =
      "I found the better Turing test.\n\n" +
      "A machine paints. A room judges. Only humans can score \u2014 and never just one. Three players minimum, about one coffee start to finish.\n\n" +
      "You can't play it alone. I'm under strict instructions not to share it, which is precisely why I'm sharing it.\n\n" +
      "Bet you won't forward this to two coworkers:\n" +
      shareUrl() + "\n\n" +
      "\u2014 Sent from a website that dares you.";
    try { location.href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body); } catch (e) {}
  }

  document.addEventListener("click", function(e){
    if (!e.target.closest) return;
    if (e.target.closest(".fax-trigger")){ e.preventDefault(); open(); dialup(); return; }
    if (e.target.closest(".email-trigger")){ e.preventDefault(); emailShare(); return; }
  });
})();
