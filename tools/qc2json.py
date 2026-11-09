#!/usr/bin/env python3
"""
qc2json – liest die vom Gira QuadClient zwischengespeicherte Visu-Konfiguration
(client_project.xml) und erzeugt daraus eine schlanke JSON-Datei für einen
eigenen Client.

Quelle:  %LOCALAPPDATA%\\QuadClient\\<MAC des HS>\\client\\client_project.xml
Aufruf:  python qc2json.py <client_project.xml> [ausgabe.json]

Es werden nur die Projektdaten übernommen (Räume, Gewerke, Elemente,
KO-Verknüpfungen, Parameter, Menü, Zeitschaltuhr-Verweise) – keine Gira-Grafiken
oder Vorlagenlogik.
"""
import json
import os
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

VERSION = "1.0"
INTERNAL_BASE = 1_000_000_000

# Vorlagen-ID (Basis ohne _Variante) -> Elementart im eigenen Client
KIND = {
    "1-101": "switch",        # Schalten mit Rückmeldung
    "1-106": "switch_pin",    # Schalten mit PIN
    "1-114": "switch_value",  # Schalten + Wertanzeige (z. B. Backofen)
    "1-118": "button",        # Taster / Zentral-Befehl
    "1-102": "dimmer",
    "32-300": "dimmer",
    "1-107": "blind",         # Jalousie/Rollo inkl. Wind/Regen/Eis
    "1-103": "thermostat",    # Heizung / RTR
    "1-109": "scene",
    "1-120": "rgb",
    "1-128": "tunable_white",
    "1-125": "value",         # Wertanzeige
    "1-112": "status",        # Status mit 2 Rückmeldungen
    "1-116": "text",          # Textanzeige
    "1-117": "state_icon",
    "79-01": "level",         # SoC / Füllstand
    "0-7":   "waste",         # Müllabfuhr
    "1-129": "plugin_link",   # Link / Webseite / Plugin
    "5-21":  "spacer",        # Leerfeld / Platzhalter
}


def vis(e):
    return {
        "qc": e.get("visibleinqc", "1") == "1",
        "ios": e.get("visibleiniphone", "1") == "1",
        "android": e.get("visibleinandroid", "1") == "1",
    }


def conv_value(v):
    if v is None:
        return None
    lv = v.lower()
    if lv == "true":
        return True
    if lv == "false":
        return False
    try:
        if v.strip() != "" and v.strip().lstrip("-").replace(".", "", 1).isdigit():
            return float(v) if "." in v else int(v)
    except ValueError:
        pass
    return v


def convert(path):
    root = ET.parse(path).getroot()
    out = {
        "format": "qc2json",
        "version": VERSION,
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": os.path.abspath(path),
    }

    # HS-Kennung aus info.xml (eine Ebene über client/)
    info = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(path))), "info.xml")
    if os.path.exists(info):
        ir = ET.parse(info).getroot()
        out["hs"] = {"mac": ir.get("MAC"), "project_id": ir.get("ID")}

    # Kopfzeile
    hdr = root.find("header")
    out["header"] = {c.tag: int(c.get("tag")) for c in hdr} if hdr is not None else {}

    # Elemente
    elements = {}
    unknown = set()
    for d in root.find("devices"):
        tpl = d.get("template", "")
        base, _, variant = tpl.partition("_")
        kind = KIND.get(base)
        if kind is None:
            unknown.add(base)
            kind = "unknown"
        kos, internal = {}, {}
        for c in d.findall("connect"):
            n = int(c.get("tag"))
            # IDs ab 1.000.000.000 legt der Experte intern für Vorlagen an (keine echten KOs)
            (internal if n >= INTERNAL_BASE else kos)[c.get("slot")] = n
        params = {}
        for s in d.findall("set"):
            params[s.get("parameter")] = conv_value(s.get("value"))
        el = {
            "name": d.get("txt", ""),
            "kind": kind,
            "template": base,
            "variant": int(variant) if variant.isdigit() else None,
            "symbol": (d.get("symbol") or "").replace(".xaml", "") or None,
            "kos": kos,
            "params": params,
        }
        if internal:
            el["internal"] = internal
        if d.get("uhr"):
            el["timer"] = d.get("uhr")
        if "par_url" in params and params["par_url"]:
            el["url"] = params["par_url"]
        elements[d.get("id")] = el

    # Elementgruppen (Räume + Gewerke)
    groups = {}
    for g in root.find("device_groups"):
        items = []
        for d in g:
            items.append({
                "ref": d.get("id"),
                "label": d.get("text") or None,
                "visible": vis(d),
                "usergroups": int(d.get("group", "0")),
                "missing": d.get("id") not in elements,
            })
        groups[g.get("id")] = {"title": g.get("title"), "items": items}

    # Geschosse / Räume
    floors, by_uid = [], {}
    for e in root.find("rooms"):
        if e.tag == "floor":
            f = {"id": e.get("uid"), "name": e.get("txt"), "visible": vis(e),
                 "usergroups": int(e.get("group", "0")), "rooms": []}
            floors.append(f)
            by_uid[e.get("uid")] = f
        else:
            g = groups.get(e.get("device_group"), {"items": []})
            room = {"id": e.get("uid"), "name": e.get("txt"), "visible": vis(e),
                    "usergroups": int(e.get("group", "0")), "items": g["items"]}
            parent = by_uid.get(e.get("parent"))
            if parent is not None:
                parent["rooms"].append(room)
    room_dgs = {e.get("device_group") for e in root.find("rooms") if e.tag == "room"}
    out["floors"] = floors
    out["trades"] = [{"id": gid, "name": g["title"], "items": g["items"]}
                     for gid, g in groups.items() if gid not in room_dgs]

    # Hauptmenü
    menu = []
    for m in root.find("menu"):
        item = {"id": m.get("id"), "type": m.tag, "text": [m.get("txt1"), m.get("txt2")],
                "icon": (m.get("ico") or "").replace(".xaml", "") or None,
                "visible": vis(m), "usergroups": int(m.get("group", "0"))}
        if m.tag == "page_item":
            item["page"] = int(m.get("page"))
        cmd = m.find("cmd")
        if cmd is not None:
            item["cmd"] = {k: conv_value(v) for k, v in cmd.attrib.items()}
        states = [{k: conv_value(v) for k, v in s.attrib.items()} for s in m.findall("state")]
        if states:
            item["states"] = states
        menu.append(item)
    out["menu"] = menu

    out["timers"] = [u.get("id") for u in root.find("uhren")]
    out["plugins"] = [p.attrib for p in root.find("info") if p.tag == "plugin"]
    out["terminals"] = [{k: t.get(k) for k in ("id", "name", "type", "homemenu")}
                        for t in root.find("terminals")]
    out["elements"] = elements

    used = sorted({ko for el in elements.values() for ko in el["kos"].values()}
                  | set(out["header"].values()))
    out["kos"] = used

    out["stats"] = {
        "floors": len(floors),
        "rooms": sum(len(f["rooms"]) for f in floors),
        "trades": len(out["trades"]),
        "elements": len(elements),
        "kos": len(used),
        "timers": len(out["timers"]),
        "menu_items": len(menu),
        "unknown_templates": sorted(unknown),
    }
    return out


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else "qc_visu.json"
    data = convert(src)
    with open(dst, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=1)
    s = data["stats"]
    print(f"{dst}: {s['floors']} Geschosse, {s['rooms']} Räume, {s['trades']} Gewerke, "
          f"{s['elements']} Elemente, {s['kos']} KOs, {s['timers']} Uhren")
    if s["unknown_templates"]:
        print("Unbekannte Vorlagen:", ", ".join(s["unknown_templates"]))


if __name__ == "__main__":
    main()
