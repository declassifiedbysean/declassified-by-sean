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
Everything outside the markers is yours; the tool never touches it.
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

def splice(text, region, body):
    pat=re.compile(r'(<!-- BEGIN:'+region+r' -->).*?(<!-- END:'+region+r' -->)', re.S)
    if not pat.search(text): return text, False
    return pat.sub(lambda m: m.group(1)+'\n'+body+'\n'+m.group(2), text), True

def main():
    changed=[]
    for path in glob.glob(os.path.join(ROOT,'*.html')):
        page=os.path.basename(path)
        t=open(path,encoding='utf-8').read(); orig=t; hit=False
        for region, body in (('GAMES',games_html()),('RESOURCES',resources_html()),
                             ('NAV',nav_html(page)),('FOOTER',footer_html())):
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
    # sync Cloudflare _redirects for games — Pages serves this file, not netlify.toml,
    # so the live deploy is now the one that reads it. Insert before the /* 404 catch-all.
    cf=os.path.join(ROOT,'_redirects'); cadded=[]
    if os.path.exists(cf):
        c=open(cf,encoding='utf-8').read()
        for g in REG['games']:
            r=g.get('redirect')
            if r and not re.search(r'(?m)^\s*'+re.escape(r)+r'\s', c):
                line=f'{r:<14} /{g["href"]:<27} 200\n'
                c=re.sub(r'(?m)^(/\*\s)', line+r'\1', c, count=1)
                cadded.append(r)
        if cadded: open(cf,'w',encoding='utf-8').write(c)
    print('regions rendered in:', ', '.join(changed) or '(none)')
    print('netlify redirects added:', ', '.join(added) or '(none)')
    print('cloudflare redirects added:', ', '.join(cadded) or '(none)')

if __name__=='__main__': main()
