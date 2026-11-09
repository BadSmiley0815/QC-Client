# QC-Client – der QuadClient im Browser

Ein moderner, freier Ersatz für den **Gira QuadClient** – als eine einzige HTML-Datei,
die direkt auf dem Gira HomeServer liegt und in jedem Browser läuft: Handy, Tablet, PC.

## Ziel

Wer seine Visualisierung schon im QuadClient aufgebaut hat, soll einfach **eine App** haben –
ohne Dateien hochzuladen, ohne CSV-Exporte, ohne Vorbereitung im Experten.

**Stufe 1 – QuadClient-Ersatz**
- Anmelden nur mit **HS-Adresse, Benutzer und Passwort**.
- Die **vorhandene QC-Visu** wird direkt vom HomeServer geladen (Räume, Gewerke, Menü,
  Funktionen, Schaltuhren), die **QC-Benutzerrechte** gelten unverändert.
- Besser als das Original: **schneller, moderner, besser bedienbar**, mit Funktionen, die
  dort fehlen, und tauglich für den **Fernzugriff**.

**Stufe 2 – „extended“ (optional, geplant)**
- Erweiterungen über eine eigene WebApp, das KO-Gateway und eigene HSL3-Logikbausteine –
  z. B. moderne Kameras (ONVIF), eigene Kacheln, eigene Seiten.

## Stand (v0.7.1)

- Menü als Startseite, Räume nach Etagen, Gewerke, Favoriten
- Schalten, Dimmen, Rollo, Heizung, RGB, Tunable White, Taster (alle Varianten), Szenen
  (abrufen/lernen), Schalten mit PIN, Werteingabe, Müll, Anzeigen
- Schaltuhren anzeigen, anlegen, ändern, löschen (Uhrzeit, Zufall, Sonnenauf-/-untergang,
  Wochentage, Sondertage)
- Webseiten aus dem Menü eingebettet, Plugins „Wertanzeige“, „Sonos“, „Kamera-Archiv“, „Meldungsarchiv“, „Diagramm“ und „Balkendiagramme“ (weitere folgen)
- Neustart-Erkennung, automatisches Wiederverbinden mit „Jetzt verbinden“, Hell/Dunkel, Handy-tauglich

Alle Details: [`changelog.html`](changelog.html) · Was noch kommt: [`ROADMAP.md`](ROADMAP.md) · Protokoll-Notizen: [`docs/protokoll.md`](docs/protokoll.md)

## Installation auf dem HomeServer

1. `qc.html` im Experte-Projektordner ablegen unter
   `…\Projekte\<Projekt>\<Projekt>\hsupload\hs-client\qc.html`
2. Projekt übertragen.
3. Im Browser öffnen: `https://<HS-IP>/opt/hs-client/qc.html`
   (beim ersten Mal das Zertifikat des HomeServers bestätigen)
4. Mit einem QuadClient-Benutzer anmelden.

Zum Ausprobieren geht auch: `qc.html` lokal im Browser öffnen und die HS-Adresse eintragen.

## Tests

Die Tests laufen gegen einen nachgebauten HomeServer mit einer erfundenen Demo-Visu
(`test/demo_project.xml`). Die erwarteten Befehle stammen aus Mitschnitten des Originals.

```
npm i playwright && npx playwright install chromium
node test/run-tests.js
```

## Werkzeuge

`tools/` – kleine Python-Helfer (Python 3, `pip install websockets`):

- `qc_test.py` – Anmeldung testen, Visu laden, Live-Werte anzeigen
- `qc_probe.py` – prüft, welche Anmeldeart der HS akzeptiert
- `qc2json.py` – wandelt eine `client_project.xml` in eine schlanke JSON-Datei

## Lizenz

GNU General Public License v3.0 – siehe [`LICENSE`](LICENSE). Jeder darf den Client nutzen,
ändern und weitergeben; geänderte Fassungen müssen ebenfalls unter der GPL-3.0 offen bleiben.

## Hinweise

- Unabhängiges Projekt, **nicht von Gira** und nicht von Gira unterstützt. „Gira“,
  „HomeServer“ und „QuadClient“ sind Marken ihrer Inhaber.
- Enthält keinen Code, keine Grafiken und keine Dateien von Gira; die Schnittstelle wurde
  ausschließlich am eigenen Netzwerkverkehr beobachtet.
- Nutzung auf eigene Verantwortung – vor allem bei Schaltuhren und PIN-geschützten Funktionen.
- Nie Mitschnitte (`flows*`) oder echte Projektdateien einchecken – sie enthalten Zugangsdaten.
