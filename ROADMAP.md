# Roadmap

Stand: v0.6.3 · Reihenfolge: erst Funktionen, dann Komfort, App-Installation zum Schluss.

## 1 · Offene Prüfungen (Mitschnitt mit dem Original-QC)

- [ ] Menüpunkt „KO umschalten“ (`cmd type=5`) – Wert und Umschaltverhalten
- [ ] Zeitschaltuhr: Sonnenuntergang minus (`[14]=2` vermutet)
- [ ] Zeitschaltuhr: Sondertag „Gesperrt“
- [ ] Taster-Varianten `_5` / `_6`
- [ ] Szene auf dem HS speichern (Lernen) – Verhalten bestätigen
- [ ] Zeitschaltuhr-Aktionen bei Dimmern (Index der Aktionsliste)

## 2 · Funktionen (Stufe 1 „QC-Ersatz“)

- [ ] **Plugins** aus dem Menü
  - [x] Wertanzeige (v0.6.0)
  - [x] Sonos (v0.6.1)
  - [ ] Kamera live
  - [x] Kamera-Archiv (v0.6.2)
  - [x] Meldungsarchiv (v0.6.3)
  - [ ] Diagramme
  - [ ] Sprechanlage, Energieverbrauch
  - [ ] Wetter
- [x] „Jetzt verbinden“-Knopf im Hinweis „Verbindung getrennt“ (v0.5.6)
- [ ] Raum- und Gewerkesymbole aus der QC-Visu
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
- [ ] Eigene HSL3-Bausteine einbinden (z. B. ONVIF-Kameras)
- [ ] Experte-Schnittstelle (MCP-Server): Projekte ändern und übertragen ohne Mausklicks

## 5 · Zum Schluss: als App installierbar (PWA)

- [ ] `manifest.json`, Symbol, Service Worker neben `qc.html`
- [ ] Prüfen mit dem selbst signierten HS-Zertifikat (PC / Android / iOS)
