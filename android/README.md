# QC-Client als Android-App

Eine kleine Hülle (eine Java-Datei, ein WebView), die `qc.html` als App auf Android bringt:
eigenes Symbol, ohne Adresszeile, ohne Zertifikatswarnung bei jedem Start.

Giras eigene Apps laden keine fremden Plugins; mit dieser App läuft der QC-Client samt
eigenen Plugins auch auf dem Handy.

## Wie sie arbeitet

- `qc.html` steckt in der App. Sie wird dem WebView unter der Adresse des HomeServers gereicht
  (`https://<HS>/qc-app/qc.html`, diese Datei gibt es auf dem HS nicht). Für den Browser kommen
  damit Seite und HS-Daten aus derselben Herkunft – der HS braucht keine CORS-Freigabe, und auf
  dem HS muss nichts installiert sein.
- Das Zertifikat des HS (meist selbst erstellt) bestätigt man beim ersten Start einmal. Die App
  merkt sich den SHA-256-Fingerabdruck und lässt danach nur genau dieses Zertifikat zu. Ändert es
  sich (Firmware-Update, neues Zertifikat), fragt die App erneut und zeigt alt und neu.
  Zertifikatsfehler fremder Server werden nie übergangen.
- Anmeldung, Ansicht, Favoriten usw. liegen wie im Browser im `localStorage` – hier im privaten
  Speicher der App, von Cloud-Sicherung und Geräteumzug ausgenommen.
- Kamerabilder per `http` sind erlaubt (im Browser auf der https-Seite blockiert).
- Fremde Links (z. B. Open-Meteo) öffnen im Browser; der Standort wird nur erfragt, wenn man im
  Wetter-Plugin „Gerätestandort“ wählt.
- Wer die Seite lieber vom HomeServer lädt (dann gilt immer die dort liegende Fassung), gibt
  statt der IP die ganze Adresse an: `https://<HS>/opt/hs-client/qc.html`.

Voraussetzung: Android 8 oder neuer mit aktuellem „Android System WebView“.

## Installieren (Handy)

1. `QC-Client-<Version>.apk` aufs Handy bringen (USB, eigene Cloud, Messenger an sich selbst …).
2. Datei antippen. Android fragt einmal, ob die Quelle (Dateimanager/Browser) Apps installieren
   darf → erlauben. Play Protect kennt die App nicht → „Trotzdem installieren“.
3. App „QC-Client“ starten, IP-Adresse oder Namen des HomeServers eintragen.
4. Zertifikat bestätigen (Fingerabdruck steht im Dialog).
5. Mit einem QuadClient-Benutzer anmelden – wie im Browser.

Adresse später ändern: lange auf das App-Symbol drücken → „Adresse ändern“.

Updates: neue APK einfach darüber installieren; Anmeldung und Einstellungen bleiben erhalten,
solange die APK mit demselben Schlüssel signiert ist (siehe unten).

## Bauen (Windows)

Gebraucht werden nur ein JDK und aus dem Android SDK „build-tools“ und eine „platform“ –
kein Gradle, kein Android Studio.

```
powershell -ExecutionPolicy Bypass -File android\setup-tools.ps1     (einmalig)
powershell -ExecutionPolicy Bypass -File android\build.ps1
```

- `setup-tools.ps1` lädt Temurin JDK 17 und die Android-Kommandozeilenwerkzeuge nach
  `%LOCALAPPDATA%\QC-Client-Android` (ca. 500 MB, nichts systemweit). Der `sdkmanager` zeigt
  dabei die Android-SDK-Lizenz von Google und fragt nach Zustimmung.
- `build.ps1` nimmt die `qc.html` aus dem Repo, baut und signiert
  `android\build\QC-Client-<Version>.apk`. Die Version ist die von `qc.html` plus Stand der
  Hülle, z. B. `0.9.34-a1`.
- Der Signaturschlüssel entsteht beim ersten Bau in `%LOCALAPPDATA%\QC-Client-Android`
  (`qc-client.keystore` + `.pass`) – **nicht im Repo, bitte sichern**. Mit einem anderen
  Schlüssel gebaute APKs lassen sich nicht über die vorhandene App installieren (erst
  deinstallieren, die gespeicherte Anmeldung geht dabei verloren).

Nach Änderungen an `qc.html` einfach neu bauen; nach Änderungen an der Hülle `-ShellRev`
erhöhen und in [`CHANGELOG.md`](CHANGELOG.md) eintragen.

## Veröffentlichen über GitHub

Die fertige APK liegt nicht im Repo, sondern hängt am jeweiligen
[Release](https://github.com/BadSmiley0815/QC-Client/releases). Gebaut wird sie von GitHub Actions
(`.github/workflows/android-apk.yml`), sobald ein Versions-Tag gepusht wird:

```
git tag v0.9.38
git push origin v0.9.38
```

Der Tag muss zur `VERSION` in `qc.html` passen, sonst bricht der Lauf ab. Von Hand geht es auch
(Actions → „Android-APK“ → „Run workflow“); dann liegt die APK nur als Artefakt am Lauf.

Einmalig einzurichten – zwei Secrets unter *Settings → Secrets and variables → Actions*:

| Secret | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_B64` | der Signaturschlüssel als Base64: Inhalt von `%LOCALAPPDATA%\QC-Client-Android\qc-client.keystore.b64` |
| `ANDROID_KEYSTORE_PASS` | Inhalt von `%LOCALAPPDATA%\QC-Client-Android\qc-client.keystore.pass` |

Die `.b64`-Datei erzeugt man so:
`[IO.File]::WriteAllText("$env:LOCALAPPDATA\QC-Client-Android\qc-client.keystore.b64", [Convert]::ToBase64String([IO.File]::ReadAllBytes("$env:LOCALAPPDATA\QC-Client-Android\qc-client.keystore")))`

Fehlen die Secrets, baut der Lauf absichtlich nicht: Eine mit anderem Schlüssel signierte APK ließe
sich nicht als Update über die vorhandene App installieren. Lokal gebaute und von GitHub gebaute
APKs sind mit demselben Schlüssel signiert und damit austauschbar.

## iOS

Diese Hülle gibt es nur für Android. Eine iOS-App bräuchte einen Mac mit Xcode und ein
Apple-Entwicklerkonto. Ohne Mac bleibt der Weg über Safari: `qc.html` vom HomeServer öffnen und
„Zum Home-Bildschirm“ wählen (noch nicht vorbereitet – dafür fehlen Manifest, Symbol und ein
paar Kopfzeilen in `qc.html`; das Zertifikat des HS muss dem iPhone per Profil bekannt gemacht
werden).

## Hinweise

- Unabhängiges Projekt, nicht von Gira. Enthält keinen Code und keine Grafiken von Gira; das
  App-Symbol ist eine eigene Zeichnung.
- Lizenz: GPL-3.0-or-later wie der QC-Client.
