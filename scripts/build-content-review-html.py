#!/usr/bin/env python3
"""
Builds an HTML review UI from content-review/*.md so proposals are easier to
read and copy than raw markdown: two-column layout (Zdaj | Predlog), a copy
button on every proposal, and a "Odpri v Prismic" link per document (new tab).

  python3 scripts/build-content-review-html.py
  open content-review/html/index.html

Doc links are resolved uid -> document id from the newest prismic-backup dump.
Re-run after editing the md files — output is fully regenerated.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REVIEW = ROOT / "content-review"
OUT = REVIEW / "html"
REPO = "endemit"

# ---------------------------------------------------------------- uid -> id
def load_uid_map():
    dumps = sorted((ROOT / "prismic-backup").glob("2*"))
    if not dumps:
        return {}
    latest = dumps[-1]
    m = {}
    for f in latest.glob("*--*--*.json"):
        typ, uid, docid = f.stem.split("--", 2)
        m[uid] = (typ, docid)
    return m

UIDMAP = load_uid_map()

def prismic_links(heading_slug):
    """heading like 'uid', 'type/uid' or 'product/wallet-top-up-{20,50,100,200}'."""
    slug = heading_slug.split("/")[-1].strip()
    uids = []
    if "{" in slug:
        prefix = slug.split("{")[0]
        uids = sorted(u for u in UIDMAP if u.startswith(prefix))
    elif slug in UIDMAP:
        uids = [slug]
    out = []
    for u in uids:
        _typ, docid = UIDMAP[u]
        out.append((u, f"https://{REPO}.prismic.io/builder/pages/{docid}"))
    return out

# ---------------------------------------------------------------- md inline
def inline(s):
    s = html.escape(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"`(.+?)`", r"<code>\1</code>", s)
    s = re.sub(r"\[(.+?)\]\((.+?)\)", r'<a href="\2">\1</a>', s)
    return s

def block_html(lines):
    """Render generic md lines (paragraphs, bullets, tables, quotes)."""
    out, i = [], 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            i += 1
            continue
        if ln.lstrip().startswith("|"):
            rows = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                cells = [c.strip() for c in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r":?-+:?", c) for c in cells):
                    rows.append(cells)
                i += 1
            if rows:
                out.append("<table><tr>" + "".join(f"<th>{inline(c)}</th>" for c in rows[0]) + "</tr>")
                for r in rows[1:]:
                    out.append("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>")
                out.append("</table>")
            continue
        if ln.lstrip().startswith(("- ", "* ")):
            out.append("<ul>")
            while i < len(lines) and lines[i].lstrip().startswith(("- ", "* ")):
                out.append(f"<li>{inline(lines[i].lstrip()[2:])}</li>")
                i += 1
            out.append("</ul>")
            continue
        if re.match(r"\d+\. ", ln.lstrip()):
            out.append("<ol>")
            while i < len(lines) and re.match(r"\d+\. ", lines[i].lstrip()):
                out.append(f"<li>{inline(re.sub(r'^\\d+\\. ', '', lines[i].lstrip()))}</li>")
                i += 1
            out.append("</ol>")
            continue
        if ln.lstrip().startswith(">"):
            q = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                q.append(lines[i].lstrip()[1:].lstrip())
                i += 1
            out.append(f"<blockquote>{block_html(q)}</blockquote>")
            continue
        # paragraph: swallow until blank
        p = [ln]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(r"(\||- |\* |> |\d+\. )", lines[i].lstrip()):
            p.append(lines[i])
            i += 1
        out.append(f"<p>{inline(' '.join(x.strip() for x in p))}</p>")
    return "\n".join(out)

def text_for_copy(lines):
    """Plain text of a value (strip blockquote markers, keep paragraphs)."""
    paras, cur = [], []
    for ln in lines:
        t = ln.lstrip()
        if t.startswith(">"):
            t = t[1:].lstrip()
        if not t.strip():
            if cur:
                paras.append(" ".join(cur))
                cur = []
        else:
            cur.append(t.strip())
    if cur:
        paras.append(" ".join(cur))
    return "\n\n".join(paras)

# ---------------------------------------------------------------- md parse
LABEL = re.compile(r"^\*\*(Zdaj[^:*]*|Predlog[^:*]*|Zakaj[^:*]*):\*\*\s*(.*)$")

def parse_field_block(lines):
    """Split a ### block into (pairs of Zdaj/Predlog, zakajs, leftovers)."""
    segments = []  # (kind, label, [lines])
    cur = None
    for ln in lines:
        m = LABEL.match(ln.strip())
        if m:
            label = m.group(1)
            kind = "now" if label.startswith("Zdaj") else "new" if label.startswith("Predlog") else "why"
            cur = (kind, label, [m.group(2)] if m.group(2) else [])
            segments.append(cur)
        elif cur is not None:
            cur[2].append(ln)
        else:
            segments.append(("free", "", [ln]))
    pairs, whys, free = [], [], []
    for kind, label, ls in segments:
        if kind == "now":
            pairs.append({"nowLabel": label, "now": ls, "newLabel": None, "new": None})
        elif kind == "new":
            if pairs and pairs[-1]["new"] is None:
                pairs[-1]["newLabel"], pairs[-1]["new"] = label, ls
            else:
                pairs.append({"nowLabel": None, "now": None, "newLabel": label, "new": ls})
        elif kind == "why":
            whys.append(ls)
        else:
            free.extend(ls)
    return pairs, whys, free

def parse_md(path):
    lines = path.read_text().splitlines()
    title = lines[0].lstrip("# ").strip() if lines and lines[0].startswith("#") else path.stem
    docs, intro = [], []
    cur_doc, cur_field = None, None
    for ln in lines[1:]:
        if ln.startswith("## "):
            cur_doc = {"heading": ln[3:].strip(), "fields": [], "free": []}
            docs.append(cur_doc)
            cur_field = None
        elif ln.startswith("### ") and cur_doc is not None:
            cur_field = {"heading": ln[4:].strip(), "lines": []}
            cur_doc["fields"].append(cur_field)
        elif cur_field is not None:
            cur_field["lines"].append(ln)
        elif cur_doc is not None:
            cur_doc["free"].append(ln)
        else:
            intro.append(ln)
    return title, intro, docs

# ---------------------------------------------------------------- html out
CSS = """
:root{--bg:#0d0d0f;--card:#17171b;--line:#2a2a30;--txt:#d7d7dc;--dim:#8b8b93;
--now:#c96a6a;--new:#69b98a;--accent:#8f7df0}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:15px/1.55 -apple-system,'Segoe UI',sans-serif;padding:32px 20px 80px}
.wrap{max-width:1280px;margin:0 auto}
h1{font-size:22px;letter-spacing:.04em}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.topnav{margin-bottom:22px;font-size:13px;display:flex;flex-wrap:wrap;gap:6px 14px}
.filter{width:100%;max-width:420px;background:var(--card);border:1px solid var(--line);
border-radius:8px;color:var(--txt);padding:9px 12px;margin:6px 0 22px;font-size:14px}
.doc{border:1px solid var(--line);border-radius:12px;margin:0 0 26px;background:var(--card);overflow:hidden}
.dochead{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 18px;border-bottom:1px solid var(--line);background:#1c1c22;position:sticky;top:0;z-index:2}
.dochead h2{font-size:16px;margin:0}
.plink{font-size:12px;border:1px solid var(--accent);border-radius:20px;padding:3px 11px;white-space:nowrap}
.field{padding:14px 18px 6px;border-bottom:1px solid var(--line)}
.field:last-child{border-bottom:0}
.fieldhead{font-size:13px;color:var(--dim);letter-spacing:.05em;text-transform:uppercase;margin-bottom:10px}
.badge{display:inline-block;font-size:11px;border-radius:4px;padding:1px 7px;margin-left:8px;font-weight:700}
.badge.EN{background:#274361;color:#9ec8f2}.badge.SL{background:#2d4a33;color:#9fdcb0}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
@media(max-width:900px){.cols{grid-template-columns:1fr}}
.cell{border:1px solid var(--line);border-radius:9px;padding:11px 13px;position:relative;background:#121216}
.cell h4{margin:0 0 7px;font-size:11px;letter-spacing:.09em;text-transform:uppercase}
.cell.now h4{color:var(--now)}.cell.new h4{color:var(--new)}
.cell.new{border-color:#2c4636}
.cell p{margin:0 0 8px}.cell p:last-child{margin-bottom:0}
.copy{position:absolute;top:8px;right:8px;background:#232329;color:var(--dim);border:1px solid var(--line);
border-radius:6px;font-size:11px;padding:3px 9px;cursor:pointer}
.copy:hover{color:#fff;border-color:var(--accent)}
.copy.ok{color:#7fe0a2;border-color:#2c4636}
.why{font-size:13px;color:var(--dim);border-left:3px solid var(--accent);padding:2px 10px;margin:2px 0 12px}
.free{font-size:14px;color:var(--dim);padding:0 0 8px}
blockquote{border-left:3px solid var(--line);margin:6px 0;padding:2px 12px;color:var(--dim)}
table{border-collapse:collapse;margin:10px 0;font-size:13px}
th,td{border:1px solid var(--line);padding:5px 10px;text-align:left}
th{background:#1e1e24}
code{background:#232329;border-radius:4px;padding:1px 5px;font-size:13px}
.count{color:var(--dim);font-size:13px;margin-left:8px}
.hidden{display:none}
"""

JS = """
function cp(btn){
  const t = btn.parentElement.querySelector('.payload').textContent;
  navigator.clipboard.writeText(t).then(()=>{btn.textContent='✓ kopirano';btn.classList.add('ok');
    setTimeout(()=>{btn.textContent='kopiraj';btn.classList.remove('ok')},1400)});
}
function flt(inp){
  const q = inp.value.toLowerCase();
  document.querySelectorAll('.doc').forEach(d=>{
    d.classList.toggle('hidden', q && !d.textContent.toLowerCase().includes(q));
  });
}
"""

def cell(kind, title_txt, lines):
    body = block_html(lines)
    payload = html.escape(text_for_copy(lines))
    btn = f'<button class="copy" onclick="cp(this)">kopiraj</button>' if kind == "new" else ""
    return (f'<div class="cell {kind}">{btn}<h4>{html.escape(title_txt)}</h4>'
            f'{body}<div class="payload" style="display:none">{payload}</div></div>')

def render_field(f):
    head = f["heading"]
    badge = ""
    for lang in ("EN", "SL"):
        if re.search(rf"\({lang}[)|]|\|\s*{lang}\)|\b{lang}\)$", head) or f"({lang})" in head:
            badge += f'<span class="badge {lang}">{lang}</span>'
    pairs, whys, free = parse_field_block(f["lines"])
    out = [f'<div class="field"><div class="fieldhead">{inline(head)}{badge}</div>']
    if free and any(x.strip() for x in free):
        out.append(f'<div class="free">{block_html(free)}</div>')
    for p in pairs:
        out.append('<div class="cols">')
        out.append(cell("now", p["nowLabel"] or "Zdaj", p["now"] or []))
        out.append(cell("new", p["newLabel"] or "Predlog", p["new"] or []))
        out.append("</div>")
    for w in whys:
        out.append(f'<div class="why">{block_html(w)}</div>')
    out.append("</div>")
    return "\n".join(out)

def render_doc(d):
    heading = d["heading"]
    slugpart = heading.split("—")[0].split("–")[0].strip()
    links = "".join(
        f'<a class="plink" target="_blank" rel="noopener" href="{url}">Prismic ↗ {html.escape(u) if len(prismic_links(slugpart))>1 else ""}</a>'
        for u, url in prismic_links(slugpart)
    )
    out = [f'<div class="doc"><div class="dochead"><h2>{inline(heading)}</h2>{links}</div>']
    if d["free"] and any(x.strip() for x in d["free"]):
        out.append(f'<div class="field"><div class="free">{block_html(d["free"])}</div></div>')
    for f in d["fields"]:
        out.append(render_field(f))
    out.append("</div>")
    return "\n".join(out)

def page(title, body, nav):
    return f"""<!doctype html><html lang="sl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><style>{CSS}</style></head>
<body><div class="wrap"><div class="topnav">{nav}</div><h1>{html.escape(title)}</h1>
<input class="filter" placeholder="filter… (uid, beseda, 'marketing', 'pa'…)" oninput="flt(this)">
{body}</div><script>{JS}</script></body></html>"""

def main():
    OUT.mkdir(exist_ok=True)
    mds = sorted(p for p in REVIEW.glob("*.md") if p.name != "INDEX.md")
    order = ["INDEX"] + [p.stem for p in mds]
    def nav(active):
        parts = []
        for name in order:
            href = "index.html" if name == "INDEX" else f"{name}.html"
            label = name if name != "INDEX" else "⌂ INDEX"
            parts.append(f'<a href="{href}"{" style=\"font-weight:700\"" if name == active else ""}>{label}</a>')
        return " ".join(parts)

    pages_meta = []
    for p in mds:
        title, intro, docs = parse_md(p)
        n_fields = sum(len(d["fields"]) for d in docs)
        body = ""
        if intro and any(x.strip() for x in intro):
            body += f'<div class="free">{block_html(intro)}</div>'
        body += "\n".join(render_doc(d) for d in docs)
        (OUT / f"{p.stem}.html").write_text(page(title, body, nav(p.stem)))
        pages_meta.append((p.stem, title, len(docs), n_fields))

    # index: render INDEX.md + page list
    idx_md = REVIEW / "INDEX.md"
    title, intro, docs = parse_md(idx_md) if idx_md.exists() else ("Pregled", [], [])
    body = f'<div class="free">{block_html(intro)}</div>'
    body += "<h2>Strani</h2><ul>"
    for stem, t, nd, nf in pages_meta:
        body += f'<li><a href="{stem}.html">{html.escape(t)}</a><span class="count">{nd} dokumentov, {nf} predlogov</span></li>'
    body += "</ul>"
    for d in docs:  # sections of INDEX.md (critical findings etc.)
        body += f'<div class="doc"><div class="dochead"><h2>{inline(d["heading"])}</h2></div>'
        body += f'<div class="field"><div class="free">{block_html(d["free"])}</div>'
        for f in d["fields"]:
            body += render_field(f)
        body += "</div></div>"
    (OUT / "index.html").write_text(page("Pregled Prismic vsebine", body, nav("INDEX")))
    print(f"Built {len(pages_meta) + 1} pages → {OUT}")

if __name__ == "__main__":
    main()
