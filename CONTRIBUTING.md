# Mitmachen am QC-Client

Danke fürs Mithelfen! Es gibt drei Wege – nimm den, der zu dir passt.

## 1. Fehler melden oder etwas wünschen (ohne Programmieren)

Lege ein [Issue](https://github.com/BadSmiley0815/QC-Client/issues/new/choose) an. Das Formular fragt ab, was gebraucht wird:

- **Version** des Clients (Seitenleiste oben bzw. Klassisch: System-Menü unten).
- **Was hast du getan, was ist passiert, was hättest du erwartet?**
- **Bildschirmfoto** der Stelle – gern auch eines vom Windows-QuadClient zum Vergleich.
- **Log-Text:** direkt nach dem Fehler „Log kopieren“ (Seitenleiste bzw. System-Menü) und einfügen.

**Vor dem Absenden bitte prüfen:** Der Log-Text enthält in der ersten Zeile die Adresse deines HomeServers –
diese Zeile löschen oder die Adresse durch `x.x.x.x` ersetzen. Benutzername und Passwort stehen nicht im Log.
Bildschirmfotos zeigen Raum- und Gerätenamen deiner Anlage; schwärze, was nicht öffentlich sein soll.

## 2. Selbst ändern (Fork und Pull Request)

1. Auf GitHub oben rechts **Fork** – du bekommst eine eigene Kopie des Repos.
2. Kopie auf den Rechner holen und einen eigenen Zweig anlegen:
   ```
   git clone https://github.com/<dein-name>/QC-Client.git
   cd QC-Client
   git checkout -b mein-thema
   ```
3. Ändern, Tests laufen lassen (siehe unten), committen, hochladen:
   ```
   git push origin mein-thema
   ```
4. Auf GitHub **Compare & pull request** – kurz beschreiben, was sich ändert und wie du es geprüft hast.

Die Tests laufen bei jedem Pull Request automatisch. Übernommen wird ein Vorschlag, wenn sie bestehen und er zu den Regeln unten passt.
Bei größeren Vorhaben bitte **vorher ein Issue** aufmachen, damit nicht zwei Leute am selben arbeiten.

## 3. Mit einer KI mitarbeiten

Das geht gut – die Regeln für KI-Assistenten stehen in [`AGENTS.md`](AGENTS.md); die meisten Werkzeuge lesen diese Datei von selbst.
Der Ablauf ist derselbe wie unter 2. Du bleibst verantwortlich für das, was du einreichst: Lies den Vorschlag deiner KI durch und probiere ihn an deinem HomeServer aus, bevor du den Pull Request aufmachst.

## Regeln für Änderungen

**Was nie ins Repo oder in ein Issue gehört**

- Dateien, Symbole, Code oder Auszüge von **Gira/DaCom** oder anderen Herstellern (z. B. gekaufte Funktionsvorlagen, `.hst`/`.hsm`-Dateien, `client_templates.xml`, entpackte QuadClient-Dateien).
- **Eigene Projektdateien** (`*.hs4`, `client_project.xml`, `users.xml`, …) und Mitschnitte des Datenverkehrs.
- **Zugangsdaten** jeder Art: HS-Adresse, Benutzer, Passwörter, Kamera-Adressen, Schlüssel.
- Bildschirmfotos echter Anlagen im Repo. Bilder für Doku und Changelog entstehen mit der erfundenen Demo-Visu (`node test/screenshots.js`).

Wenn zum Nachstellen eines Fehlers eine Vorlage oder Projektdatei nötig ist: im Issue beschreiben, **nicht anhängen** – wir klären dann, wie sie privat ankommt.

**Aufbau**

- Der Client ist **eine Datei**: `qc.html`. Keine Abhängigkeiten, kein Bau-Schritt, keine Bibliotheken von außen.
- Kommentare, Texte in der Oberfläche, Changelog und Commit-Nachrichten sind **deutsch**.
- Zeilenenden und Stil der Datei beibehalten (kompakt, wenige lange Zeilen pro Funktion).

**Zu jeder Änderung an `qc.html` gehören**

1. `const VERSION` in `qc.html` erhöhen (dritte Stelle: Korrektur oder kleine Neuerung).
2. Eintrag oben in `CHANGELOG.md` und derselbe in `changelog.html` (dort auch die Kopfzeile „Version x“); `ROADMAP.md` „Stand: vX“.
3. Ein **Test** in `test/run-tests.js`, der die Änderung prüft. Braucht er neue Daten, kommen sie als **erfundene** Einträge in die `test/demo_*`-Dateien.
4. Im Changelog ehrlich angeben, **woran geprüft wurde**: nur am nachgebauten HomeServer der Tests, oder auch an einem echten HomeServer.

Commit-Nachricht: `vX.Y.Z: kurze Beschreibung`.

## Tests

Die Tests laufen gegen einen nachgebauten HomeServer mit einer erfundenen Demo-Visu – ein echter HomeServer ist nicht nötig.

```
npm i playwright && npx playwright install chromium
node test/run-tests.js
```

Am Ende muss „Alle Tests bestanden“ stehen.

## Am eigenen HomeServer ausprobieren

`qc.html` in den Experte-Projektordner unter `…\hsupload\hs-client\qc.html` legen, Projekt übertragen, `https://<HS>/opt/hs-client/qc.html` öffnen.
Der Client liest und bedient nur, was der QuadClient-Benutzer darf; am Projekt auf dem HomeServer ändert er nichts.

## Lizenz

Mit einem Pull Request stellst du deinen Beitrag unter die Lizenz des Projekts (GPL-3.0, siehe [`LICENSE`](LICENSE)).
