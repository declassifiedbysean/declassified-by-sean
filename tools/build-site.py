#!/usr/bin/env python3
"""DECLASSIFIED site builder — renders the generated regions of the static
pages from games.json, so the HTML stays SEO-perfect and no-JS friendly while
the registry stays the single source of truth.

Usage:  python3 tools/build-site.py        (from the repo root)

It rewrites only the content between marker comments:
    <!-- BEGIN:GAMES -->...<!-- END:GAMES -->
    <!-- BEGIN:RESOURCES -->...<!-- END:RESOURCES -->
    <!-- BEGIN:FOOTER -->...<!-- END:FOOTER -->
    <!-- BEGIN:NAV -->...<!-- END:NAV -->
    <!-- BEGIN:SEO -->...<!-- END:SEO -->   (auto-inserted before </head>)
Everything outside the markers is yours; the tool never touches it.

The SEO region derives canonical URL, Open Graph + Twitter card tags, and
JSON-LD structured data from each page's own <title> and meta description —
edit those and rerun; never hand-edit the generated tags. The share image
lives at assets/og-card.png (source: tools/og-card-source.html).
Add a game = one entry in games.json + rerun. It also syncs netlify.toml
redirects for any game with a "redirect" field.
"""
import json, re, html, sys, os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REG  = json.load(open(os.path.join(ROOT, 'games.json'), encoding='utf-8'))
e = lambda s: html.escape(str(s), quote=True)

def games_html():
    out=[]
    for g in REG['games']:
        badge = '<span class="badge new">New</span>' if g.get('status')=='new' else (
                '<span class="badge soon">Coming</span>' if g.get('status')=='soon' else '')
        out.append(f'''  <a class="card" href="{e(g['href'])}">
    <div class="head"><span class="act">{e(g['act'])}</span><span class="era">{e(g['era'])}</span></div>
    <h3>{e(g['title'])}</h3>
    <p>{e(g['blurb'])}</p>
    <div class="foot"><span class="claims">{e(g['claims'])} claims</span>{badge}<span class="play">Play →</span></div>
  </a>''')
    return '\n'.join(out)

def resources_html():
    out=[]
    for r in REG['resources']:
        if not r.get('blurb'): continue
        out.append(f'  <a class="res" href="{e(r["href"])}"><b>{e(r["label"])}</b><span>{e(r["blurb"])}</span></a>')
    return '\n'.join(out)

def nav_html(current):
    parts=[]
    for n in REG['nav']:
        cur=' aria-current="page"' if n['href']==current else ''
        parts.append(f'<a href="{e(n["href"])}"{cur}>{e(n["label"])}</a>')
    links=''.join(parts)
    return (f'<nav class="site" aria-label="Site"><div class="wrap">'
            f'<a class="brand" href="index.html">📁 {e(REG["site"]["name"])}</a>'
            f'<div class="links">{links}</div></div></nav>')

def footer_html():
    def col(title, items):
        body=''.join(f'<a href="{e(i["href"])}">{e(i["label"])}</a>' for i in items)
        return f'<div><h3>{e(title)}</h3>{body}</div>'
    games=[{'label':f"{g['act']}: {g['title'] if g['era']=='Reference' else g['era']}", 'href':g['href']} for g in REG['games']]
    return (f'<footer class="site"><div class="wrap"><div class="cols">'
            f'{col("Games",games)}{col("Resources",REG["resources"])}{col("Legal",REG["legal"])}'
            f'</div><div class="meta">{e(REG["site"]["name"])} by {e(REG["site"]["author"])} · '
            f'Fact-Checking Game Series · {e(REG["site"]["tagline"])}</div></div></footer>')

def seo_html(page, text):
    site = REG['site']; base = site['url'].rstrip('/')
    m = re.search(r'<title>(.*?)</title>', text, re.S)
    title = html.unescape(m.group(1).strip()) if m else site['name']
    m = re.search(r'<meta name="description" content="([^"]*)"', text)
    desc = html.unescape(m.group(1)) if m else site['tagline']
    url, img = f'{base}/{page}', f'{base}/assets/og-card.png'
    lines = [
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{e(site["name"])}">',
        f'<meta property="og:title" content="{e(title)}">',
        f'<meta property="og:description" content="{e(desc)}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{e(site["name"])} — {e(site["tagline"])}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{e(title)}">',
        f'<meta name="twitter:description" content="{e(desc)}">',
        f'<meta name="twitter:image" content="{img}">',
    ]
    game = next((g for g in REG['games'] if g['href'] == page), None)
    if game:
        ld = {'@context': 'https://schema.org', '@type': 'VideoGame',
              'name': f"{site['name']} — {game['act']}: {game['title']}",
              'url': url, 'image': img, 'description': game['blurb'],
              'genre': 'Educational', 'gamePlatform': 'Web Browser',
              'playMode': 'SinglePlayer', 'isAccessibleForFree': True,
              'author': {'@type': 'Person', 'name': site['author']}}
    elif page == 'index.html':
        ld = {'@context': 'https://schema.org', '@type': 'WebSite',
              'name': site['name'], 'url': base, 'description': site['tagline'],
              'author': {'@type': 'Person', 'name': site['author']}}
    else:
        ld = None
    if ld:
        lines.append('<script type="application/ld+json">'
                     + json.dumps(ld, ensure_ascii=False) + '</script>')
    return '\n'.join(lines)

def splice(text, region, body):
    pat=re.compile(r'(<!-- BEGIN:'+region+r' -->).*?(<!-- END:'+region+r' -->)', re.S)
    if not pat.search(text): return text, False
    return pat.sub(lambda m: m.group(1)+'\n'+body+'\n'+m.group(2), text), True

def main():
    changed=[]
    for path in glob.glob(os.path.join(ROOT,'*.html')):
        page=os.path.basename(path)
        t=open(path,encoding='utf-8').read(); orig=t; hit=False
        if page!='404.html' and '<!-- BEGIN:SEO -->' not in t and '</head>' in t:
            t=t.replace('</head>','<!-- BEGIN:SEO -->\n<!-- END:SEO -->\n</head>',1)
        for region, body in (('GAMES',games_html()),('RESOURCES',resources_html()),
                             ('NAV',nav_html(page)),('FOOTER',footer_html()),
                             ('SEO',seo_html(page,t))):
            t,h=splice(t,region,body); hit=hit or h
        if hit and t!=orig:
            open(path,'w',encoding='utf-8').write(t); changed.append(page)
    # sync netlify redirects for games (missing ones appended before the 404 catch-all)
    nf=os.path.join(ROOT,'netlify.toml'); n=open(nf,encoding='utf-8').read(); added=[]
    for g in REG['games']:
        r=g.get('redirect')
        if r and f'from = "{r}"' not in n:
            block=f'[[redirects]]\n  from = "{r}"\n  to = "/{g["href"]}"\n  status = 200\n\n'
            n=n.replace('[[redirects]]\n  from = "/*"', block+'[[redirects]]\n  from = "/*"',1)
            added.append(r)
    if added: open(nf,'w',encoding='utf-8').write(n)
    print('regions rendered in:', ', '.join(changed) or '(none)')
    print('redirects added:', ', '.join(added) or '(none)')

if __name__=='__main__': main()
