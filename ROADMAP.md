# Roadmap

Stand: v0.9.3 · Reihenfolge: erst Funktionen, dann Komfort, App-Installation zum Schluss.

## 1 · Offene Prüfungen (Mitschnitt mit dem Original-QC)

- [ ] Menüpunkt „KO umschalten“ (`cmd type=5`) – Wert und Umschaltverhalten
- [ ] Zeitschaltuhr: Sonnenuntergang minus (`[14]=2` vermutet)
- [ ] Zeitschaltuhr: Sondertag „Gesperrt“
- [ ] Taster-Varianten `_5` / `_6`
- [ ] Szene auf dem HS speichern (Lernen) – Verhalten bestätigen
- [ ] Zeitschaltuhr-Aktionen bei Dimmern (Index der Aktionsliste)

## 2 · Funktionen (Stufe 1 „QC-Ersatz“)

- [ ] **Plugins** aus dem Menü
  - [x] Wertanzeige (v0.6.0, am HS bestätigt)
  - [x] Sonos (v0.6.1)
  - [x] Kamera live (v0.7.2) – Bilder über den HS (KO-Gateway-Endpunkt) oder Kameras ohne Anmeldung per https; Digest/http nur eingeschränkt
    - [x] Endpunkt-Kameras fast live, bis 5 Bilder/s (v0.9.2)
    - [x] Kamera-Proxy über Logikbaustein 14783 (v0.9.3, am HS bestätigt: 3 Axis-Kameras, Standbild + MJPEG-Strom)
  - [x] Kamera-Archiv (v0.6.2, am HS bestätigt)
  - [x] Meldungsarchiv (v0.6.3)
  - [x] Diagramme (v0.7.0, am HS bestätigt)
  - [x] Balkendiagramme (v0.7.1)
  - [ ] Energieverbrauch (1-4) – zurückgestellt. Im Original ein Kostenrechner (Tarif, Abschlag, Prognose),
        der Einstellungen auf den HS zurückschreibt. Erster Schritt: reine Verbrauchsansicht mit Vorjahresvergleich, ohne Schreiben.
  - [ ] Sprechanlage
    - [ ] SIP-Client für das Gira TKS (Türkommunikation im Browser: Klingeln, Sprechen, Türöffner, Bild)
    - [ ] Türkommunikations-Client für Gira (wie der Gira TKS-Client unter Windows)
    - [ ] Gira System 106 (Türstation) einbinden
  - [ ] Wetter
- [x] „Jetzt verbinden“-Knopf im Hinweis „Verbindung getrennt“ (v0.5.6)
- [x] Symbole aus der QC-Visu (v0.8.0)
- [ ] Eigene Symbole in Funktionsvorlagen: `tools/hsm-build.py` + Testvorlage 99-3 – Test am HS offen
- [x] Ansicht „Klassisch“ wie der Windows-QuadClient (v0.9.0)
  - [ ] Popups der Vorlagen im Original-Stil
  - [x] Plugins in den Quadranten im Original-Stil (Diagramm, Sonos, Kamera – v0.9.1)
  - [ ] Farbbalken bei RGB-Zeilen, MyTouch, Notiz
- [ ] Fernzugriff über Gira S1 testen
- [ ] Realer HS-Neustart mit v0.5.x beobachten (Erkennung, Countdown, Wiederverbinden)

Alle Funktionsvorlagen, die in typischen Projekten vorkommen, sind bereits umgesetzt
(Schalten, PIN, Wert, Taster, Dimmer, Jalousie, Thermostat, Szene, RGB(W), Tunable White,
Status, Text, Zustandssymbol, Pegel, Müll, Link, Platzhalter, Zeitschaltuhren).

## 3 · GitHub

- [ ] Demo-Modus (läuft ohne HS mit dem Testprojekt aus `test/`)
- [ ] Releases mit Versionsnummer und ZIP
- [ ] Automatische Tests (GitHub Actions, `test/run-tests.js`)

## 4 · Stufe 2 „extended“ (optional)

- [ ] Erweiterungen über eigene WebApp / KO-Gateway
- [ ] Eigene HSL3-Bausteine einbinden (z. B. ONVIF-Kameras; Kamerabilder über den HS bereitstellen, damit sie im Browser ohne Anmeldung an der Kamera laufen)
- [ ] Experte-Schnittstelle (MCP-Server): Projekte ändern und übertragen ohne Mausklicks

## 5 · Zum Schluss: als App installierbar (PWA)

- [ ] `manifest.json`, Symbol, Service Worker neben `qc.html`
- [ ] Prüfen mit dem selbst signierten HS-Zertifikat (PC / Android / iOS)
