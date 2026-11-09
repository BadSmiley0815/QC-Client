# QuadClient-Schnittstelle des Gira HomeServers – Notizen

Diese Notizen beschreiben, was der Gira QuadClient mit dem HomeServer austauscht.
Sie stammen aus Mitschnitten des **eigenen** Netzwerkverkehrs (mitmproxy) zwischen dem
Original-QuadClient und einem HomeServer mit Experte 4.13 – Interoperabilitäts-Analyse,
kein Code und keine Dateien von Gira. Alles, was `qc.html` sendet, ist hier belegt.
Nicht belegte Punkte sind als **ungeprüft** markiert.

## Verbindung

| Schritt | Inhalt |
|---|---|
| WebSocket | `wss://<HS>/quad/ws` |
| Anmeldung | Header `Authorization: Basic base64(benutzer:passwort)` **oder** `?authorization=<base64>` an der URL (geht auch im Browser) |
| Begrüßung HS → Client | `93\|<sid>\|<projekt-id>\|…\|<MAC>\|…` |
| Antwort Client | `94\|\|` |
| Startwerte | `2\|<ko>\|<wert>\|<x>` … abgeschlossen mit `95\|\|` |
| Änderungen HS → Client | `1\|<ko>\|<wert>\|<x>` |
| Senden Client → HS | `1\|<ko>\|<wert>` (der HS bestätigt mit `1\|<ko>\|<wert>\|0`) |
| Keepalive | `80\|\|` → `81\|<zeit>\|` |

Nach einer **fehlgeschlagenen** Anmeldung sperrt der HS alle Anmeldungen für ca. 30–90 s
(HTTP 403/503). Der HS sendet `access-control-allow-origin: *`.

## Dateien (mit der Sitzungs-ID)

| Datei | Inhalt |
|---|---|
| `/quad/client/client_project.xml?<sid>` | Visu aus der QuadConfig: Räume, Gewerke, Elemente, Menü, Benutzer |
| `/quad/client/design_<n>/client_templates.xml?<sid>` | Funktionsvorlagen (u. a. Aktionen der Schaltuhren); der QC nutzt `design_4` |
| `/quad/client/client_language.xml?<sid>` | Texte der Vorlagen |
| `/quad/client/quad_plugin.xml?<sid>` | Plugin-Klassen und -Instanzen (`plugin_instance id class title project`) |
| `/quad/plugins/project/<class>_<id>.xml?<sid>` | Einstellungen einer Plugin-Instanz |
| `/quad/plugins/language/<class>_lang.xml?<sid>` | Texte eines Plugins |

KO-Nummern in der Visu sind die internen KO-IDs des HS; der QuadClient braucht **keine**
Endpunkt-Freigaben im KO-Gateway.

## Funktionsvorlagen – was gesendet wird

| Vorlage | Bedienung | Gesendet |
|---|---|---|
| 1-118 Taster `_1` Flanke 1 | loslassen | `1` |
| 1-118 Taster `_2` Flanke 0 | loslassen | `0` |
| 1-118 Taster `_3` Impuls 1 | drücken / loslassen | `1` / `0` |
| 1-118 Taster `_4` Impuls 0 | drücken / loslassen | `0` / `1` |
| 1-118 `_5` HS-Szene, `_6` HS-Sequenz | – | **ungeprüft** |
| 1-106 Schalten mit PIN | PIN wird **im Client** gegen das PIN-Objekt geprüft, dann | `1`/`0` aufs Schaltobjekt |
| 1-109 Szene | kurz / ≥ 1 s halten (lernbar) | Szenennummer / Nummer + 128 |
| 1-125 Werteingabe | Plus/Minus, Eingabe | absoluter neuer Wert |
| 0-7 Müll | „Erledigt“ | `0` (1 = fällig) |
| 1-102 Dimmer | Schieber / Taste | Wert in % / `1`·`0` |
| 1-107 Rollo | lang / kurz / Position | `slot_long` 0·1, `slot_short` 0·1, % |
| 1-103 Heizung | Sollwert, Betriebsart | absoluter Sollwert, 1–4 |
| 1-120 RGB | Farbe | 4 Byte: R, G, B, W je 0–100 % |
| 1-128 Tunable White | Helligkeit, Farbtemperatur | % |

Hinweis: Der PIN-Code wird dem Client beim Start im Klartext als KO-Wert mitgeliefert.

## Schaltuhren

| Richtung | Nachricht | Bedeutung |
|---|---|---|
| HS → Client | `10\|uhr\|aktiv\|anzahl\|maxNr` | Uhr |
| HS → Client | `11\|uhr\|nr\|punkt` | Schaltpunkt |
| HS → Client | `12\|uhr\|aktiv\|anzahl\|maxNr` | neuer Stand |
| Client → HS | `13\|uhr\|2\|0\|punkt` | Punkt anlegen |
| Client → HS | `13\|uhr\|3\|nr\|punkt` | Punkt ändern |
| Client → HS | `13\|uhr\|1\|nr\|` | Punkt löschen |
| Client → HS | `12\|uhr\|1` / `12\|uhr\|0` | ganze Uhr ein / aus |
| HS → Client | `13\|2\|uhr\|nr\|punkt` / `13\|3\|uhr\|nr\|…` | gespeichert / gelöscht |

Der HS meldet Änderungen an alle verbundenen Clients.

### Schaltpunkt (26 Ziffern)

| Stelle | Bedeutung |
|---|---|
| 0 | immer `1` |
| 1–7 | Wochentage Mo … So (`1` = aktiv) |
| 8–12 | unbekannt (`00000`) |
| 13 | Astro (`1`) oder nicht (`0`) |
| 14 | Art – ohne Astro: `1` Uhrzeit, `2` Zufall · mit Astro: `0` SA −, `1` SA +, `3` SU +, `2` vermutlich SU − (**ungeprüft**) |
| 15–18 | Uhrzeit bzw. Offset `hhmm` |
| 19–22 | bei Zufall: Zufallsspanne `hhmm` |
| 23 | Sondertage: `0` Alle Tage, `1` Ohne Sondertage, `2` Nur Feiertage, `3` Nur Urlaubstage („Gesperrt“ **ungeprüft**) |
| 24–25 | Aktion (Nummer in der Aktionsliste der Vorlage, 2-stellig) |

Ältere Punkte haben **27** Ziffern (Aktion 3-stellig). Beim Ändern schreibt der QC sie ins
26er-Format um (Stellen 0–12 bleiben).

Beispiele (aus Mitschnitten):

```
11111100000000107150000001   07:15, Mo–Fr, Aktion 1
11010100000001300300000302   SU + 00:30, Mo Mi Fr, Nur Urlaubstage, Aktion 2
11111111000000200150500002   Zufall: Zeit 00:15, Spanne 05:00, täglich, Aktion 2
```

## Menü (QuadConfig „Menü“)

`<mnu_item>` mit `txt1`, `txt2`, `group` (Bitmaske der Benutzergruppen, Bit n-1 = Gruppe n),
optional `<state type="1|3" tag="…">` (Ein/Aus-Farbe bzw. Zähler) und `<cmd>`:

| `cmd type` | Bedeutung |
|---|---|
| 3 | Raum (`room`) |
| 4 | Gewerk (`device_group`) |
| 7 | Etage (`floor`) |
| 6 | Webseite (`url0`) |
| 5 | KO setzen (`tag`, `op="toggle"`, `value`) – Umschalten **ungeprüft** |
| 2 | Plugin (`plugin_id` = Instanz aus `quad_plugin.xml`) |

Unterseiten: `<page_item page="n">` + Einträge mit `page="n"`.

## Plugins

Die Werte aller KOs, die Plugins benutzen, stehen in `<tags>` der Visu und kommen mit den
Startwerten (`2|ko|wert|x`) – ein Plugin braucht keine eigene Anmeldung am Datenstrom.

| Klasse | Plugin | Stand im Client |
|---|---|---|
| 1-2 | Wertanzeige („Wetterstation“): `<station_item caption>` mit `<value title dpt=KO format unit>` | umgesetzt (v0.6.0) |
| 1-25 | Sonos / Universal-Player: `<item>` mit `co…`-KOs | umgesetzt (v0.6.1), siehe unten |
| 0-2 | Kamera: Bild-URLs **mit Zugangsdaten im Klartext** | offen – Datei wird vom Client nicht abgerufen |
| 0-3 | Diagramm: `<scale_1/2 prec min max unit>`, `<line color title calc tag axis>` mit `archiv_hour…year id` | umgesetzt (v0.7.0), am echten HS bestätigt |
| 1-4, 1-16 | Energieverbrauch, Balkendiagramme (Archive) | offen |
| 0-7 | Kamera-Archiv: `<camarchiv title archid>` | umgesetzt (v0.6.2), am echten HS bestätigt |
| 0-4 | Meldungsarchiv: `<archive reload="s"><msgarchiv title archid>` | umgesetzt (v0.6.3) |
| 1-3 | Wetter (Gira-Dienst) | offen |

### Sonos (1-25) – Sendewerte

Ermittelt aus dem Original-Plugin (`1-25_client.dll`, Klasse `Player`), nicht geraten:

| Bedienung | Senden |
|---|---|
| Abspielen/Pause (ein Knopf) | spielt (`coIsPlaying` > 0) → `coPause` = 1, sonst `coPlay` = 1; Gruppen-Mitglied (`coSlaveModeRM` > 0) → `coStop` = 1 |
| Stopp / Weiter / Lauter | `coStop` / `coNext` / `coVolumeUp` = 1 |
| Zurück | `coPrevious` = 0, wenn gleiches KO wie `coNext`, sonst 1 |
| Leiser | `coVolumeDown` = 0, wenn gleiches KO wie `coVolumeUp`, sonst 1 |
| Stumm, Zufall, Wiederholen, Gruppe, Ein/Aus | umschalten: 1 bzw. 0 nach `…RM` |
| Lautstärke direkt | `coVolume` = 0–100 |

Rückmeldungen gelten als „an“ bei Wert > 0. `coCan…` = 0 sperrt den jeweiligen Knopf.

## Archive (Diagramme, Meldungen, Kamera-Archiv)

Plugins fragen Archive nicht selbst ab, sondern über das QuadClient-Programm. Das holt sie
per HTTPS mit der Sitzungs-ID, ganz ohne WebSocket (ermittelt aus dem Programmaufbau,
Abruf im Client noch nicht umgesetzt):

| Abruf | Antwort (XML) |
|---|---|
| `/quad/arch/<Archiv-ID>/<Start JJMMTTHHmm>/<Blockgröße>/<Blockanzahl>/<Genauigkeit>?<sid>` | `<row count sum min max>` je Block (Zahlen mit Punkt) |
| `/quad/msg/<Archiv-ID>/<Anzahl>?<sid>` | `<msgarch><msg date="JJJJMMTTHHmmss" text>…` – das Original fragt immer 1000 ab |
| `/quad/camarch/list/<Archiv-ID>?<sid>` | `<camarch><pic date="JJJJMMTTHHmmss" id>…` (im Client umgesetzt) |
| `/quad/camarch/pic/<Archiv-ID>/<Bild-ID>?<sid>` | Bild |

Archiv-IDs stehen in den Plugin-Einstellungen (z. B. `archiv_day id=…`, `camarchiv archid=…`).
Blockgröße in Minuten, Genauigkeit = Nachkommastellen der Achse (siehe Diagramm).

### Diagramm (0-3)

Ermittelt aus dem Original-Plugin (`CChartDesignDataBase`) und `0-3_design.xml`:

| Zeitraum | Block (min) | Blöcke | Start |
|---|---|---|---|
| Stunde | 1 | 60 | jetzt − 59 min, auf volle Minute |
| Tag | 10 | 144 | jetzt − 23 h, auf volle Stunde |
| Woche | 45 | 224 | heute − 6 Tage, 00:00 |
| 4 Wochen | 180 | 224 | heute − 27 Tage, 00:00 |
| Jahr | 2160 | 224 | heute − 335 Tage, 00:00 |

Wert je Block nach `calc`: 1 = `min`, 2 = `sum/count`, 3 = `max`; `count` 0 = keine Daten.
Ein Zeitraum ist wählbar, wenn alle Linien dafür ein Archiv haben. Neu geladen wird nach
`<reload><archiv_… span>` Minuten. `tag` liefert den aktuellen Wert für die Legende.
