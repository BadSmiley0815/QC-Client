#!/usr/bin/env python3
"""Erzeugt CHANGELOG.md aus changelog.html (Inhalt) und der Git-Historie (Datum je Version).
Aufruf im Repo-Wurzelverzeichnis: python3 tools/changelog_md.py"""
import html, re, subprocess
src = open("changelog.html", encoding="utf-8").read()
dates = {}
for line in subprocess.run(["git", "log", "--format=%ad %s", "--date=short"], capture_output=True, text=True).stdout.splitlines():
    m = re.match(r"(\S+) (?:QC-Client )?v(\d+(?:\.\d+)+)\b", line)
    if m: dates.setdefault(m.group(2), m.group(1))
TAG = {"neu": "Neu", "fix": "Behoben", "geändert": "Geändert", "besser": "Verbessert"}
def text(s):
    s = re.sub(r"<code>(.*?)</code>", r"`\1`", s); s = re.sub(r"<b>(.*?)</b>|<strong>(.*?)</strong>", lambda m: "**" + (m.group(1) or m.group(2)) + "**", s)
    s = re.sub(r'<a href="([^"]+)"[^>]*>(.*?)</a>', r"[\2](\1)", s)
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip()
out = ["# Changelog – QC-Client", "",
       "Alle Versionen, neueste oben. Ausführlich mit Bildern: [changelog.html](changelog.html).",
       "Datum = Veröffentlichung auf GitHub; Versionen vor 0.5.5 entstanden vor dem Repo.", ""]
for m in re.finditer(r'<h3><span class="ver">v([^<]+)</span>(.*?)</h3>\s*<ul>(.*?)</ul>', src, re.S):
    ver, title, body = m.group(1), text(m.group(2)), m.group(3)
    d = dates.get(ver)
    out.append(f"## {ver}" + (f" – {d}" if d else "") + f" – {title}")
    for li in re.findall(r"<li>(.*?)</li>", body, re.S):
        t = re.match(r'\s*<span class="tag t-([^"]+)">([^<]*)</span>\s*(.*)', li, re.S)
        out.append(f"- **{TAG.get(t.group(2).strip(), t.group(2).strip().capitalize())}:** {text(t.group(3))}" if t else f"- {text(li)}")
    out.append("")
open("CHANGELOG.md", "w", encoding="utf-8").write("\n".join(out))
print(len(re.findall(r"^## ", "\n".join(out), re.M)), "Versionen")
