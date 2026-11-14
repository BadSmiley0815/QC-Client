# Changelog – Android-Hülle

Stand der Hülle (`-a<Nr>` hinter der Version von `qc.html`), neueste oben.
Änderungen am QC-Client selbst stehen in [`../CHANGELOG.md`](../CHANGELOG.md).

## Veröffentlichung
- **Neu:** GitHub Actions baut die APK bei jedem Versions-Tag und hängt sie an das Release (`.github/workflows/android-apk.yml`); Einrichtung der beiden Secrets siehe [`README.md`](README.md). An der Hülle selbst ändert sich nichts.

## a1 – erste Fassung
- **Neu:** QC-Client als Android-App (ab Android 8): `qc.html` steckt in der App und läuft im WebView unter der Herkunft des HomeServers – keine Installation auf dem HS, keine CORS-Freigabe nötig.
- **Neu:** Zertifikat des HomeServers einmal bestätigen; die App merkt sich den Fingerabdruck und warnt, wenn es sich ändert.
- **Neu:** Adresse des HomeServers beim ersten Start, später über langes Drücken auf das App-Symbol → „Adresse ändern“. Ganze Adresse (`https://<HS>/opt/hs-client/qc.html`) lädt die Seite vom HS statt aus der App.
- **Neu:** Kamerabilder per http erlaubt, fremde Links öffnen im Browser, Gerätestandort für die Ortswahl im Wetter-Plugin.
- **Neu:** Bau ohne Gradle/Android Studio: `setup-tools.ps1` (JDK + Android-Build-Tools) und `build.ps1`.
