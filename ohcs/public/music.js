/* music.js — generative game music that RECOMPILES from the live score.
   Four selectable genres, all synthesized in Web Audio (no audio files, nothing to license):
     ambient  — "museum after midnight": drone + pad + plucked bells, warms minor→Lydian
     country  — fingerpicked open strings + root–fifth bass walk, brushed backbeat
     rap      — boom-bap: punchy kick/snare, sub-bass, sparse minor stab    (painter: TODO)
     jazz     — brushed swing kit, walking bass, ii–V comp stabs            (painter: TODO)
   The score drives brightness, density/tempo, and layer thickness in every genre.
   Audio control is provided (toggle); nothing plays before a user gesture — WCAG 1.4.2.
   API: window.OHSMusic { on, off, toggle, isOn, setScore, setGenre, getGenre } */
(function(){
  "use strict";
  var ctx=null, master=null, bright=null, revGain=null, conv=null, busDry=null;
  var on=false, started=false, score=0, timer=null, nextT=0, stepN=0;
  var genre="ambient";
  var ambientNodes={ drone:[], padGain:null, shimmerOn:false };

  var SCALES={ minorPenta:[0,3,5,7,10], dorian:[0,2,3,5,7,9,10], majorPenta:[0,2,4,7,9], lydian:[0,2,4,6,7,9,11] };
  var MROOT=220; // melody root; bass/drone sit below

  function tier(){ return score/(score+30); }                 // 0..1 gentle asymptote
  function cutoff(){ return 500 + tier()*4800; }
  function hz(off, oct){ return MROOT*Math.pow(2,(off+(oct||0))/12); }

  /* ---------- shared graph ---------- */
  function impulse(dur, decay){
    var len=Math.floor(ctx.sampleRate*dur), b=ctx.createBuffer(2,len,ctx.sampleRate);
    for(var ch=0;ch<2;ch++){ var d=b.getChannelData(ch); for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); }
    return b;
  }
  function osc(type,freq,dest,g){
    var o=ctx.createOscillator(), gn=ctx.createGain();
    o.type=type; o.frequency.value=freq; gn.gain.value=g||1; o.connect(gn).connect(dest); o.start(); return {o:o,g:gn};
  }
  function buildGraph(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
    bright=ctx.createBiquadFilter(); bright.type='lowpass'; bright.frequency.value=cutoff(); bright.Q.value=0.4; bright.connect(master);
    busDry=ctx.createGain(); busDry.gain.value=0.9; busDry.connect(bright);
    conv=ctx.createConvolver(); conv.buffer=impulse(2.6,2.4); revGain=ctx.createGain(); revGain.gain.value=0.35; conv.connect(revGain).connect(bright);
    buildAmbientBeds();
  }
  // ambient drone+pad live for the whole session; gated to 0 when another genre is active
  function buildAmbientBeds(){
    [55,82.41].forEach(function(f){ var v=osc('sine',f,busDry,0.0);
      var lfo=ctx.createOscillator(), la=ctx.createGain(); lfo.frequency.value=0.07+Math.random()*0.05; la.gain.value=0.05; lfo.connect(la).connect(v.g.gain); lfo.start(); ambientNodes.drone.push(v); });
    ambientNodes.padGain=ctx.createGain(); ambientNodes.padGain.gain.value=0; ambientNodes.padGain.connect(busDry);
    [110,164.81,220].forEach(function(f){ osc('triangle',f,ambientNodes.padGain,0.06); });
  }

  /* ---------- voices ---------- */
  // plucked/struck tone with a quick attack and exponential tail
  function pluck(type, freq, t, dur, gain, sendRev){
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'triangle'; o.frequency.value=freq;
    g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(gain,t+0.008); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(busDry); if(sendRev) g.connect(conv);
    o.start(t); o.stop(t+dur+0.05);
  }
  // noise burst shaped by a band/lowpass — brushes, hats, snare body
  function noise(t, dur, gain, type, freq, q){
    var len=Math.floor(ctx.sampleRate*Math.max(0.02,dur)), b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=(Math.random()*2-1);
    var src=ctx.createBufferSource(); src.buffer=b;
    var f=ctx.createBiquadFilter(); f.type=type||'highpass'; f.frequency.value=freq||4000; f.Q.value=q||0.7;
    var g=ctx.createGain(); g.gain.setValueAtTime(gain,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    src.connect(f).connect(g).connect(busDry); src.start(t); src.stop(t+dur+0.02);
  }

  /* ---------- genre painters ----------
     each paints ONE 16th-step at absolute time t given step index s (0..15 bar position). */

  // AMBIENT — free, non-metric: ignores bar position, sprinkles bells by density.
  function paintAmbient(t, s){
    var sc=tier()<0.25?SCALES.minorPenta : tier()<0.5?SCALES.dorian : tier()<0.75?SCALES.majorPenta : SCALES.lydian;
    if(Math.random() < 0.16 + tier()*0.5){
      var off=sc[Math.floor(Math.random()*sc.length)], oct=[-12,0,0,12][Math.floor(Math.random()*4)];
      pluck('triangle', hz(off,oct), t, 1.4+Math.random()*0.8, 0.09, true);
      if(ambientNodes.shimmerOn && Math.random()<0.12) pluck('sine', hz(off,24), t+0.02, 2.2, 0.04, true);
    }
  }

  // COUNTRY — fingerpicked, major-pentatonic, root–fifth bass walk, brushed backbeat.
  // Travis-pick feel: bass alternates root(beat0)/fifth(beat2); melody picks on offbeats.
  var COUNTRY=[0,2,4,7,9]; // major pentatonic offsets
  function paintCountry(t, s){
    var beat = s % 4 === 0;                 // quarter pulse
    // alternating bass: root on beats 0 & 2's downbeats, fifth on 1 & 3
    if(s===0)  pluck('triangle', hz(0,-24), t, 0.5, 0.16, false);   // low root
    if(s===8)  pluck('triangle', hz(7,-24), t, 0.5, 0.14, false);   // low fifth
    if(s===4)  pluck('triangle', hz(7,-24), t, 0.45,0.11, false);
    if(s===12) pluck('triangle', hz(4,-24), t, 0.45,0.11, false);   // third gives the lift
    // brushed backbeat on 2 & 4 (steps 4 and 12), soft snare-ish noise
    if(s===4 || s===12) noise(t, 0.12, 0.05+tier()*0.05, 'bandpass', 2200, 0.8);
    // light "tick" hat on every quarter as score rises
    if(beat && Math.random() < 0.3 + tier()*0.5) noise(t, 0.03, 0.02+tier()*0.03, 'highpass', 7000, 0.6);
    // fingerpicked melody on offbeat 8ths/16ths, density from score
    var pick = (s%2===1);
    if(pick && Math.random() < 0.22 + tier()*0.55){
      var off=COUNTRY[Math.floor(Math.random()*COUNTRY.length)];
      var oct=[0,0,12][Math.floor(Math.random()*3)];
      pluck('triangle', hz(off,oct), t, 0.6+Math.random()*0.5, 0.07+tier()*0.03, true);
    }
  }

  // RAP / JAZZ — painters land next pass once country is heard & tuned.
  function paintRap(t,s){ paintCountry(t,s); }   // placeholder routes to country until built
  function paintJazz(t,s){ paintAmbient(t,s); }  // placeholder routes to ambient until built

  function painter(){ return genre==='country'?paintCountry : genre==='rap'?paintRap : genre==='jazz'?paintJazz : paintAmbient; }

  /* ---------- clock ---------- */
  // metric genres use a 16-step bar; ambient is free but we still tick the grid.
  function stepDur(){
    if(genre==='ambient') return 0.62 - tier()*0.2;          // slow, free
    var bpm = 76 + Math.round(tier()*26);                    // 76→~102 bpm as score climbs
    return (60/bpm)/4;                                       // 16th-note grid
  }
  function scheduler(){
    var paint=painter();
    while(nextT < ctx.currentTime + 0.12){
      paint(nextT, stepN % 16);
      nextT += stepDur(); stepN++;
    }
  }

  function applyScore(){
    if(!ctx) return; var t=ctx.currentTime;
    bright.frequency.setTargetAtTime(cutoff(), t, 1.0);
    // ambient beds only sound in ambient genre
    var amb = genre==='ambient';
    ambientNodes.padGain.gain.setTargetAtTime(amb && tier()>0.12 ? 0.5 : 0.0, t, 1.5);
    ambientNodes.drone.forEach(function(v){ v.g.gain.setTargetAtTime(amb?0.16:0.0, t, 1.5); });
    ambientNodes.shimmerOn = amb && tier()>0.55;
    revGain.gain.setTargetAtTime(amb?0.35:0.18, t, 1.0); // less wash on rhythmic genres
  }

  function ON(){
    if(on) return; on=true;
    if(!started){ buildGraph(); started=true; nextT=ctx.currentTime+0.1; timer=setInterval(scheduler,25); }
    if(ctx.state==='suspended') ctx.resume();
    master.gain.setTargetAtTime(0.16, ctx.currentTime, 1.0);
    applyScore();
  }
  function OFF(){ if(!on) return; on=false; if(master) master.gain.setTargetAtTime(0.0, ctx.currentTime, 0.5); }

  window.OHSMusic = {
    on: ON, off: OFF,
    toggle: function(){ on?OFF():ON(); return on; },
    isOn: function(){ return on; },
    setScore: function(n){ score=Math.max(0, n||0); applyScore(); },
    setGenre: function(g){ if(['ambient','country','rap','jazz'].indexOf(g)>=0){ genre=g; stepN=0; applyScore(); } return genre; },
    getGenre: function(){ return genre; }
  };
})();
