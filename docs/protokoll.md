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
| 2 | Plugin |

Unterseiten: `<page_item page="n">` + Einträge mit `page="n"`.
