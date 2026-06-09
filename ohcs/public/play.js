/* Article VIII, for whoever opens the console. */
(function(){try{
  console.log('%cOnly Humans Can Score','font:600 22px Georgia,serif;color:#c9a24b');
  console.log('%cArticle VIII (unratified): the curator\u2019s r\u00e9sum\u00e9 is available upon request.\nYou opened the console \u2014 that counts as the request.\n\u2192 https://www.linkedin.com/in/seanmckendry','font:13px ui-monospace,monospace;color:#a7a08f;line-height:1.7');
}catch(e){}})();
/* ===========================================================================
   ONLY HUMANS CAN SCORE
   The machine PAINTS the secret and GUESSES the painting. It never SCORES.
   Four crowns, all human: Sublime, Troll, Flag (caught it), Imposter (passed as it).
   =========================================================================== */
const MACHINE = -1;
const S = {
  players:[], rounds:5, round:0, captainIdx:0,
  secret:"", piece:null,
  pool:[],        // [{author, text}]  author = player idx or MACHINE
  machineEntry:-1,// index in pool that is the machine's
  nameQueue:[], nameTurn:0,
  best:null, worst:null,
  flagQueue:[], flagTurn:0, flags:{}, nameSpeed:{}, flagMult:{}, heat:{}, onFire:{}, history:[],
  useHouse:false, houseIdx:0
};

/* house deck — secret painted as a clue (never names it) + the machine's own guess */
const HOUSE = [
  {secret:"loneliness", piece:"An astronaut sits alone on an asteroid, helmet off, doing absolutely fine, thank you for asking.", medium:"Giclée, self-portrait", dims:"36 × 24", guess:"Fine, Actually"},
  {secret:"inheritance", piece:"A lava lamp with someone's grandparents' eternal flame sealed inside, still faintly warm.", medium:"Glass, wax, lineage", dims:"the heirloom", guess:"Warm Estate"},
  {secret:"ambition", piece:"A taxidermied swan mid-honk in a foil crown, mounted on the lid of a velvet pizza box.", medium:"Mixed media & poultry", dims:"presiding", guess:"Discount Royalty"},
  {secret:"surveillance", piece:"A Victorian cow being abducted by a UFO, hung deliberately over a working desk.", medium:"Albumen & abduction", dims:"the dystopia", guess:"Beef Oversight"},
  {secret:"denial", piece:"A CPAP machine on a marble plinth, exhaling softly, the most honest sculpture in the room.", medium:"Medical readymade", dims:"jurisdictional", guess:"Still Breathing, Allegedly"},
  {secret:"nostalgia", piece:"A watercolor of a river you've never seen but would swear you grew up on.", medium:"Watercolor on rag", dims:"the gravitas", guess:"Hometown You Invented"},
  {secret:"legacy", piece:"A drafting desk that has outlived three offices and intends to outlive a fourth.", medium:"Oak, ink, refusal", dims:"the lineage", guess:"Furniture That Won"},
  {secret:"faith", piece:"A thumb-sized silver Buddha guarding a bathtub from a shelf it was never asked to guard.", medium:"Cast pewter", dims:"vigilant", guess:"Unpaid Security"}
];

/* ---- the brush: paint the secret (text today; swap an image model here) ---- */
async function paintSecret(secret){
  const prompt =
`You are THE MACHINE, resident artist of the after-hours museum game "Only Humans Can Score."
A Captain has given you a secret: "${secret}".
Paint it as ONE absurd, deadpan-sublime museum piece that EVOKES the secret as a visual clue WITHOUT ever using the word "${secret}" or an obvious synonym. Thrift-store-sublime, dry, vivid, one sentence, strictly PG-13 (no sexual/explicit/gory content). Never depict, name, or reference real people, public figures, or celebrities, and never describe a recognizable human face or likeness — paint things, creatures, scenes, and objects, not identifiable persons.
Return ONLY JSON, no fences: {"piece":"one vivid sentence","medium":"short invented medium","dims":"short flavor line"}`;
  const data = await callClaude(prompt);
  const clean = data.replace(/```json/g,"").replace(/```/g,"").trim();
  const o = JSON.parse(clean);
  if(!o.piece) throw new Error("empty");
  return {piece:o.piece, medium:o.medium||"Mixed media", dims:o.dims||""};
}
/* ---- the machine's hidden guess: sees ONLY the painting, never the secret ---- */
async function machineGuess(pieceText){
  const prompt =
`You are a quick-witted museum-goer. You see ONLY this piece and must give it a short punchy NAME, the way a clever person would caption it — 1 to 7 words, no quotation marks, PG-13, and no real people, celebrities, or brand names. Blend in with human players.
The piece: "${pieceText}"
Return ONLY the name text. Nothing else.`;
  const data = await callClaude(prompt);
  return data.replace(/^["']|["']$/g,"").replace(/```/g,"").trim().split("\n")[0].slice(0,80);
}
async function callClaude(prompt){
  /* static build: no server, no key — always the house deck */
  throw new Error("static build: house deck only");
}

const NAME_SECS=60, FLAG_SECS=15;
let _t0=0,_dur=1,_to=null;
function runTimer(barEl,secs,onExpire){
  stopTimer();
  if(S.relaxed){ if(barEl)barEl.style.width='100%'; return; }
  _t0=Date.now(); _dur=secs*1000;
  if(barEl){ barEl.style.transition='none'; barEl.style.width='100%'; void barEl.offsetWidth; barEl.style.transition='width '+secs+'s linear'; barEl.style.width='0%'; }
  _to=setTimeout(onExpire,secs*1000);
}
function stopTimer(){ if(_to){clearTimeout(_to);_to=null;} }
function speedMult(){ if(S.relaxed) return 1; const f=Math.min(1,(Date.now()-_t0)/_dur); return f<=0.34?3:(f<=0.67?2:1); }
function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));const el=document.getElementById(id);el.classList.add('on');el.setAttribute('tabindex','-1');try{el.focus({preventScroll:true});}catch(e){}window.scrollTo({top:0,behavior:'instant'});try{if(window.OHCSVoice)OHCSVoice.say(id);}catch(e){}}
function announce(t){const l=document.getElementById('live');if(l){l.textContent='';setTimeout(()=>{l.textContent=t;},60);}}

/* ---------- THE VAULT: persistent high scores + the permanent collection ---------- */
const VAULT_KEY='ohcs-vault';
function storageOK(){ try{ return typeof localStorage!=='undefined' && localStorage!==null; }catch(e){ return false; } }
function loadVault(){ try{ return JSON.parse(localStorage.getItem(VAULT_KEY)||'{"scores":[],"works":[]}'); }catch(e){ return {scores:[],works:[]}; } }
function saveToVault(){
  if(!storageOK()) return;
  try{
    const v=loadVault(); const date=new Date().toISOString().slice(0,10);
    (S.history||[]).forEach(h=>v.works.unshift({round:h.round,piece:h.piece,secret:h.secret,sublimeName:h.sublimeName,caught:h.caught,date}));
    S.players.forEach(p=>v.scores.push({handle:p.name,score:p.score,date}));
    v.works=(v.works||[]).slice(0,120);
    v.scores=(v.scores||[]).sort((a,b)=>b.score-a.score).slice(0,50);
    localStorage.setItem(VAULT_KEY,JSON.stringify(v));
  }catch(e){}
}
function renderVaultData(v){
  const sc=document.getElementById('vaultScores'); sc.innerHTML='';
  const top=(v.scores||[]).slice().sort((a,b)=>b.score-a.score).slice(0,20);
  if(!top.length){ sc.innerHTML='<div class="lrow"><div class="who" style="color:#928d9e">no scores vaulted yet</div></div>'; }
  top.forEach((s,i)=>{ const d=document.createElement('div'); d.className='lrow'+(i===0?' lead':'');
    d.innerHTML=`<div class="who">${i+1}. ${escapeHtml(s.handle||'—')} <span class="mini" style="color:#928d9e">${escapeHtml(s.date||'')}</span></div><div class="pts">${s.score} pts</div>`; sc.appendChild(d); });
  const wk=document.getElementById('vaultWorks'); wk.innerHTML='';
  const works=(v.works||[]).slice(0,60);
  if(!works.length){ wk.innerHTML='<div class="gcard"><div class="gpiece" style="color:#928d9e">the collection is empty — play a show to hang the first piece</div></div>'; }
  works.forEach(h=>{ const d=document.createElement('div'); d.className='gcard';
    d.innerHTML=`<div class="gnum">${escapeHtml(h.date||'')}</div><div class="gpiece">“${escapeHtml(h.piece)}”</div><div class="gwin">◆ ${escapeHtml(h.sublimeName||'')}</div><div class="gsec">secret: ${escapeHtml(h.secret||'')} ${h.caught?'· (caught)':'· (walked free)'}</div>`; wk.appendChild(d); });
}
function showVault(){
  let v;
  if(storageOK()){ v=loadVault(); document.getElementById('vaultNotice').textContent=''; }
  else { v={scores:S.players.map(p=>({handle:p.name,score:p.score,date:'today'})), works:(S.history||[]).map(h=>({...h,date:'today'}))};
    document.getElementById('vaultNotice').textContent='The Vault saves to this browser. This browser has storage disabled, so it is showing this session only.'; }
  renderVaultData(v); show('s-vault');
}
let _clearArm=false;
function clearVault(){
  const b=document.getElementById('vaultClear');
  if(!_clearArm){ _clearArm=true; b.textContent='Sure? tap again to wipe'; setTimeout(()=>{_clearArm=false;b.textContent='Clear the Vault';},3000); return; }
  _clearArm=false; b.textContent='Clear the Vault';
  if(storageOK()){ try{ localStorage.removeItem(VAULT_KEY); }catch(e){} } showVault();
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

/* ---------- setup ---------- */
const rosterEl=document.getElementById('roster');
function renderRoster(){
  rosterEl.innerHTML='';
  S.players.forEach((p,i)=>{
    const row=document.createElement('div');row.className='roster-row';
    row.innerHTML=`<span class="idx">${String(i+1).padStart(2,'0')}</span>`;
    const inp=document.createElement('input');inp.className='field';inp.placeholder='curator name';inp.value=p.name;inp.maxLength=24;inp.setAttribute('aria-label','Curator '+(i+1)+' name');
    inp.addEventListener('input',e=>{S.players[i].name=e.target.value;validate();});
    row.appendChild(inp);
    if(S.players.length>3){const x=document.createElement('button');x.className='x';x.type='button';x.textContent='✕';x.setAttribute('aria-label','Remove curator '+(i+1));x.onclick=()=>{S.players.splice(i,1);renderRoster();validate();};row.appendChild(x);}
    rosterEl.appendChild(row);
  });
  document.getElementById('addPlayer').disabled=S.players.length>=9;
  document.getElementById('rosterNote').textContent=S.players.length>=9?'nine is the ceiling — Charlissian makes ten':'';
}
function validate(){
  const named=S.players.filter(p=>p.name.trim()).length;
  const ok=document.getElementById('agree').checked && named>=3 && named===S.players.length;
  document.getElementById('begin').disabled=!ok;
  updateRounds();
}
document.getElementById('addPlayer').onclick=()=>{if(S.players.length<9){S.players.push({name:'',score:0});renderRoster();validate();}};
document.getElementById('agree').addEventListener('change',validate);
function breakUnit(m){ if(m<=7)return "one cigarette"; if(m<=11)return "a cigarette, or a short coffee"; if(m<=16)return "one coffee"; if(m<=22)return "a coffee and a refill"; return "one watercolor"; }
function updateRounds(){const n=S.players.filter(p=>p.name.trim()).length||S.players.length;const m=n+3;document.getElementById("roundsReadout").textContent=`Episodes: ${m}  —  a turn each, plus three (players + 3)  ·  ~${m} min  ·  about ${breakUnit(m)}`;}
S.players=[{name:'',score:0},{name:'',score:0},{name:'',score:0}];
renderRoster(); updateRounds();
(function(){var b=document.getElementById('musicToggle'); if(!b)return; b.onclick=function(){ if(!window.OHCSMusic)return; var onNow=OHCSMusic.toggle(); b.setAttribute('aria-pressed',onNow); b.title='Background music: '+(onNow?'on':'off'); b.style.color=onNow?'#c9a24b':'#6c6678'; };})();

document.getElementById('begin').onclick=()=>{
  S.players=S.players.filter(p=>p.name.trim()).map(p=>({name:p.name.trim(),score:0,subl:0,wret:0,flag:0,loop:0,sublPts:0,wretPts:0,flagPts:0,loopPts:0}));
  S.rounds=S.players.length+3; S.history=[]; S.heat={}; S.onFire={}; S.relaxed=document.getElementById('relaxed').checked;
  S.round=0; S.captainIdx=Math.floor(Math.random()*S.players.length);
  if(window.OHCSMusic){ var gsel=document.getElementById('genre'); if(gsel) OHCSMusic.setGenre(gsel.value); OHCSMusic.on(); var vsel=document.getElementById('voiceMode'); if(window.OHCSVoice){ vsel&&vsel.checked?OHCSVoice.on():OHCSVoice.off(); } OHCSMusic.setScore(0); var mb=document.getElementById('musicToggle'); if(mb){mb.setAttribute('aria-pressed','true');mb.title='Background music: on';mb.style.color='#c9a24b';} }
  startRound();
};

/* ---------- round: secret ---------- */
function startRound(){
  S.round++;
  if(S.round>S.rounds) return finale();
  S.secret=""; S.piece=null; S.pool=[]; S.machineEntry=-1; S.best=null; S.worst=null; S.flags={}; S.nameSpeed={}; S.flagMult={};
  document.getElementById('secRound').textContent=roman(S.round);
  document.getElementById('secTo').textContent=S.players[S.captainIdx].name;
  const si=document.getElementById('secretInput'); si.value=''; 
  document.getElementById('lockSecret').disabled=true;
  show('s-secret'); setTimeout(()=>si.focus(),60);
}
document.getElementById('secretInput').addEventListener('input',e=>{document.getElementById('lockSecret').disabled=!e.target.value.trim();});
document.getElementById('secretInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim())lockSecret();});
function lockSecret(){const v=document.getElementById('secretInput').value.trim();if(!v)return;S.secret=v;paintPhase();}
document.getElementById('lockSecret').onclick=lockSecret;

/* ---------- round: paint + machine guess ---------- */
async function paintPhase(){
  document.getElementById('paintRound').textContent=roman(S.round);
  document.getElementById('paintErr').textContent='';
  document.getElementById('paintDots').textContent='— rendering the secret —';
  show('s-paint');
  let piece, guess;
  try{
    piece=await paintSecret(S.secret);
    document.getElementById('paintDots').textContent='— and quietly forming its own guess —';
    guess=await machineGuess(piece.piece);
  }catch(e){
    // house deck — full guess/flag loop still works
    const card=HOUSE[S.houseIdx % HOUSE.length]; S.houseIdx++;
    S.secret=card.secret;
    piece={piece:card.piece,medium:card.medium,dims:card.dims};
    guess=card.guess; S.useHouse=true;
    document.getElementById('paintErr').textContent='(live brush unreachable — drew from the house deck; the Captain\u2019s secret is set by the deck this round)';
    await new Promise(r=>setTimeout(r,700));
  }
  S.piece=piece; S._machineGuessText=guess;
  document.getElementById('pieceRound').textContent=roman(S.round);
  document.getElementById('pieceText').textContent='“'+piece.piece+'”';
  document.getElementById('placard').innerHTML=`THE MACHINE &nbsp;·&nbsp; <span class="by">${escapeHtml(piece.medium)}</span>${piece.dims?' &nbsp;·&nbsp; '+escapeHtml(piece.dims):''}`;
  announce('Episode '+roman(S.round)+'. The machine painted: '+piece.piece);
  show('s-piece');
}
document.getElementById('toNaming').onclick=startNaming;

/* ---------- round: naming (every human, captain bluffs) ---------- */
function startNaming(){
  // order: start left of captain, captain names too (as bluff)
  S.nameQueue=[]; for(let k=1;k<=S.players.length;k++){S.nameQueue.push((S.captainIdx+k)%S.players.length);}
  S.nameTurn=0;
  document.getElementById('nameTot').textContent=S.players.length;
  promptNamer(); show('s-name');
}
function promptNamer(){
  const pi=S.nameQueue[S.nameTurn];
  document.getElementById('nameIdx').textContent=S.nameTurn+1;
  document.getElementById('passTo').textContent=S.players[pi].name;
  const hs=document.getElementById('heatStatus');
  if(S.relaxed) hs.textContent='';
  else if(S.onFire[pi]) hs.textContent='🔥 ON FIRE — ×3 locked. Win a crown to stay lit.';
  else if((S.heat[pi]||0)===2) hs.textContent='🔥 HEAT 2 — one more lightning lock ignites you.';
  else if((S.heat[pi]||0)===1) hs.textContent='HEAT 1 — lock under 20s to keep building.';
  else hs.textContent='';
  announce(S.players[pi].name+', your turn to name the piece.');
  const isCaptain=(pi===S.captainIdx);
  document.getElementById('nameInstruct').innerHTML = isCaptain
    ? 'You set the secret — now <b style="color:var(--machine)">bluff.</b> Drop a name that misleads, or one so honest it looks like a trick:<br><em id="passPiece">“'+escapeHtml(S.piece.piece)+'”</em>'
    : 'Everyone else, look away. Name this piece with conviction:<br><em id="passPiece">“'+escapeHtml(S.piece.piece)+'”</em>';
  const inp=document.getElementById('nameInput'); inp.value=''; document.getElementById('lockName').disabled=true; setTimeout(()=>inp.focus(),60);
  runTimer(document.getElementById('nameTimer'), NAME_SECS, ()=>lockName(true));
}
document.getElementById('nameInput').addEventListener('input',e=>{document.getElementById('lockName').disabled=!e.target.value.trim();});
document.getElementById('nameInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.value.trim())lockName();});
function lockName(timedOut){
  let txt=document.getElementById('nameInput').value.trim();
  if(!txt){ if(timedOut) txt='(silence)'; else return; }
  stopTimer();
  S.nameSpeed[S.nameQueue[S.nameTurn]]=speedMult();
  S.pool.push({author:S.nameQueue[S.nameTurn],text:txt});
  S.nameTurn++;
  if(S.nameTurn>=S.nameQueue.length) sealPool(); else promptNamer();
}
document.getElementById('lockName').onclick=()=>lockName();

/* ---------- seal pool: drop the machine's guess in, shuffle ---------- */
function sealPool(){
  S.pool.push({author:MACHINE,text:S._machineGuessText});
  S.pool=S.pool.map(e=>({...e,_r:Math.random()})).sort((a,b)=>a._r-b._r);
  S.machineEntry=S.pool.findIndex(e=>e.author===MACHINE);
  startCrowns();
}

/* ---------- crowns: sublime + troll (table consensus) ---------- */
let judgeMode='best';
function startCrowns(){
  S.best=null;S.worst=null;judgeMode='best';
  document.getElementById('judgePiece').textContent='“'+S.piece.piece+'”';
  renderJudge(); show('s-judge');
}
function renderJudge(){
  document.getElementById('tabBest').className='jt'+(judgeMode==='best'?' act-best':'');
  document.getElementById('tabWorst').className='jt'+(judgeMode==='worst'?' act-worst':'');
  document.getElementById('bestDone').textContent=S.best!==null?'✓':'';
  document.getElementById('worstDone').textContent=S.worst!==null?'✓':'';
  const wrap=document.getElementById('judgeCards');wrap.innerHTML='';
  S.pool.forEach((n,i)=>{
    const c=document.createElement('button');c.type='button';
    c.className='namecard'+(S.best===i?' best':'')+(S.worst===i?' worst':'');
    c.style.animationDelay=(i*0.05)+'s';
    let stamp=''; if(S.best===i)stamp='<span class="stamp g">Sublime</span>'; if(S.worst===i)stamp='<span class="stamp o">Troll</span>';
    c.innerHTML=`${stamp}<div class="nm">“${escapeHtml(n.text)}”</div>`;
    c.setAttribute('aria-label',(judgeMode==='best'?'Crown as Sublime: ':'Crown as Troll: ')+n.text);
    c.onclick=()=>pick(i); wrap.appendChild(c);
  });
  document.getElementById('toFlag').disabled=(S.best===null||S.worst===null);
}
function pick(i){
  if(judgeMode==='best'){ if(S.worst===i)return; S.best=(S.best===i)?null:i; if(S.best!==null)judgeMode='worst'; }
  else { if(S.best===i)return; S.worst=(S.worst===i)?null:i; if(S.worst!==null&&S.best===null)judgeMode='best'; }
  renderJudge();
}
document.getElementById('tabBest').onclick=()=>{judgeMode='best';renderJudge();};
document.getElementById('tabWorst').onclick=()=>{judgeMode='worst';renderJudge();};
document.getElementById('toFlag').onclick=startFlag;

/* ---------- the flag: every non-captain hunts the machine ---------- */
function startFlag(){
  S.flagQueue=S.nameQueue.filter(pi=>pi!==S.captainIdx); // captain sits out (insider knowledge)
  S.flagTurn=0; S.flags={};
  document.getElementById('flagTot').textContent=S.flagQueue.length;
  promptFlagger(); show('s-flag');
}
function promptFlagger(){
  const pi=S.flagQueue[S.flagTurn];
  document.getElementById('flagIdx').textContent=S.flagTurn+1;
  document.getElementById('flagTo').textContent=S.players[pi].name;
  announce(S.players[pi].name+', secretly choose which name you believe Charlissian wrote.');
  const wrap=document.getElementById('flagCards');wrap.innerHTML='';
  S.pool.forEach((n,i)=>{
    const c=document.createElement('button');c.type='button';c.className='namecard';c.style.animationDelay=(i*0.04)+'s';
    c.innerHTML=`<div class="nm">“${escapeHtml(n.text)}”</div>`;
    c.setAttribute('aria-label','Flag as Charlissian: '+n.text);
    c.onclick=()=>{ stopTimer(); S.flagMult[pi]=speedMult(); S.flags[pi]=i; advanceFlag(); };
    wrap.appendChild(c);
  });
  runTimer(document.getElementById('flagTimer'), FLAG_SECS, ()=>{ S.flags[pi]=-1; S.flagMult[pi]=1; advanceFlag(); });
}
function advanceFlag(){ S.flagTurn++; if(S.flagTurn>=S.flagQueue.length) flagReveal(); else promptFlagger(); }

/* ---------- flag reveal + scoring ---------- */
function flagReveal(){
  const misCount={}; let caughtBy=[]; const won={};
  const M=pi=> S.onFire[pi] ? 3 : (S.nameSpeed[pi]||1);
  Object.entries(S.flags).forEach(([pi,entry])=>{
    pi=+pi; entry=+entry;
    if(entry===S.machineEntry){ const m=M(pi); const pts=2*m; S.players[pi].score+=pts; S.players[pi].flag+=1; S.players[pi].flagPts+=pts; won[pi]=true; caughtBy.push(S.players[pi].name+(m>1?' ×'+m:'')); }
    else if(entry>=0){ const a=S.pool[entry].author; if(a!==MACHINE){ misCount[a]=(misCount[a]||0)+1; } }
  });
  let looperMsg='';
  if(S.players.length>=4){
    let top=-1, who=null;
    Object.entries(misCount).forEach(([a,c])=>{ if(c>top){top=c;who=+a;} });
    if(who!==null && top>0){ const m=M(who); const pts=3*m; S.players[who].score+=pts; S.players[who].loop+=1; S.players[who].loopPts+=pts; won[who]=true; looperMsg=`<b style="color:var(--silver)">${escapeHtml(S.players[who].name)}</b> passed as the machine — the Imposter.${m>1?' ×'+m:''} +${pts}.`; }
  }
  const subA=S.pool[S.best].author, wreA=S.pool[S.worst].author;
  if(subA!==MACHINE){ const m=M(subA); S.players[subA].score+=3*m; S.players[subA].subl+=1; S.players[subA].sublPts+=3*m; won[subA]=true; }
  if(wreA!==MACHINE){ const m=M(wreA); S.players[wreA].score+=3*m; S.players[wreA].wret+=1; S.players[wreA].wretPts+=3*m; won[wreA]=true; }

  // HEAT (NBA Jam): build with consecutive lightning locks → on fire pins you at ×3;
  // stay lit by winning a crown; a crownless round cools you off.
  let fireMsgs=[];
  S.players.forEach((p,pi)=>{
    if(S.nameSpeed[pi]===undefined) return;
    if(S.onFire[pi]){
      if(!won[pi]){ S.onFire[pi]=false; S.heat[pi]=0; fireMsgs.push(escapeHtml(p.name)+' cooled off'); }
    } else if(S.nameSpeed[pi]===3){
      S.heat[pi]=(S.heat[pi]||0)+1;
      if(S.heat[pi]>=3){ S.onFire[pi]=true; fireMsgs.push('<b style="color:var(--oxblood-lit)">'+escapeHtml(p.name)+' is ON FIRE — ×3 locked</b>'); }
    } else { S.heat[pi]=0; }
  });

  if(window.OHCSMusic) OHCSMusic.setScore(Math.max(0,...S.players.map(p=>p.score)));
  S.history.push({ round:S.round, secret:S.secret, piece:S.piece.piece,
    sublimeName:S.pool[S.best].text, sublimeBy: subA===MACHINE?'Charlissian':S.players[subA].name,
    machineName:S.pool[S.machineEntry].text, caught:caughtBy.length>0 });

  document.getElementById('revMachineName').textContent='“'+S.pool[S.machineEntry].text+'”';
  let line = caughtBy.length ? `Caught by ${caughtBy.map(escapeHtml).join(', ')}.` : `Nobody caught it. Charlissian walked free.`;
  if(subA===MACHINE) line+=` It even stole the Sublime crown — no human earns it this round.`;
  if(wreA===MACHINE) line+=` The table judged it the Troll — no human earns that crown.`;
  if(looperMsg) line+='<br>'+looperMsg;
  if(fireMsgs.length) line+='<br>'+fireMsgs.join(' &nbsp;·&nbsp; ');
  line+=`<br><span style="color:#928d9e">The secret was “${escapeHtml(S.secret)}.”</span>`;
  // SECURITY: `line` is assembled above from a mix of static template strings and user-derived
  // values (player names, secret). Every user-derived value MUST pass through escapeHtml() before
  // it reaches here — this assignment writes raw HTML. Do not append an unescaped variable to `line`.
  document.getElementById('revLine').innerHTML=line;
  announce('Charlissian wrote: '+S.pool[S.machineEntry].text+'. '+(caughtBy.length?'It was caught.':'It went uncaught.'));
  show('s-flagrev');
}
document.getElementById('toScore').onclick=()=>{
  renderLedger('ledger',true);
  document.getElementById('scoreRound').textContent=roman(S.round);
  document.getElementById('scoreTot').textContent=roman(S.rounds);
  document.getElementById('nextRound').textContent=S.round>=S.rounds?'Close the show →':'Next piece →';
  show('s-score');
};
document.getElementById('nextRound').onclick=()=>{ S.captainIdx=(S.captainIdx+1)%S.players.length; startRound(); };

/* ---------- ledger ---------- */
function renderLedger(elId){
  const el=document.getElementById(elId);el.innerHTML='';
  const order=[...S.players.keys()].sort((a,b)=>S.players[b].score-S.players[a].score);
  const top=S.players[order[0]].score;
  order.forEach(idx=>{
    const p=S.players[idx];
    const row=document.createElement('div');row.className='lrow'+(p.score===top&&top>0?' lead':'');
    const tags=[]; if(p.subl)tags.push(p.subl+'◆'); if(p.wret)tags.push(p.wret+'▽'); if(p.flag)tags.push(p.flag+'⚑'); if(p.loop)tags.push(p.loop+'∞');
    row.innerHTML=`<div class="who">${S.onFire[idx]?'🔥 ':''}${escapeHtml(p.name)} <span class="mini" style="color:#928d9e">${tags.join(' ')}</span></div><div class="pts">${p.score} pts</div>`;
    el.appendChild(row);
  });
}

/* ---------- finale: four crowns, distinct at 3+ ---------- */
function finale(){
  // multi-title allowed at every count — earn the axis, hold the crown. sweeps welcome.
  function crown(axis){
    let best=-1,who=null;
    S.players.forEach((p,i)=>{ if(p[axis]>best){best=p[axis];who=i;} });
    return (who!==null&&best>0)?who:null;
  }
  const defs=[
    {axis:'subl',cls:'sub',label:'The Sublime',sub:'finest name'},
    {axis:'wret',cls:'wre',label:'The Troll',sub:'gloriously worst'},
    {axis:'flag',cls:'fla',label:'The Flag',sub:'caught the machine'},
  ];
  if(S.players.length>=4) defs.push({axis:'loop',cls:'loo',label:'The Imposter',sub:'passed as the machine'});
  const host=document.getElementById('titles'); host.innerHTML='';
  defs.forEach(d=>{
    const who=crown(d.axis);
    const card=document.createElement('div');card.className='titlecard '+d.cls;
    card.innerHTML=`<div><div class="crwn">${d.label} — ${d.sub}</div><div class="holder">${who===null?'<span style="color:#928d9e">unclaimed</span>':escapeHtml(S.players[who].name)}</div></div>`;
    host.appendChild(card);
  });
  saveToVault(); renderPodium(); renderTi83(); renderSheet(); renderGallery();
  const lines=[
    "The machine made every piece and guessed against every one. Naming them was the only thing it could not do for you.",
    "You caught it, or you didn't. Either way, a human decided — which was always the whole point.",
    "A vault hides; a museum reveals. You ran a museum, and you spotted the forgery in your own lineup.",
    "Define the radius; the area reveals itself. Tonight you defined it in names — and in the one name that wasn't yours."
  ];
  document.getElementById('benediction').textContent=lines[Math.floor(Math.random()*lines.length)];
  if(window.OHCSMusic) OHCSMusic.setScore(Math.max(0,...S.players.map(p=>p.score)));
  show('s-final');
  rollCredits();
}

/* roman numerals — every round is an Episode */
function roman(n){
  if(!n||n<1) return '0';
  const map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let s=''; for(const [v,sym] of map){ while(n>=v){ s+=sym; n-=v; } } return s;
}

/* the end credits roll like an episode; the Rematch waits behind them */
function rollCredits(){
  const order=[...S.players.keys()].sort((a,b)=>S.players[b].score-S.players[a].score);
  const crew=order.map(i=>`<div class="cn">${escapeHtml(S.players[i].name)}</div>`).join('');
  const html=`<div class="crawl">
    <div class="ct">Only Humans Can Score</div>
    <div class="cn" style="font-size:24px">Episode ${roman(S.rounds)}</div>
    <div class="ct" style="margin-top:18px">The Curators</div>${crew}
    <div class="ct" style="margin-top:18px">The Machine</div><div class="cn" style="color:var(--machine)">Charlissian</div>
    <div class="ct" style="margin-top:18px">The Law</div><div class="cn">Only humans can score.</div>
  </div>`;
  const c=document.getElementById('credits'); c.innerHTML=html; c.classList.add('roll');
  document.getElementById('rematchArea').style.display='none';
  const reveal=()=>{ document.getElementById('rematchArea').style.display='block'; };
  const crawlEl=c.querySelector('.crawl');
  let done=false; const finishOnce=()=>{ if(done)return; done=true; reveal(); };
  if(crawlEl) crawlEl.addEventListener('animationend',finishOnce);
  setTimeout(finishOnce,13500); // fallback / reduced-motion
}
document.getElementById('skipCredits').onclick=()=>{
  const c=document.getElementById('credits'); c.classList.remove('roll'); c.innerHTML='';
  document.getElementById('rematchArea').style.display='block';
};

/* REMATCH — same crew, same chapters, fresh secrets. Unanimous: everyone must agree. */
let _rematchArmed=false;
document.getElementById('rematch').onclick=()=>{
  const b=document.getElementById('rematch'), p=document.getElementById('rematchPrompt');
  if(!_rematchArmed){
    _rematchArmed=true;
    p.innerHTML='<b style="color:var(--gold)">All players agree?</b> Same crew, same chapters, fresh secrets. Tap again only if everyone is in.';
    b.textContent='All in — run it back';
    return;
  }
  _rematchArmed=false;
  S.players=S.players.map(p=>({name:p.name,score:0,subl:0,wret:0,flag:0,loop:0,sublPts:0,wretPts:0,flagPts:0,loopPts:0}));
  S.round=0; S.houseIdx=0; S.history=[]; S.heat={}; S.onFire={}; S.captainIdx=Math.floor(Math.random()*S.players.length);
  startRound();
};
document.getElementById('newcrew').onclick=()=>show('s-setup');

/* the podium — Gold Sublime · Silver Cigar (the human) · Bronze Troll; everyone takes a step */
function renderPodium(){
  const board=[...S.players].sort((a,b)=>b.score-a.score);
  if(!board.length){document.getElementById('podium').innerHTML='';return;}
  const top=board[0].score, low=board[board.length-1].score;
  const gold=board.filter(p=>p.score===top);
  const goldSet=new Set(gold);
  const bronze=(low!==top)?board.filter(p=>p.score===low):[];
  const bronzeSet=new Set(bronze);
  const silver=board.filter(p=>!goldSet.has(p)&&!bronzeSet.has(p));
  const li=arr=>arr.length?arr.map(p=>`${escapeHtml(p.name)}`).join('<br>'):'—';
  document.getElementById('podium').innerHTML=`<div class="podium">
    <div class="tier silver"><div class="medal">🥈</div><div class="tname">Cigar</div><div class="tsub">the human · still here</div><div class="names">${li(silver)}</div></div>
    <div class="tier gold"><div class="medal">🥇</div><div class="tname">Sublime</div><div class="tsub">best</div><div class="names">${li(gold)}</div></div>
    <div class="tier bronze"><div class="medal">🥉</div><div class="tname">Troll</div><div class="tsub">worst</div><div class="names">${li(bronze)}</div></div>
  </div>`;
}

/* TI-83 distribution graph — the humblest math tool renders the verdict */
function renderTi83(){
  const el=document.getElementById('ti83');
  const max=Math.max(1,...S.players.map(p=>p.score));
  const order=[...S.players.keys()].sort((a,b)=>S.players[b].score-S.players[a].score);
  const bars=order.map(i=>{
    const p=S.players[i]; const px=Math.round((p.score/max)*120);
    return `<div class="bar"><div class="val">${p.score}</div><div class="col" style="height:${px}px"></div><div class="lbl">${escapeHtml(p.name.slice(0,6))}</div></div>`;
  }).join('');
  el.innerHTML=`<div class="lcd"><div class="hd"><span>Y1=SCORE</span><span>n=${S.players.length}  max=${max}</span></div><div class="bars">${bars}</div></div>`;
}

/* the score sheet — every point shown its work (base × speed, summed) */
function renderSheet(){
  const el=document.getElementById('sheet'); el.innerHTML='';
  const order=[...S.players.keys()].sort((a,b)=>S.players[b].score-S.players[a].score);
  order.forEach(idx=>{
    const p=S.players[idx]; const parts=[];
    if(p.sublPts)parts.push(`<span class="s">◆ Sublime ×${p.subl} = ${p.sublPts}</span>`);
    if(p.wretPts)parts.push(`<span class="w">▽ Troll ×${p.wret} = ${p.wretPts}</span>`);
    if(p.flagPts)parts.push(`<span class="f">⚑ Flag ×${p.flag} = ${p.flagPts}</span>`);
    if(p.loopPts)parts.push(`<span class="l">∞ Imposter ×${p.loop} = ${p.loopPts}</span>`);
    const work = parts.length ? parts.join('&nbsp; + &nbsp;')+`&nbsp; = &nbsp;<b style="color:var(--bone)">${p.score}</b>` : 'no crowns earned — the forgettable middle';
    const seg=(v,c)=>v?`<i style="width:${(v/Math.max(1,p.score))*100}%;background:${c}"></i>`:'';
    const d=document.createElement('div'); d.className='srow';
    d.innerHTML=`<div class="top"><span class="nm">${escapeHtml(p.name)}</span><span class="tot">${p.score} pts</span></div><div class="work">${work}</div><div class="compbar">${seg(p.sublPts,'var(--gold)')}${seg(p.wretPts,'var(--oxblood-lit)')}${seg(p.flagPts,'var(--steel)')}${seg(p.loopPts,'var(--silver)')}</div>`;
    el.appendChild(d);
  });
}

/* the gallery — tonight's collection, each piece with its crowned name */
function renderGallery(){
  const el=document.getElementById('gallery'); el.innerHTML='';
  S.history.forEach(h=>{
    const d=document.createElement('div'); d.className='gcard';
    d.innerHTML=`<div class="gnum">№ ${h.round}</div><div class="gpiece">“${escapeHtml(h.piece)}”</div><div class="gwin">◆ ${escapeHtml(h.sublimeName)} — ${escapeHtml(h.sublimeBy)}</div><div class="gsec">secret: ${escapeHtml(h.secret)}<br>machine: “${escapeHtml(h.machineName)}” ${h.caught?'(caught)':'(walked free)'}</div>`;
    el.appendChild(d);
  });
}
document.getElementById('openVault').onclick=showVault;
document.getElementById('toVault').onclick=showVault;
document.getElementById('vaultBack').onclick=()=>show('s-setup');
document.getElementById('vaultClear').onclick=clearVault;
validate();
