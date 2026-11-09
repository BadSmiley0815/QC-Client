#!/usr/bin/env python3
"""
qc_test.py – Machbarkeitstest: spricht ohne Gira QuadClient direkt mit dem HomeServer
über dieselbe Schnittstelle (wss://<HS>/quad/ws) und lädt die QC-Visu vom HS.

Voraussetzung (einmalig):  python -m pip install websockets
Aufruf:                    python qc_test.py <HS-IP> <Benutzer>
Optional schalten:         python qc_test.py <HS-IP> <Benutzer> --toggle <KO-Nr>

Ablauf:
 1. Anmeldung (Benutzer/Passwort), HS liefert Sitzungs-ID und Projekt-ID
 2. client_project.xml mit der Sitzungs-ID vom HS laden → Räume/Elemente zählen
 3. Startwerte empfangen und 20 s lang Live-Änderungen mit KO-Namen anzeigen
 4. mit --toggle <KO>: einmal 1 senden, 3 s warten, 0 senden
Das Passwort wird nur abgefragt, nirgends gespeichert.
"""
import argparse, asyncio, base64, getpass, ssl, sys, time, urllib.request
import xml.etree.ElementTree as ET

try:
    import websockets
except ImportError:
    sys.exit("Bitte zuerst installieren:  python -m pip install websockets")


def ctx():
    c = ssl.create_default_context()
    c.check_hostname = False
    c.verify_mode = ssl.CERT_NONE          # HS hat ein selbst ausgestelltes Zertifikat
    return c


def fetch(host, path, sid):
    url = f"https://{host}{path}?{sid}"
    with urllib.request.urlopen(url, context=ctx(), timeout=20) as r:
        return r.read()


async def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("host"); ap.add_argument("user")
    ap.add_argument("--toggle", type=int, help="KO-Nummer zum Testschalten")
    ap.add_argument("--seconds", type=int, default=20)
    a = ap.parse_args()
    pw = getpass.getpass(f"Passwort für {a.user}: ")
    auth = "Basic " + base64.b64encode(f"{a.user}:{pw}".encode("utf-8")).decode()
    hdr = {"Authorization": auth}

    uri = f"wss://{a.host}/quad/ws"
    try:
        conn = websockets.connect(uri, ssl=ctx(), additional_headers=hdr, max_size=None)
    except TypeError:                                   # ältere websockets-Version
        conn = websockets.connect(uri, ssl=ctx(), extra_headers=hdr, max_size=None)

    async with conn as ws:
        hello = (await ws.recv())
        hello = hello.decode("latin-1") if isinstance(hello, bytes) else hello
        f = hello.split("|")
        if f[0] != "93":
            sys.exit(f"Unerwartete Begrüßung: {hello[:80]}")
        sid, proj, mac = f[1], f[2], (f[7] if len(f) > 7 else "?")
        print(f"✓ Angemeldet. HS {mac}, Projekt-ID {proj}")
        await ws.send("94||")

        # Visu vom HS laden
        t = time.time()
        xml = fetch(a.host, "/quad/client/client_project.xml", sid)
        root = ET.fromstring(xml)
        rooms = [e for e in root.find("rooms") if e.tag == "room"]
        devs = list(root.find("devices"))
        print(f"✓ Visu geladen: {len(xml)//1024} kB in {time.time()-t:.1f} s – "
              f"{len(rooms)} Räume, {len(devs)} Elemente")

        # KO-Nummer -> Elementname (für lesbare Ausgabe)
        names = {}
        for d in devs:
            for c in d.findall("connect"):
                names.setdefault(c.get("tag"), f"{d.get('txt')} ({c.get('slot')})")

        start, init_done, live = {}, False, 0
        toggled = False
        t_end = time.time() + a.seconds
        last_ka = time.time()
        while time.time() < t_end:
            try:
                m = await asyncio.wait_for(ws.recv(), timeout=1)
            except asyncio.TimeoutError:
                m = None
            if m is not None:
                s = m.decode("latin-1") if isinstance(m, bytes) else m
                p = s.split("|")
                if p[0] == "2":
                    start[p[1]] = p[2]
                elif p[0] == "95":
                    init_done = True
                    print(f"✓ Startwerte empfangen: {len(start)} KOs")
                    print(f"  Live-Änderungen für {a.seconds} s:")
                elif p[0] == "1" and init_done:
                    live += 1
                    print(f"  {p[1]:>6} = {p[2]:<10} {names.get(p[1], '')}")
            if init_done and a.toggle and not toggled:
                toggled = True
                print(f"→ Schalte KO {a.toggle} EIN")
                await ws.send(f"1|{a.toggle}|1")
                await asyncio.sleep(3)
                print(f"→ Schalte KO {a.toggle} AUS")
                await ws.send(f"1|{a.toggle}|0")
            if time.time() - last_ka > 25:
                await ws.send("80||"); last_ka = time.time()
        print(f"Fertig. {live} Live-Änderungen empfangen.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except websockets.exceptions.InvalidStatus as e:
        print("Anmeldung abgelehnt:", e)
    except KeyboardInterrupt:
        pass
