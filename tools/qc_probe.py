#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
"""
qc_probe.py – prüft, ob ein Browser sich am QC-WebSocket des HS anmelden könnte.
Schaltet nichts, liest nur.

Aufruf: py -3 qc_probe.py <HS-IP> <Benutzer> [Pause in s, Standard 30]
"""
import asyncio, base64, getpass, ssl, sys, urllib.request, urllib.error, urllib.parse
import websockets

HOST, USER = sys.argv[1], sys.argv[2]
PW = getpass.getpass(f"Passwort für {USER}: ")
PAUSE = int(sys.argv[3]) if len(sys.argv) > 3 else 30
B64 = base64.b64encode(f"{USER}:{PW}".encode()).decode()


def ctx():
    c = ssl.create_default_context(); c.check_hostname = False; c.verify_mode = ssl.CERT_NONE
    return c


def http_probe(path):
    req = urllib.request.Request(f"https://{HOST}{path}")
    try:
        r = urllib.request.urlopen(req, context=ctx(), timeout=10)
        return r.status, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers)
    except Exception as e:
        return str(e), {}


async def ws_try(label, uri, headers=None):
    kw = dict(ssl=ctx(), open_timeout=10)
    try:
        conn = websockets.connect(uri, additional_headers=headers or {}, **kw)
    except TypeError:
        conn = websockets.connect(uri, extra_headers=headers or {}, **kw)
    try:
        async with conn as ws:
            m = await asyncio.wait_for(ws.recv(), timeout=5)
            s = m.decode("latin-1") if isinstance(m, bytes) else m
            ok = s.startswith("93|")
            print(f"  {'✓' if ok else '?'} {label}: verbunden, erste Nachricht beginnt mit '{s[:3]}'")
    except Exception as e:
        print(f"  ✗ {label}: {type(e).__name__}: {str(e)[:90]}")


async def main():
    print("1) HTTP-Abruf von /quad/ws ohne Anmeldung (fragt der HS nach Passwort?)")
    st, h = http_probe("/quad/ws")
    print(f"   Status {st}, WWW-Authenticate: {h.get('WWW-Authenticate') or h.get('www-authenticate') or '—'}")
    print("2) WebSocket-Varianten (je 30 s Pause, damit eine evtl. Sperre abläuft)")
    base = f"wss://{HOST}/quad/ws"
    q = urllib.parse.quote(B64)
    u = urllib.parse.quote(USER, safe=""); p = urllib.parse.quote(PW, safe="")
    tests = [
        ("Header (wie QuadClient, Referenz)", base, {"Authorization": "Basic " + B64}),
        ("?authorization=<base64>", f"{base}?authorization={q}", None),
        ("Header (Referenz, Kontrolle ob Sperre)", base, {"Authorization": "Basic " + B64}),
        ("Benutzer:Passwort in der Adresse", f"wss://{u}:{p}@{HOST}/quad/ws", None),
        ("Header (Referenz, Schluss)", base, {"Authorization": "Basic " + B64}),
    ]
    for i, (label, uri, hdr) in enumerate(tests):
        if i:
            await asyncio.sleep(PAUSE)
        await ws_try(label, uri, hdr)
    print("Fertig.")

asyncio.run(main())
