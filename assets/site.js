/* ==========================================================================
   DECLASSIFIED — shared shell (assets/site.js)
   Drop-in nav + footer for ANY page, rendered from games.json so the link
   lists can never drift out of date again (the Act III footer bug).
   Adoption is two lines in <head>/<body>:
     <link rel="stylesheet" href="assets/site.css">
     <script src="assets/site.js" defer></script>
   Then place <div data-site-nav></div> and/or <div data-site-footer></div>
   where the nav/footer should render. Pages without the markers are left
   completely untouched — safe to include anywhere.
   ========================================================================== */
(function(){
  'use strict';
  function el(tag, attrs, html){ const e=document.createElement(tag); for(const k in (attrs||{})) e.setAttribute(k, attrs[k]); if(html!==undefined) e.innerHTML=html; return e; }
  function esc(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  const here=(location.pathname.split('/').pop()||'index.html');

  function renderNav(host, data){
    const links=data.nav.map(n=>'<a href="'+esc(n.href)+'"'+(n.href===here?' aria-current="page"':'')+'>'+esc(n.label)+'</a>').join('');
    host.outerHTML='<nav class="site" aria-label="Site"><div class="wrap">'
      +'<a class="brand" href="index.html">📁 '+esc(data.site.name)+'</a>'
      +'<div class="links">'+links+'</div></div></nav>';
  }
  function renderFooter(host, data){
    const col=(title,items)=>'<div><h3>'+esc(title)+'</h3>'+items.map(i=>'<a href="'+esc(i.href)+'">'+esc(i.label)+'</a>').join('')+'</div>';
    const games=data.games.map(g=>({label:g.act+': '+(g.era==='Reference'?g.title:g.era), href:g.href}));
    host.outerHTML='<footer class="site"><div class="wrap"><div class="cols">'
      +col('Games',games)+col('Resources',data.resources)+col('Legal',data.legal)
      +'</div><div class="meta">'+esc(data.site.name)+' by '+esc(data.site.author)
      +' · Fact-Checking Game Series · '+esc(data.site.tagline)+'</div></div></footer>';
  }
  function boot(data){
    document.querySelectorAll('[data-site-nav]').forEach(h=>renderNav(h,data));
    document.querySelectorAll('[data-site-footer]').forEach(h=>renderFooter(h,data));
    document.dispatchEvent(new CustomEvent('declassified:ready',{detail:data}));
  }
  if(document.querySelector('[data-site-nav],[data-site-footer]')){
    fetch('games.json').then(r=>r.json()).then(boot).catch(function(){/* leave static fallback content in place */});
  }
  /* Public helper for game pages and future integrations */
  window.DECLASSIFIED={ registry: ()=>fetch('games.json').then(r=>r.json()) };
})();
