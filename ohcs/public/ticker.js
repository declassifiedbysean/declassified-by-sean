const SEED=(()=>{
  const days=95, today=new Date(); const hist=[]; let cr=0.33;
  for(let i=days-1;i>=0;i--){
    cr=Math.min(0.55,Math.max(0.27,cr+(Math.random()-0.47)*0.025));
    const d=new Date(today); d.setDate(d.getDate()-i);
    hist.push({date:d.toISOString().slice(0,10),catchRate:+cr.toFixed(3),passRate:+(1-cr).toFixed(3),games:18+Math.round(Math.random()*44)});
  }
  const models=[
    {id:'claude-sonnet-4',label:'CLAUDE-S4',passRate:0.62,prevPassRate:0.59,sublimeShare:0.19,trollShare:0.06,games:412,status:'SIM'},
    {id:'flux-2-pro',label:'FLUX-2-PRO',passRate:0.57,prevPassRate:0.58,sublimeShare:0.14,trollShare:0.09,games:301,status:'SIM'},
    {id:'imagen-4-fast',label:'IMAGEN-4F',passRate:0.53,prevPassRate:0.50,sublimeShare:0.11,trollShare:0.12,games:268,status:'SIM'},
    {id:'gpt-image-1-mini',label:'GPT-IMG-M',passRate:0.49,prevPassRate:0.52,sublimeShare:0.10,trollShare:0.15,games:355,status:'SIM'},
    {id:'house-deck',label:'HOUSE-DECK',passRate:0.41,prevPassRate:0.41,sublimeShare:0.07,trollShare:0.21,games:903,status:'SIM'},
  ];
  const last=hist[hist.length-1];
  return {generatedAt:new Date().toISOString(),tz:'America/New_York',sample:true,
    totals:{games:hist.reduce((s,h)=>s+h.games,0)},
    global:{catchRate:last.catchRate,walkFreeRate:+(1-last.catchRate).toFixed(3),looperRate:0.11,
      crownShare:{sublime:0.30,troll:0.24,cigar:0.22,flag:0.16,looper:0.08}},
    history:hist,models,
    leaderboard:[{handle:'Margin',score:1480},{handle:'No.7',score:1390},{handle:'Provenance',score:1255},{handle:'Static',score:1190},{handle:'The Visitor',score:1040}]};
})();

const pct=x=>x==null?'—':(x*100).toFixed(1)+'%';
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const avg=a=>a&&a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
function deltaHTML(d){if(d==null||isNaN(d))return '<span class="flat">—</span>';const a=Math.abs(d*100).toFixed(1);if(Math.abs(d)<0.0005)return '<span class="flat">▪ 0.0</span>';return d>0?`<span class="up">▲ ${a}</span>`:`<span class="down">▼ ${a}</span>`;}

function rollup(history,keyFn){
  const m=new Map();
  history.forEach(h=>{const k=keyFn(h.date);const e=m.get(k)||{key:k,games:0,cr:[]};e.games+=h.games||0;if(h.catchRate!=null)e.cr.push(h.catchRate);m.set(k,e);});
  return [...m.values()].map(e=>({period:e.key,games:e.games,catchRate:avg(e.cr),nights:e.cr.length})).sort((a,b)=>a.period<b.period?1:-1);
}
function ledgerTable(rows,periodHdr,secondHdr){
  if(!rows.length) return '<div style="color:var(--dim);font-size:11px">— none yet —</div>';
  const body=rows.map(r=>`<tr><td class="model">${esc(r.period)}</td><td>${r.nights!=null?r.nights:'·'}</td><td class="up">${pct(r.catchRate)}</td><td style="color:var(--dim)">${r.games}</td></tr>`).join('');
  return `<table><thead><tr><th>${periodHdr}</th><th>${secondHdr}</th><th>Avg Catch</th><th>Games</th></tr></thead><tbody>${body}</tbody></table>`;
}

function render(data){
  // SECURITY/INTEGRITY: stats.json is fetched and rendered as the public record. Coerce it into a
  // known shape before use so a malformed or tampered file degrades gracefully instead of rendering
  // junk or throwing. This is defense-in-depth — the file's write path is the real trust boundary.
  data = (data && typeof data === 'object') ? data : {};
  data.models = Array.isArray(data.models) ? data.models.filter(m => m && typeof m === 'object') : [];
  data.history = Array.isArray(data.history) ? data.history : [];
  data.global = (data.global && typeof data.global === 'object') ? data.global : {};
  const sample=data.sample===true||(data.models||[]).some(m=>m.status==='SIM');
  document.getElementById('badge').innerHTML=sample?'<span class="badge">Sample · simulated readings</span>':'<span class="badge live">Live · measured</span>';
  document.getElementById('barright').textContent=(sample?'SAMPLE · ':'LIVE · ')+'CC0 · robots welcome';
  const gen=data.generatedAt?new Date(data.generatedAt):null;
  document.getElementById('lastsnap').textContent='last snapshot '+(gen?gen.toLocaleString('en-US',{timeZone:'America/New_York',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})+' ET':'—');

  const tape=(data.models||[]).map(m=>{const d=(m.passRate!=null&&m.prevPassRate!=null)?m.passRate-m.prevPassRate:null;const cls=d==null?'flat':(d>0?'up':(d<0?'down':'flat'));const arr=d==null?'·':(d>0?'▲':(d<0?'▼':'▪'));return `<span class="it"><span class="sym">${esc(m.label)}</span> ${pct(m.passRate)} <span class="${cls}">${arr}${d==null?'':Math.abs(d*100).toFixed(1)}</span></span>`;}).join('');
  document.getElementById('tape').innerHTML=tape?(tape+tape):'<span class="it flat">no model data yet</span>';

  const g=data.global||{},hist=data.history||[];
  if(!(data.models||[]).length&&g.catchRate==null){document.getElementById('content').innerHTML='<div class="empty">Awaiting the first nightly snapshot. Once real games feed <b>stats.json</b> at 00:01 ET, the board lights up here.</div>';return;}

  const cards=`<div class="prompt">stats --global</div><div class="cards">
    <div class="card"><div class="k">Catch Rate</div><div class="v up">${pct(g.catchRate)}</div><div class="d">humans flagged the machine</div></div>
    <div class="card"><div class="k">Walk-Free</div><div class="v down">${pct(g.walkFreeRate)}</div><div class="d">machine slipped past</div></div>
    <div class="card"><div class="k">Imposter Rate</div><div class="v" style="color:var(--silver)">${pct(g.looperRate)}</div><div class="d">a human passed AS the machine</div></div>
    <div class="card"><div class="k">Games Logged</div><div class="v">${(data.totals&&data.totals.games)||0}</div><div class="d">over ${hist.length} nights</div></div>
  </div>`;

  const models=(data.models||[]).slice().sort((a,b)=>(b.passRate||0)-(a.passRate||0));
  const rows=models.map((m,i)=>{const d=(m.passRate!=null&&m.prevPassRate!=null)?m.passRate-m.prevPassRate:null;return `<tr><td><span class="model">${i+1}. ${esc(m.label)}</span> <span class="pill ${m.status==='LIVE'?'live':'sim'}">${esc(m.status||'SIM')}</span></td><td class="price">${pct(m.passRate)}</td><td>${deltaHTML(d)}</td><td class="up">${pct(1-(m.passRate??0))}</td><td style="color:var(--gold)">${pct(m.sublimeShare)}</td><td class="down">${pct(m.trollShare)}</td><td style="color:var(--dim)">${m.games??'—'}</td></tr>`;}).join('');
  const board=`<div class="prompt">models --rank pass_rate <span class="hint"># how often its name escaped a human flag</span></div>
    <table><thead><tr><th>Model</th><th>Pass</th><th>&#916;24h</th><th>Caught</th><th>Sublime</th><th>Troll</th><th>Games</th></tr></thead><tbody>${rows||'<tr><td colspan="7" style="text-align:center;color:var(--dim)">no models reporting</td></tr>'}</tbody></table>`;

  const cs=g.crownShare||{},segs=[['sublime','Sublime','var(--gold)'],['troll','Troll','var(--down)'],['cigar','Cigar','var(--silver)'],['flag','Flag','var(--steel)'],['looper','Imposter','var(--up)']];
  const di=segs.filter(([k])=>cs[k]>0).map(([k,l,c])=>`<span style="flex:${cs[k]};background:${c}">${cs[k]>=0.1?Math.round(cs[k]*100)+'%':''}</span>`).join('');
  const dist=di?`<div class="prompt">stats --crowns</div><div class="dist">${di}</div><div class="legend">${segs.map(([k,l,c])=>`<span><span class="sq" style="background:${c}"></span>${l} ${pct(cs[k])}</span>`).join('')}</div>`:'';

  const nightly=hist.slice().sort((a,b)=>a.date<b.date?1:-1).slice(0,14).map(h=>({period:h.date,games:h.games,catchRate:h.catchRate,nights:null}));
  const monthly=rollup(hist,d=>d.slice(0,7));
  const yearly=rollup(hist,d=>d.slice(0,4));
  const ledger=`<div class="prompt">ledger --compound <span class="hint"># nightly dated &amp; laid down &#8594; monthly &#8594; yearly</span></div>
    <div class="cards" style="grid-template-columns:1fr;gap:18px">
      <div><div style="color:var(--term-dim);font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">&#9656; Nightly (dated, last 14)</div>${ledgerTable(nightly,'Date','—')}</div>
      <div><div style="color:var(--term-dim);font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">&#9656; Monthly (compounded)</div>${ledgerTable(monthly,'Month','Nights')}</div>
      <div><div style="color:var(--term-dim);font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px">&#9656; Yearly (compounded)</div>${ledgerTable(yearly,'Year','Nights')}</div>
    </div>`;

  const lb=(data.leaderboard||[]).slice(0,10);
  const lbHtml=lb.length?`<div class="prompt">curators --all-time</div><table><tbody>${lb.map((r,i)=>`<tr><td><span class="model">${i+1}. ${esc(r.handle)}</span></td><td class="price">${r.score}</td></tr>`).join('')}</tbody></table>`:'';

  document.getElementById('content').innerHTML=cards+board+dist+ledger+lbHtml;
}

function boot(cb){
  const el=document.getElementById('boot');
  const lines=[
    '<span class="mut">$</span> ./turing-ticker --tz=America/New_York --license=CC0',
    '<span class="ok">[ok]</span> mounting anonymous corpus … rates &amp; buckets only',
    '<span class="ok">[ok]</span> compounding nightly &#8594; monthly &#8594; yearly',
    '<span class="warn">[!]</span> model rows simulated until paint engine wired',
    '<span class="ok">[ok]</span> robots: welcome · dataset: schema.org/Dataset · /llms.txt',
    '<span class="mut">$</span> render --board'
  ];
  const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion:reduce)').matches;
  if(reduce){ el.innerHTML=lines.join('\n'); cb&&cb(); return; }
  let i=0; el.innerHTML='';
  (function next(){ if(i>=lines.length){cb&&cb();return;} el.innerHTML+=(i?'\n':'')+lines[i]; i++; setTimeout(next,230); })();
}

function etNow(){return new Date(new Date().toLocaleString('en-US',{timeZone:'America/New_York'}));}
function tick(){const n=etNow();document.getElementById('etclock').textContent=n.toLocaleTimeString('en-US',{hour12:false});const t=new Date(n);t.setHours(0,1,0,0);if(t<=n)t.setDate(t.getDate()+1);let s=Math.floor((t-n)/1000);const hh=String(Math.floor(s/3600)).padStart(2,'0'),mm=String(Math.floor(s%3600/60)).padStart(2,'0'),ss=String(s%60).padStart(2,'0');document.getElementById('countdown').textContent=`${hh}:${mm}:${ss}`;}
setInterval(tick,1000); tick();

boot(async ()=>{
  try{
    const r=await fetch('./stats.json',{cache:'no-store'});
    if(r.ok){const d=await r.json();
      if(d&&((d.models&&d.models.length)||(d.global&&d.global.catchRate!=null))){render(d);return;}
      if(d&&d.sample&&(!d.models||!d.models.length)){render(d);return;}}
  }catch(e){}
  render(SEED);
});
