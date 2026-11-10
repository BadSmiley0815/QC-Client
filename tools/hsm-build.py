#!/usr/bin/env python3
"""hsm-build – eigene Symbole für QuadClient-Funktionsvorlagen.

Erzeugt aus einfachen SVG-Dateien ein Symbolpaket (.hsm) im Aufbau, den
Gira selbst für Vorlagen mit eigenen Symbolen verwendet, und packt es auf
Wunsch zusammen mit den Vorlagendateien in eine .hst.

Aufbau des .hsm (Zip):
  version.xml                    <qcm> mit imageType "Template"
  config_lang.xml                Paketname + Vorschau-Texte (#prev.template.<name>)
  common/<name>.xaml             hell (#DDDDDD) – Windows-QC, dunkles Design
  design_0/xaml/<name>.xaml      wie common
  design_0/w.xaml/w.<name>.xaml  dunkel (#505050) – helles Design
  design_0/svg/<name>.svg, design_0/w.svg/w.<name>.svg
  design_5/icons, icons@2x, icons@3x, w.icons@2x, w.icons@3x   PNG 40/80/120
  design_6/icons, icons@2x, w.icons@2x                         PNG 40/98
  preview/<name>.png             80×80, dunkel (nur Symbole ohne "_pop_")

Regeln für die SVG-Quellen (bewusst einfach gehalten):
  * Dateiname = Symbolname ohne Endung, muss mit "<ID>_" beginnen (z. B. 99-3_tpl_ico_on.svg)
  * viewBox "0 0 40 40" (andere Größen werden übernommen)
  * nur <path d="..."> mit absoluten oder relativen Befehlen M L H V C S Q T A Z
  * fill="currentColor" (oder kein fill) = Symbolfarbe, wird je Variante hell/dunkel gesetzt;
    jede andere Farbe (#RRGGBB) bleibt in allen Varianten gleich
  * optional fill-rule="evenodd", opacity="0..1"

Aufruf:
  hsm-build.py --id 99-3 --name "Symbole Icon-Test" --svg <ordner> --out 99-3.hsm
  hsm-build.py ... --hst <vorlagenordner> --hst-out 99-3_Icon-Test.hst

Benötigt: Python 3, rsvg-convert (librsvg) für die PNG-Varianten.
"""
import argparse, os, re, subprocess, sys, tempfile, zipfile
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

LIGHT = "#DDDDDD"   # Symbolfarbe dunkles Design
DARK = "#505050"    # Symbolfarbe helles Design ("w."-Variante)
SVGNS = "{http://www.w3.org/2000/svg}"

PNG_SETS = [  # (ordner, w.-Präfix, @-Suffix, Kantenlänge)
    ("design_5/icons", False, "", 40),
    ("design_5/icons@2x", False, "@2x", 80),
    ("design_5/icons@3x", False, "@3x", 120),
    ("design_5/w.icons@2x", True, "@2x", 80),
    ("design_5/w.icons@3x", True, "@3x", 120),
    ("design_6/icons", False, "", 40),
    ("design_6/icons@2x", False, "@2x", 98),
    ("design_6/w.icons@2x", True, "@2x", 98),
]


def read_svg(path):
    root = ET.parse(path).getroot()
    vb = (root.get("viewBox") or "0 0 40 40").replace(",", " ").split()
    x0, y0, w, h = [float(v) for v in vb]
    paths = []
    for el in root.iter():
        tag = el.tag.replace(SVGNS, "")
        if tag in ("svg", "title", "desc", "g", "defs"):
            if tag == "g" and (el.get("transform") or el.get("fill")):
                sys.exit(f"{path}: <g> mit transform/fill wird nicht unterstützt – bitte auflösen")
            continue
        if tag != "path":
            sys.exit(f"{path}: <{tag}> wird nicht unterstützt – nur <path> (Formen in Pfade umwandeln)")
        if el.get("transform"):
            sys.exit(f"{path}: transform am <path> wird nicht unterstützt")
        d = " ".join(el.get("d", "").split())
        if not d:
            continue
        fill = (el.get("fill") or "currentColor").strip()
        if fill.lower() not in ("currentcolor",) and not re.fullmatch(r"#[0-9a-fA-F]{6}", fill):
            sys.exit(f"{path}: fill={fill!r} – erlaubt sind currentColor oder #RRGGBB")
        paths.append({
            "d": d,
            "fill": None if fill.lower() == "currentcolor" else fill.upper(),
            "evenodd": el.get("fill-rule") == "evenodd",
            "opacity": float(el.get("opacity", "1")),
        })
    if not paths:
        sys.exit(f"{path}: keine Pfade gefunden")
    return (x0, y0, w, h), paths


def fmt(n):
    return ("%g" % n)


def to_svg(vb, paths, color):
    x0, y0, w, h = vb
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{fmt(w)}" height="{fmt(h)}" viewBox="{fmt(x0)} {fmt(y0)} {fmt(w)} {fmt(h)}">']
    for p in paths:
        a = f' fill="{p["fill"] or color}"'
        if p["evenodd"]:
            a += ' fill-rule="evenodd"'
        if p["opacity"] != 1:
            a += f' opacity="{fmt(p["opacity"])}"'
        out.append(f'  <path{a} d="{escape(p["d"])}"/>')
    out.append("</svg>\n")
    return "\n".join(out)


def to_xaml(vb, paths, color):
    x0, y0, w, h = vb
    out = [f'<Canvas Width="{fmt(w)}" Height="{fmt(h)}" ClipToBounds="True" '
           f'xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation">']
    for p in paths:
        c = (p["fill"] or color).lstrip("#")
        a = f'Fill="#FF{c}"'
        if p["opacity"] != 1:
            a += f' Opacity="{fmt(p["opacity"])}"'
        if x0 or y0:
            a += f' RenderTransform="1,0,0,1,{fmt(-x0)},{fmt(-y0)}"'
        rule = "EvenOdd" if p["evenodd"] else "Nonzero"
        out.append(f'<Path {a}><Path.Data><PathGeometry FillRule="{rule}" '
                   f'Figures="{escape(p["d"])}" /></Path.Data></Path>')
    out.append("</Canvas>")
    return "".join(out)


def png(svg_text, size, tmp):
    src = os.path.join(tmp, "s.svg")
    dst = os.path.join(tmp, "s.png")
    open(src, "w", encoding="utf-8").write(svg_text)
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", dst, src], check=True)
    return open(dst, "rb").read()


def build_hsm(tid, name, svgdir, labels, version):
    files = {}
    svgs = sorted(f for f in os.listdir(svgdir) if f.lower().endswith(".svg"))
    if not svgs:
        sys.exit(f"{svgdir}: keine SVG-Dateien")
    files["version.xml"] = (
        '<?xml version="1.0" encoding="utf-8"?>\n<qcm>\n  <header>\n'
        f'    <id>{tid}</id>\n    <version>{version}</version>\n    <name>#{tid}_name</name>\n'
        '    <manufacturer>QC-Client hsm-build</manufacturer>\n    <contact>-</contact>\n'
        '    <imageType>Template</imageType>\n  </header>\n</qcm>\n').encode()
    lang = ["<?xml version='1.0' encoding='utf-8'?>", "<language>",
            f'  <text key="#{tid}_name" default="{escape(name)}">',
            f'    <lang id="de" value="{escape(name)}" />', f'    <lang id="en" value="{escape(name)}" />',
            "  </text>"]
    with tempfile.TemporaryDirectory() as tmp:
        for f in svgs:
            ico = f[:-4]
            if not ico.startswith(tid + "_"):
                sys.exit(f"{f}: Symbolname muss mit '{tid}_' beginnen")
            vb, paths = read_svg(os.path.join(svgdir, f))
            light, dark = to_svg(vb, paths, LIGHT), to_svg(vb, paths, DARK)
            files[f"common/{ico}.xaml"] = to_xaml(vb, paths, LIGHT).encode()
            files[f"design_0/xaml/{ico}.xaml"] = files[f"common/{ico}.xaml"]
            files[f"design_0/w.xaml/w.{ico}.xaml"] = to_xaml(vb, paths, DARK).encode()
            files[f"design_0/svg/{ico}.svg"] = light.encode()
            files[f"design_0/w.svg/w.{ico}.svg"] = dark.encode()
            for folder, w, suf, size in PNG_SETS:
                files[f"{folder}/{'w.' if w else ''}{ico}{suf}.png"] = png(dark if w else light, size, tmp)
            if "_pop_" not in ico:
                files[f"preview/{ico}.png"] = png(dark, 80, tmp)
                label = labels.get(ico, ico)
                lang += [f'  <text key="#prev.template.{ico}" default="{escape(label)}">',
                         f'    <lang id="de" value="{escape(label)}" />',
                         f'    <lang id="en" value="{escape(label)}" />', "  </text>"]
    lang.append("</language>\n")
    files["config_lang.xml"] = "\n".join(lang).encode()
    return files


def write_zip(path, files):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for n in sorted(files):
            z.writestr(n, files[n])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--id", required=True, help="Vorlagen-ID, z. B. 99-3")
    ap.add_argument("--name", required=True, help="Name des Symbolpakets")
    ap.add_argument("--svg", required=True, help="Ordner mit den SVG-Quellen")
    ap.add_argument("--labels", help="Datei mit Zeilen 'symbolname=Beschriftung' für die Vorschau")
    ap.add_argument("--version", default="1.0.0")
    ap.add_argument("--out", help="Ziel .hsm")
    ap.add_argument("--hst", help="Ordner mit template.xml, interface.xml, … – packt .hsm mit hinein")
    ap.add_argument("--hst-out", help="Ziel .hst")
    a = ap.parse_args()
    labels = {}
    if a.labels:
        for line in open(a.labels, encoding="utf-8"):
            if "=" in line:
                k, v = line.rstrip("\n").split("=", 1)
                labels[k.strip()] = v.strip()
    files = build_hsm(a.id, a.name, a.svg, labels, a.version)
    if a.out:
        write_zip(a.out, files)
        print(f"{a.out}: {len(files)} Dateien")
    if a.hst:
        import io
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for n in sorted(files):
                z.writestr(n, files[n])
        hst = {f"{a.id}.hsm": buf.getvalue()}
        for base, _, names in os.walk(a.hst):
            for n in names:
                p = os.path.join(base, n)
                hst[os.path.relpath(p, a.hst).replace(os.sep, "/")] = open(p, "rb").read()
        for need in ("template.xml", "interface.xml", "version.xml"):
            if need not in hst:
                sys.exit(f"{a.hst}: {need} fehlt")
        out = a.hst_out or f"{a.id}.hst"
        write_zip(out, hst)
        print(f"{out}: {len(hst)} Dateien (inkl. {a.id}.hsm)")


if __name__ == "__main__":
    main()
