/* narration.js — "Sean reads the game files" mode.
   Plays PRE-RENDERED audio clips (one file per line) keyed by id. Agnostic to how the
   audio was made: record it yourself, or clone-and-render — same manifest either way.
   No live TTS, no third-party request at runtime: clips are self-hosted under voice/.
   Keeps the CSP clean (media-src 'self'). Falls back silently if a clip is missing.
   API: window.OHCSVoice { on, off, toggle, isOn, say(id), available } */
(function(){
  "use strict";
  var enabled=false, base="voice/", ext=".mp3", cache={}, current=null;
  // Which line-ids actually have a recorded clip. Populated from voice/manifest.json if present;
  // until you drop audio in, this stays empty and the mode no-ops gracefully.
  var have={};

  function load(){
    try{
      fetch(base+"manifest.json",{cache:"no-store"})
        .then(function(r){ return r.ok?r.json():null; })
        .then(function(j){ if(j&&j.lines){ j.lines.forEach(function(id){ have[id]=true; }); if(j.ext) ext=j.ext; } })
        .catch(function(){});
    }catch(e){}
  }
  function clip(id){
    if(cache[id]) return cache[id];
    var a=new Audio(base+id+ext); a.preload="none"; cache[id]=a; return a;
  }
  function say(id){
    if(!enabled || !id || !have[id]) return;          // no clip → silent no-op
    try{
      if(current){ current.pause(); current.currentTime=0; }
      var a=clip(id); current=a; a.currentTime=0;
      var p=a.play(); if(p&&p.catch) p.catch(function(){}); // autoplay/gesture guards
    }catch(e){}
  }
  function ON(){ enabled=true; }
  function OFF(){ enabled=false; if(current){ try{current.pause();}catch(e){} } }

  load();
  window.OHCSVoice = {
    on: ON, off: OFF,
    toggle: function(){ enabled?OFF():ON(); return enabled; },
    isOn: function(){ return enabled; },
    say: say,
    available: function(){ return Object.keys(have).length>0; }
  };
})();
