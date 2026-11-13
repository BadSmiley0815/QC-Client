# Changelog – QC-Client

Alle Versionen, neueste oben. Ausführlich mit Bildern: [changelog.html](changelog.html).
Datum = Veröffentlichung auf GitHub; Versionen vor 0.5.5 entstanden vor dem Repo.

## 0.9.9 – Popups: Lage wie im Original
- **Korrigiert:** Popup-Elemente mit `layout="grid3.A1-A2+pop_btn_list.bg"` (Raster + Layoutzelle) lagen alle oben links übereinander (z. B. Listenzeilen und Symbole der Musiksteuerung 5-91). Jetzt an der richtigen Stelle; Texte links/rechts nach der Layoutzelle, Knopf-Symbole und -Texte in den Zellen `icon3`/`text1`.

## 0.9.8 – Importierte Funktionsvorlagen
- **Neu:** Importierte (nicht von Gira stammende) Funktionsvorlagen: Der Client sucht ihre Beschreibung zusätzlich im public-Bereich des HS (`/quad/public/…/public_templates.xml`, `public_language.xml`, `public_design.xml`) und schreibt ins Protokoll, was er gefunden hat und welche Vorlagen fehlen.
- **Neu:** Popups dieser Vorlagen erscheinen im Original-Stil (Raster, Knöpfe mit Markierung des aktuellen Werts, Werteingabe, OK), auch mit PIN-Abfrage. Die moderne Kachel zeigt die Texte der Felder und einen Knopf „Bedienen“ statt „unknown“.
- **Geändert:** Fehlt die Beschreibung einer Vorlage, steht in der Zeile „Vorlage … fehlt“ statt „…“.

## 0.9.7 – Jalousien mit Lamelle bedienbar
- **Behoben:** Die QC-Vorlage „Jalousie mit Lamellenverstellung“ (1-123) wurde nicht erkannt: Kachel ohne Knöpfe, Status „unknown“. Jetzt mit Auf/Stopp/Ab, Position und zusätzlich einem Regler für die Lamelle.

## 0.9.6 – 2026-11-11 – Klare Meldung bei falschem Passwort
- **Behoben:** Bei falschem Benutzer oder Passwort blieb die Anmeldung auf „Verbinde …“ stehen, weil der HomeServer die Verbindung ohne Antwort offen lässt. Jetzt bricht der Client nach 10 Sekunden ab und meldet „Benutzername oder Passwort falsch?“.

## 0.9.5 – 2026-11-11 – Seitenleiste ausblendbar, Webseiten in voller Höhe
- **Neu:** Mit ☰ oben links lässt sich die Seitenleiste auch am großen Bildschirm aus- und einblenden; der Client merkt sich die Einstellung.
- **Behoben:** Webseiten aus dem Menü (Typ Webseite) sind mindestens so hoch wie der Bildschirm. Seiten, die sich nach der Fensterhöhe richten (z. B. Grundriss, Szenen-Seite), wurden vorher winzig dargestellt.

## 0.9.4 – 2026-11-10 – Eigene Symbole aus Funktionsvorlagen
- **Neu:** Symbole, die mit einer eigenen Funktionsvorlage (Symbolpaket .hsm) importiert wurden, lädt der Client wie der Windows-QC zusätzlich aus `/quad/public/design_0/public_icons.xaml.zip`.

## 0.9.3 – 2026-11-10 – Kameras über den Kamera-Proxy
- **Neu:** Einstellung „Kamera-Proxy“ links in der Navigation: Adresse des Logikbausteins 14783 und Schlüssel, nur auf diesem Gerät gespeichert, beim Speichern geprüft.
- **Neu:** Kameras, deren Name zum Namen im Baustein passt, laufen über den Proxy – Kameras mit Anmeldung und reine http-Kameras zeigen Standbilder und in der Einzelansicht den Live-Strom. Im Experten bleibt das Kamera-Plugin unverändert.

## 0.9.2 – 2026-11-10 – Kamera über den HS fast live
- **Neu:** Kameras, deren Bild über einen Endpunkt des HomeServers kommt, laufen in der Einzelansicht fast live: nächstes Bild, sobald das vorige da ist (höchstens 5 Bilder pro Sekunde), mit Anzeige der Bilder pro Sekunde.
- **Korrigiert:** Knopf „Kamera einmal öffnen und anmelden“ entfernt – die doppelte Anmeldung hat nicht zuverlässig funktioniert. Der Hinweis nennt jetzt den Weg über einen HS-Endpunkt.

## 0.9.1 – 2026-11-09 – Plugins im Original-Stil
- **Neu:** In der Ansicht „Klassisch“ sehen Diagramm (eine Grafik, zwei Achsen, Rot/Grün/Blau, Pfeilmarken, Zeitraum mit ◀ ▶), Sonos (Cover, Knopfreihe, Lautstärke) und Kameras (◀ Name ▶, Übersicht) aus wie im Windows-QuadClient.

## 0.9.0 – 2026-11-09 – Ansicht „Klassisch“
- **Neu:** Zweite Ansicht wie der Windows-QuadClient: Kopfzeile mit Datum, Uhrzeit, Außen-/Innentemperatur, Menü in drei Spalten mit Zählern, zwei Plugin-Quadranten mit Reitern, Leiste Menü/Favoriten/System. Umschaltbar, skaliert aufs Fenster.
- **Neu:** Raumzeilen werden aus den Vorlagen des HomeServers gezeichnet und bedient – genau wie im Original, auch eigene Funktionsvorlagen.
- **Noch offen:** Popups der Vorlagen (öffnen vorerst die moderne Kachel), Plugins im Original-Stil.

## 0.8.0 – 2026-11-09 – Originale Symbole
- **Neu:** Menü, Räume und Elemente zeigen die Symbole aus der QC-Visu. Der Client holt sie vom eigenen HomeServer, wandelt sie im Browser in Vektorgrafik um und merkt sie sich – passend zu Hell und Dunkel.
- **Neu:** Fehlt ein Symbol oder ist es nicht umwandelbar, bleibt das eigene Ersatzsymbol.

## 0.7.2 – 2026-11-09 – Kamera live
- **Neu:** Plugin Kamera: alle Kameras als Kacheln, Einzelansicht mit Livebild bzw. schneller Bildfolge, Schaltknöpfe (z. B. Licht) wie im Original.
- **Neu:** Ist eine Kamera im Browser nicht erreichbar (http, Anmeldung), erscheint ein verständlicher Hinweis statt eines kaputten Bildes.
- **Neu:** Kamera-Zugangsdaten aus der Visu werden nicht übernommen, Kamera-Adressen nie angezeigt oder ins Log geschrieben.

## 0.7.1 – 2026-11-09 – Balkendiagramme
- **Neu:** Plugin Balkendiagramme: Übersicht mit aktuellen Werten, je Eintrag 24 h, 7 Tage, 28 Tage, 52 Wochen; eine oder zwei Reihen, Statistik Min/Max/Mittel/Summe, Werte beim Darüberfahren. Regeln wie im Original-QuadClient.

## 0.7.0 – 2026-11-09 – Diagramme
- **Neu:** Plugin Diagramm: Stunde, Tag, Woche, 4 Wochen, Jahr – Blockgrößen, Startzeiten und Min/Mittel/Max genau wie im Original-QuadClient.
- **Neu:** Fadenkreuz mit allen Werten zum Zeitpunkt (Maus oder Finger), aktuelle Werte in der Legende, Lücken bei fehlenden Daten, Zeitachse auf runden Uhrzeiten.
- **Neu:** Zwei Einheiten (z. B. °C und %) als zwei Diagramme übereinander statt zweier Y-Achsen – besser lesbar.

## 0.6.3 – 2026-11-09 – Meldungsarchiv
- **Neu:** Plugin Meldungsarchiv: neueste Meldungen zuerst, mit Datum, mehrere Archive als Reiter, automatisches Nachladen wie eingestellt.
- **Neu:** Suche in den Meldungen – gibt es im Original nicht.

## 0.6.2 – 2026-11-09 – Kamera-Archiv
- **Neu:** Plugin Kamera-Archiv: neuestes Bild zuerst, vor/zurück blättern, Bild direkt aus der Zeitliste wählen, mehrere Kameras als Reiter. Abruf wie im Original-QuadClient.

## 0.6.1 – 2026-11-09 – Sonos
- **Neu:** Plugin Sonos: alle Player mit Titel, Interpret, Cover, Lautstärke; Abspielen/Pause, Stopp, Weiter/Zurück, Lauter/Leiser, Stumm, Zufall, Wiederholen, Gruppe. Sendewerte aus dem Original-Plugin ausgelesen statt geraten.
- **Neu:** Plugins sind jetzt Bausteine: ein neues Plugin ist ein zusätzlicher Eintrag, der Rest bleibt unberührt.

## 0.6.0 – 2026-11-09 – Erstes Plugin: Wertanzeige
- **Neu:** Menüpunkte, die ein Plugin aufrufen, werden erkannt. Die Wertanzeige (z. B. Zählerstände Bezug, Lieferung, PV) öffnet sich unter den Kacheln und aktualisiert sich live.
- **Neu:** Der Client lädt nur Einstellungen von Plugins, die er darstellen kann – Kamera-Einstellungen mit Zugangsdaten werden gar nicht erst abgerufen.
- **Noch offen:** Kamera, Diagramme, Archive, Sonos, Wetter.

## 0.5.6 – 2026-11-09 – Jetzt verbinden
- **Neu:** Knopf „Jetzt verbinden“ im Hinweis „Verbindung getrennt“ – kein Warten auf den Countdown mehr. Während einer Anmeldesperre heißt er „Trotzdem verbinden“ und warnt, dass ein Versuch die Sperre verlängern kann.

## 0.5.5 – 2026-11-09 – Bereit für GitHub
- **Korrigiert:** Keine feste HS-Adresse mehr voreingestellt.
- **Korrigiert:** Szenen mit mehreren Tasten ordnen sich als Raster an.
- **Neu:** Browser-Tests mit erfundener Demo-Visu, Protokoll-Notizen.

## 0.5.4 – Eingebettete Webseiten richtig vermessen
- **Korrigiert:** Höhe des Felds stimmt jetzt auch bei fest positionierten Seiten wie der alten HS-Visu 1366×768.

## 0.5.3 – Immer über https
- **Neu:** Aufruf über http:// leitet automatisch auf https:// um – gleiche Herkunft wie die HS-Seiten, Zwischenablage funktioniert, Anmeldung nicht doppelt.

## 0.5.2 – Feld passt sich dem Inhalt an
- **Neu:** Eingebettete Seiten vom HomeServer bekommen genau die Höhe ihres Inhalts; fremde Seiten bleiben bildschirmhoch.

## 0.5.1 – Webseiten im Menü eingebettet
- **Neu:** Webseiten aus dem Menü öffnen sich unter den Kacheln statt in einem neuen Tab.
- **Neu:** Leiste mit Name, „In neuem Tab öffnen“ und „Schließen“ – die Adresse wird nicht angezeigt.

## 0.5 – Das QC-Menü als Startseite
- **Neu:** Menü wie in der QuadConfig: Raum, Gewerk, Etage, Webseite, KO umschalten, Unterseiten, PlugIns-Seite.
- **Neu:** Jeder Benutzer sieht nur die Einträge seiner Benutzergruppe.
- **Neu:** Zähler-Badges und Ein/Aus-Farbe live.
- **Neu:** Startseite wählbar: Menü, Favoriten oder zuletzt geöffnet.
- **Offen:** „KO umschalten“ noch gegen das Original prüfen.

## 0.4.1 – Feinschliff
- **Korrigiert:** Uhr-Symbol überdeckt lange Namen nicht mehr.
- **Neu:** Dateiname ab jetzt qc.html.

## 0.4 – Alle Schaltuhren bearbeitbar
- **Neu:** Alte Schaltpunkte änderbar – der Client schreibt sie wie das Original ins aktuelle Format um.
- **Neu:** Neue Arten: Zufall (Uhrzeit + Spanne), Sonnenaufgang plus/minus Offset.
- **Offen:** „Sonnenuntergang minus“ noch nicht mitgeschnitten.

## 0.3.3 – Log kopieren
- **Neu:** Knopf „Log kopieren“ mit Version, HS-Adresse und Uhrzeit – ohne Passwort.

## 0.3.2 – Vorlagen gefunden
- **Korrigiert:** Fehler 403 behoben: Vorlagen kommen aus /quad/client/design_4/.

## 0.3.1 – Visu immer aktuell
- **Korrigiert:** Visu wird bei jeder Anmeldung mit dem HS abgeglichen – auch nach dem Übertragen mit gleicher Projekt-ID.
- **Neu:** Versionsnummer oben im Menü.

## 0.3 – Schaltuhren
- **Neu:** Uhr-Symbol auf jeder Kachel mit Schaltuhr; Uhr ein/aus.
- **Neu:** Schaltpunkte anlegen, ändern, löschen: Uhrzeit, Sonnenuntergang plus, Wochentage, Sondertage, Aktion aus der Vorlage.

## 0.2.2 – Neustart erkennen
- **Neu:** HS nicht erreichbar → neuer Versuch alle 5 s; Anmeldung abgelehnt → 90 s warten (Sperre nach Fehlversuch).

## 0.2.1 – Rückwärtszähler
- **Neu:** Zeigt die Sekunden bis zum nächsten Verbindungsversuch.

## 0.2 – Alle QC-Funktionen aus dem Testraum
- **Neu:** Taster in allen Varianten (Flanke 1/0, Impuls 1/0).
- **Neu:** Schalten mit PIN, Szene abrufen und speichern, Werteingabe, Müll.
- **Neu:** Prozentanzeige beim Ziehen, Weiß-Regler für RGB.
- **Korrigiert:** Dunkle Scrollbalken, Betriebsart-Tasten auf dem Handy.

## 0.1 – Der erste eigene QuadClient
- **Neu:** Anmeldung mit HS-Adresse, Benutzer, Passwort – Visu kommt vom HS.
- **Neu:** Live-Werte, Favoriten, Räume nach Etagen, Gewerke.
- **Neu:** Schalten, Dimmen, Rollo, Heizung, Tunable White, RGB, Anzeigen.
- **Neu:** Automatisch wiederverbinden.
