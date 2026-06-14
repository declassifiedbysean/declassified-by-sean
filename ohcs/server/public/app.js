// public/app.js — the networked client. Receives authoritative state; sends actions.
const $ = (id) => document.getElementById(id);
const screens = ['s-auth','s-lobby','s-queue','s-room','s-paint','s-name','s-crown','s-flag','s-reveal','s-final'];
const SCREEN_LABEL={'s-auth':'Sign in','s-lobby':'Lobby','s-queue':'Finding a game','s-room':'Private room','s-paint':'The machine is painting','s-name':'Name the work','s-crown':'Crown the sublime and the troll','s-flag':'Flag the machine','s-reveal':'The reveal','s-final':'Final standings'};
function announce(t){ const l=$('live'); if(l){ l.textContent=''; setTimeout(()=>{l.textContent=t;},60); } }
function show(id){ screens.forEach(s=>$(s).classList.toggle('on', s===id)); const el=$(id); if(el){ el.setAttribute('tabindex','-1'); try{el.focus({preventScroll:true});}catch(e){} } if(SCREEN_LABEL[id]) announce(SCREEN_LABEL[id]); }
function toast(t){ const el=$('toast'); el.textContent=t; el.classList.add('on'); setTimeout(()=>el.classList.remove('on'),2200); }

let ws=null, token=null, me=null, roomCode=null, isHost=false;
let entries=[], crownPick={sublime:null,troll:null}, clockTimer=null;

// ---------- auth ----------
async function boot(){
  const h = await fetch('/api/health').then(r=>r.json()).catch(()=>({}));
  if(h.googleLogin) $('playGoogle').style.display='inline-block';
  // returning from Google? token is in the URL fragment
  const m = location.hash.match(/token=([^&]+)/);
  if(m){ token=decodeURIComponent(m[1]); history.replaceState(null,'',location.pathname); afterAuth(); }
}
$('playGuest').onclick = async ()=>{
  const handle = $('handle').value.trim() || 'Guest';
  const r = await fetch('/auth/guest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({handle})}).then(r=>r.json());
  token = r.token; afterAuth();
};
$('playGoogle').onclick = ()=>{ location.href='/auth/google'; };

function afterAuth(){ connect(); }

// ---------- websocket ----------
function connect(){
  const proto = location.protocol==='https:'?'wss':'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onopen = ()=> send({t:'auth', token});
  ws.onmessage = (e)=> handle(JSON.parse(e.data));
  ws.onclose = ()=> toast('disconnected');
}
function send(o){ if(ws&&ws.readyState===1) ws.send(JSON.stringify(o)); }

// ---------- lobby actions ----------
$('findGame').onclick = ()=>{ send({t:'queue.join'}); show('s-queue'); animateQueue(); };
$('queueLeave').onclick = ()=>{ send({t:'queue.leave'}); show('s-lobby'); };
$('makeRoom').onclick = ()=> send({t:'room.create'});
$('joinBtn').onclick = ()=>{ const c=$('joinCode').value.trim().toUpperCase(); if(c) send({t:'room.join',code:c}); };
$('startBtn').onclick = ()=> send({t:'room.start', code:roomCode});
$('againBtn').onclick = ()=> show('s-lobby');

let qdots=0, qTimer=null;
function animateQueue(){ clearInterval(qTimer); qTimer=setInterval(()=>{ qdots=(qdots+1)%4; $('queueDots').textContent='·'.repeat(qdots+1); },500); }

// ---------- message handling ----------
function handle(m){
  switch(m.t){
    case 'auth.ok': me=m.user; renderRateBadge(); show('s-lobby'); break;
    case 'queue.waiting': $('queueMsg').textContent = `In the storm — ${m.size} waiting…`; break;
    case 'room.joined':
      roomCode=m.code; isHost=!!m.host; clearInterval(qTimer);
      if(m.matchmade){ toast('matched — the show is starting'); }
      else { $('roomCode').textContent=m.code; $('startBtn').style.display=isHost?'inline-block':'none'; show('s-room'); }
      break;
    case 'room.update': renderRoomPlayers(m.players); break;
    case 'game.start': toast(`${m.rounds} rounds`); break;
    case 'role': if(m.captain){ $('captainHint').style.display='block'; $('captainHint').innerHTML=`You are the Captain. The secret is <b style="color:var(--gold)">${esc(m.secret)}</b> — bluff a name, don't hand it over.`; } break;
    case 'phase': phase(m); break;
    case 'error': toast(m.msg); break;
  }
}
function renderRoomPlayers(ps){
  $('roomPlayers').innerHTML = ps.map(p=>`<span class="chip ${p.isBot?'bot':''} ${p.onFire?'fire':''}">${esc(p.name)}${p.isBot?' ⌁':''}</span>`).join('');
}

// ---------- phases ----------
function phase(m){
  switch(m.name){
    case 'ROUND_START':
      $('paintRound').textContent = `round ${m.round} of ${m.rounds}`;
      $('captainHint').style.display='none';
      break;
    case 'PAINT':
      $('pieceText').textContent = m.piece.refused ? m.piece.piece : (m.piece.kind==='image' && m.piece.url ? '' : m.piece.piece);
      if(m.piece.kind==='image' && m.piece.url){ $('pieceText').innerHTML = `<img src="${m.piece.url}" alt="the painted clue" style="max-width:100%;border-radius:8px">`; }
      show('s-paint');
      setTimeout(()=>startName(m.piece, m.nameSeconds), 1800);
      break;
    case 'CROWN': entries=m.entries; renderCrown(); show('s-crown'); break;
    case 'FLAG': entries=m.entries; renderFlag(); show('s-flag'); break;
    case 'REVEAL': renderReveal(m); show('s-reveal'); break;
    case 'FINALE': renderFinale(m); show('s-final'); break;
  }
}

// NAME phase with the live 60s clock + heat readout
function startName(piece, seconds){
  $('namePiece').textContent = piece.kind==='image' ? 'the work on the wall' : piece.piece;
  $('nameInput').value=''; $('nameWaiting').textContent='';
  show('s-name'); $('nameInput').focus();
  let left = seconds || 60;
  $('nameClock').textContent = left;
  updateHeat(seconds-left, seconds);
  clearInterval(clockTimer);
  clockTimer = setInterval(()=>{ left--; $('nameClock').textContent=Math.max(0,left); updateHeat(seconds-left,seconds); if(left<=0){ clearInterval(clockTimer); } },1000);
}
function updateHeat(elapsed){
  let label, fire=false;
  if(elapsed<=20){ label='⚡ Lightning · ×3'; fire=true; }
  else if(elapsed<=40){ label='Warm · ×2'; }
  else { label='Cold · ×1'; }
  const el=$('nameHeat'); el.textContent=label; el.classList.toggle('fire',fire);
}
$('nameSubmit').onclick = ()=>{
  const name = $('nameInput').value.trim(); if(!name) return;
  send({t:'name.submit', name});
  clearInterval(clockTimer);
  $('nameWaiting').textContent='locked — waiting on the others…';
  $('nameSubmit').disabled=true; setTimeout(()=>$('nameSubmit').disabled=false, 500);
};

function renderCrown(){
  crownPick={sublime:null,troll:null};
  $('crownList').innerHTML = entries.map(e=>`<button type="button" class="entry" data-id="${e.id}" aria-label="Crown: ${esc(e.name)}"><span class="nm">${esc(e.name)}</span><span class="mono muted" data-tag="${e.id}"></span></button>`).join('');
  $('crownList').querySelectorAll('.entry').forEach(el=>{
    el.onclick = ()=>{
      const id = el.dataset.id;
      if(crownPick.sublime===null){ crownPick.sublime=id; }
      else if(crownPick.troll===null && id!==crownPick.sublime){ crownPick.troll=id; }
      else { crownPick={sublime:id,troll:null}; }
      paintCrowns();
    };
  });
  $('crownSubmit').disabled=true; $('crownState').textContent='choose your Sublime…';
}
function paintCrowns(){
  entries.forEach(e=>{
    const el=$('crownList').querySelector(`[data-id="${e.id}"]`);
    const tag=$('crownList').querySelector(`[data-tag="${e.id}"]`);
    el.classList.remove('sel'); tag.textContent='';
    if(e.id===crownPick.sublime){ el.classList.add('sel'); tag.textContent='◆ Sublime'; tag.style.color='var(--gold)'; }
    if(e.id===crownPick.troll){ el.classList.add('sel'); tag.textContent='▼ Troll'; tag.style.color='var(--lose)'; }
  });
  if(crownPick.sublime && !crownPick.troll) $('crownState').textContent='now the Troll…';
  const ready = crownPick.sublime && crownPick.troll;
  $('crownSubmit').disabled = !ready;
  if(ready) $('crownState').textContent='both chosen';
}
$('crownSubmit').onclick = ()=>{
  send({t:'crown.vote', sublime:crownPick.sublime, troll:crownPick.troll});
  $('crownSubmit').disabled=true; $('crownState').textContent='cast — waiting on the others…';
};

function renderFlag(){
  $('flagList').innerHTML = entries.map(e=>`<button type="button" class="entry flag" data-id="${e.id}" aria-label="Flag as the machine: ${esc(e.name)}"><span class="nm">${esc(e.name)}</span></button>`).join('');
  $('flagList').querySelectorAll('.entry').forEach(el=>{
    el.onclick = ()=>{ send({t:'flag.cast', entryId:el.dataset.id}); $('flagWaiting').textContent='flag cast — waiting on the others…'; $('flagList').querySelectorAll('.entry').forEach(x=>{x.disabled=true;}); };
  });
  $('flagWaiting').textContent='';
}

function renderReveal(m){
  $('revealRound').textContent = `round ${m.round} · reveal`;
  $('revealSecret').textContent = m.secret;
  $('revealMachine').textContent = `the machine named it "${m.machineName}"`;
  $('revealCaught').innerHTML = m.caught ? '<span style="color:var(--win)">caught — a human flagged the machine</span>' : '<span style="color:var(--lose)">it walked free</span>';
  $('revealBoard').innerHTML = boardHtml(m.scoreboard);
}
function boardHtml(board){
  return '<div class="panel">'+board.map((p,i)=>`<div class="brow ${i===0?'lead':''}"><span>${i+1}. ${esc(p.name)}${p.isBot?' ⌁':''}${p.onFire?' 🔥':''}</span><span class="pts">${p.score}</span></div>`).join('')+'</div>';
}
function renderRateBadge(){
  var el=$('rateBadge'); if(!el||!me) return; el.style.display='inline-block';
  if(me.paid && me.rating!=null){ el.innerHTML='\u269c Rating <b>'+me.rating+'</b>'+(me.games<10?' <span class="prov">provisional</span>':''); }
  else if(me.paid){ el.innerHTML='\u269c <b>Unrated</b> \u2014 finish a rated game'; }
  else { el.innerHTML='Free play \u2014 <span class="prov">unrated</span>. The rated ladder is a Pass feature.'; }
}
function renderFinaleRatings(m){
  var rt=$('finalRatings'); if(!rt) return;
  if(m.ratings && m.ratings.length){
    rt.style.display='block';
    rt.innerHTML='<div class="eyebrow center" style="margin-top:18px">the rated ladder</div>'+
      '<div class="board panel">'+m.ratings.map(function(r){
        var d=r.delta>0?('+'+r.delta):(''+r.delta), cls=r.delta>0?'up':(r.delta<0?'down':'');
        return '<div class="brow"><span>'+esc(r.name)+(r.provisional?' <span class="prov">prov</span>':'')+
               '</span><span class="pts '+cls+'">'+d+' \u2192 '+r.after+'</span></div>';
      }).join('')+'</div>';
  } else { rt.style.display='none'; }
}
function renderFinale(m){
  renderFinaleRatings(m);
  $('finalWinner').textContent = m.winner ? `${m.winner.name} hangs at the center` : 'the show is hung';
  $('finalReview').textContent = m.review ? `“${m.review}”` : '';
  $('finalPodium').innerHTML = podiumHtml(m.scoreboard);
  $('finalBoard').innerHTML = m.scoreboard.map((p,i)=>`<div class="brow ${i===0?'lead':''}"><span>${i+1}. ${esc(p.name)}${p.isBot?' ⌁':''}</span><span class="pts">${p.score}</span></div>`).join('');
  $('finalWorks').innerHTML = (m.works||[]).map(w=>`<div class="work"><div class="wp">“${esc(w.piece)}”</div><div class="wn">◆ ${esc(w.sublimeName||'—')}</div><div class="ws">secret: ${esc(w.secret)} · ${w.caught?'caught':'walked free'}</div></div>`).join('');
}
// tiers every player onto the podium: Gold=Sublime (top), Bronze=Troll (lowest), Silver=Cigar (the human middle)
function podiumHtml(board){
  if(!board||!board.length) return '';
  const n=board.length, top=board[0].score, low=board[n-1].score;
  const gold=board.filter(p=>p.score===top);
  const goldSet=new Set(gold.map(p=>p.name));
  const bronze=(low!==top)?board.filter(p=>p.score===low):[];
  const bronzeSet=new Set(bronze.map(p=>p.name));
  const silver=board.filter(p=>!goldSet.has(p.name)&&!bronzeSet.has(p.name));
  const li=arr=>arr.length?arr.map(p=>`${esc(p.name)}${p.isBot?' ⌁':''}`).join('<br>'):'—';
  return `<div class="podium">
    <div class="tier silver"><div class="medal">🥈</div><div class="tname">Cigar</div><div class="sub">the human · still here</div><div class="names">${li(silver)}</div></div>
    <div class="tier gold"><div class="medal">🥇</div><div class="tname">Sublime</div><div class="sub">best</div><div class="names">${li(gold)}</div></div>
    <div class="tier bronze"><div class="medal">🥉</div><div class="tname">Troll</div><div class="sub">worst</div><div class="names">${li(bronze)}</div></div>
  </div>`;
}

function esc(s){ return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

boot();
