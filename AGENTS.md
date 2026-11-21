# Hinweise für KI-Assistenten

Dieses Repo enthält den **QC-Client**: eine Browser-Visualisierung für den Gira HomeServer als einzelne Datei `qc.html`.
Antworte und schreibe **deutsch** (Kommentare, Oberfläche, Changelog, Commits). Die ausführlichen Regeln stehen in [`CONTRIBUTING.md`](CONTRIBUTING.md); das Wichtigste:

## Harte Grenzen

- **Keine fremden Dateien oder Auszüge** ins Repo, in Issues oder Pull Requests: nichts von Gira/DaCom oder anderen Herstellern (Vorlagen, Symbole, Code, `client_templates.xml`, `.hst`/`.hsm`), auch nicht „nur als Beispiel“ oder als Testdatei. Testdaten in `test/demo_*` sind **selbst erfunden** und bleiben es.
- **Keine Projektdateien und keine Zugangsdaten** des Nutzers (`*.hs4`, `client_project.xml`, `users.xml`, Mitschnitte, HS-Adresse, Benutzer, Passwörter, Kamera-Adressen). Liest du solche Dateien lokal, um einen Fehler zu verstehen: Inhalte nicht ins Repo, nicht in Commit-Nachrichten und nicht in Issue-Texte übernehmen.
- **Am HomeServer des Nutzers nichts verändern**, nur lesen – es sei denn, der Nutzer verlangt es ausdrücklich.
- **Nicht committen oder pushen, ohne dass der Nutzer es sagt.** Pull Requests gehen vom Fork des Nutzers aus, nie direkt nach `main` dieses Repos.

## Arbeitsweise

- `qc.html` bleibt **eine Datei ohne Abhängigkeiten** (keine Bibliotheken, kein Bau-Schritt, keine Aufteilung in mehrere Dateien).
- Vor einer Änderung die betroffene Stelle lesen und den vorhandenen Stil übernehmen; Zeilenenden nicht umstellen.
- Zu jeder Änderung an `qc.html`: `const VERSION` erhöhen · Eintrag in `CHANGELOG.md` und `changelog.html` (samt Kopfzeile) · `ROADMAP.md` „Stand: vX“ · ein Test in `test/run-tests.js`.
- Tests: `npm i playwright && npx playwright install chromium`, dann `node test/run-tests.js` → „Alle Tests bestanden“.
- Sag dem Nutzer klar, **was woran geprüft ist**: Die Tests laufen gegen einen nachgebauten HomeServer. Ob etwas am echten HomeServer stimmt, weiß erst, wer es dort ausprobiert hat – so gehört es auch in den Changelog.
- Verhalten des Originals nicht raten: Was der Windows-QuadClient tut, belegen Bildschirmfotos des Nutzers, die Vorlagenbeschreibung auf seinem HomeServer oder `docs/protokoll.md`. Vermutungen als solche kennzeichnen.

## Wo was liegt

- `qc.html` – der Client. Oben CSS, dann HTML, dann das Skript: Verbindung und Protokoll, Projekt einlesen (`parseProject`), Ansicht „Modern“ (Kacheln, `tile`, `act`), Plugins (`PLUGIN_TYPES`), Ansicht „Klassisch“ (Präfix `cl…`, Zeilen und Popups aus den Vorlagen des HomeServers).
- `test/run-tests.js` – Browser-Tests (Playwright) mit nachgebautem HomeServer; `test/demo_*` – erfundene Demo-Visu.
- `docs/protokoll.md` – was über das Protokoll bekannt ist.
- `android/` – Android-Hülle (eigener Bereich, eigene README).
