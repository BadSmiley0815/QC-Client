// Browser-Tests für qc.html gegen einen nachgebauten HomeServer (Demo-Visu, keine echte Anlage).
// Aufruf:  node test/run-tests.js      (benötigt: npm i playwright  &&  npx playwright install chromium)
// Die erwarteten Befehle stammen aus Mitschnitten des Original-QuadClients (siehe docs/protokoll.md).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), T = f => fs.readFileSync(path.join(__dirname, f));
const UHR = "2000000001";
let fails = 0, camPics = 0, s, picFetch = [], archFetch = [];
const ok = (name, cond, info = "") => { console.log((cond ? "  ✓ " : "  ✗ ") + name + (cond ? "" : "  → " + info)); if (!cond) fails++; };

async function start(b, user, extra = []) {
  const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await pg.route("https://hs.test/**", r => {
    const u = r.request().url(), n = u.split("/").pop().split("?")[0];
    if (n === "qc.html") return r.fulfill({ status: 200, contentType: "text/html", body: T("../qc.html") });
    if (n === "seite.html") return r.fulfill({ status: 200, contentType: "text/html", body: '<body style="margin:0"><div style="position:absolute;top:300px;height:200px;width:200px">fest positioniert</div></body>' });
    if (u.includes("/quad/camarch/list/71?")) return r.fulfill({ status: 200, contentType: "text/xml", body: '<camarch count="3"><pic date="20261108101500" id="5"/><pic date="20261109183012" id="7"/><pic date="20261109090000" id="6"/></camarch>' });
    if (u.includes("/endpoints/call?key=CP@CAM")) { camPics++; return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }); }
    if (u.includes("/quad/arch/")) { const q = u.split("/quad/arch/")[1].split("?")[0].split("/"); archFetch.push(q);
      const n = +q[3], rows = []; for (let i = 0; i < n; i++) rows.push(i === 5 ? '<row count="0" sum="0" min="0" max="0"/>' : `<row count="2" sum="${40 + i % 10}" min="${i % 7}" max="${50 + i % 20}"/>`);
      return r.fulfill({ status: 200, contentType: "text/xml", body: `<arch>${rows.join("")}</arch>` }); }
    if (u.includes("/quad/msg/81/1000?")) return r.fulfill({ status: 200, contentType: "text/xml", body: '<msgarch count="3"><msg date="20261107080000" text="Pumpe Störung"/><msg date="20261109120500" text="Fenster Bad offen &amp; Regen"/><msg date="20261108200000" text="Pumpe wieder OK"/></msgarch>' });
    if (u.includes("/quad/camarch/list/72?")) return r.fulfill({ status: 200, contentType: "text/xml", body: '<camarch count="0"></camarch>' });
    if (u.includes("/quad/camarch/pic/")) { picFetch.push(u.split("/quad/camarch/pic/")[1].split("?")[0]); return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }); }
    const f = { "client_project.xml": "demo_project.xml", "client_templates.xml": "demo_templates.xml", "client_language.xml": "demo_language.xml",
      "quad_plugin.xml": "demo_plugin.xml", "1-2_900.xml": "demo_1-2_900.xml", "1-25_902.xml": "demo_1-25_902.xml", "0-7_903.xml": "demo_0-7_903.xml", "0-4_904.xml": "demo_0-4_904.xml", "0-3_905.xml": "demo_0-3_905.xml", "1-16_906.xml": "demo_1-16_906.xml", "0-2_901.xml": "demo_0-2_901.xml" }[n];
    if (n === "client_design.xml") return r.fulfill({ status: 200, contentType: "text/xml", body: T("demo_design.xml") });
    if (n === "client_icons.xaml.zip") return r.fulfill({ status: u.includes("/quad/client/design_0/") ? 200 : 404, contentType: "application/zip", body: T("demo_icons.xaml.zip") });
    if (n === "1-2_900.xml" && !u.includes("/quad/plugins/project/")) return r.fulfill({ status: 404, body: "" });
    if (n === "client_templates.xml" && !u.includes("/design_4/")) return r.fulfill({ status: 403, body: "" });
    let body = f ? T(f).toString() : ""; if (n === "client_project.xml") body = body.replace("https://example.org/", "https://hs.test/seite.html");
    r.fulfill({ status: f ? 200 : 404, body, headers: { "access-control-allow-origin": "*" } });
  });
  await pg.addInitScript(([uhr, extra]) => {
    window.SENT = [];
    window.WebSocket = class {
      constructor() { this.readyState = 1; const me = this; window.WSI = me; window.WSN = (window.WSN || 0) + 1;
        setTimeout(() => { me.onmessage({ data: "93|SID|PROJ" });
          [...extra, `10|${uhr}|0|0|0`].forEach(l => me.onmessage({ data: l })); me.onmessage({ data: "95||" }); }, 20); }
      send(s) { SENT.push(s); const p = s.split("|"), me = this;      // HS bestätigt wie das Original
        if (p[0] === "1") setTimeout(() => me.onmessage({ data: `1|${p[1]}|${p[2]}|0` }), 20);
        if (p[0] === "13" && p[2] === "2") setTimeout(() => me.onmessage({ data: `13|2|${p[1]}|1|${p[4]}` }), 20);
        if (p[0] === "12") setTimeout(() => me.onmessage({ data: `12|${p[1]}|${p[2]}|1|1` }), 20); }
      close() {} };
  }, [UHR, extra]);
  await pg.goto("https://hs.test/opt/hs-client/qc.html");
  await pg.fill("#lhost", "hs.test"); await pg.fill("#luser", user); await pg.fill("#lpass", "x"); await pg.click("button[type=submit]");
  await pg.waitForTimeout(800);
  return pg;
}
const sent = async pg => { await pg.waitForTimeout(150); return pg.evaluate(() => { const s = SENT.filter(x => !x.startsWith("80|") && !x.startsWith("94|")); SENT = []; return s; }); };
const ko = (pg, name, slot) => pg.evaluate(([n, s]) => Object.values(P_.els).find(e => e.name === n).kos[s], [name, slot]);
const card = (pg, n) => pg.locator(".card", { hasText: n }).first();

(async () => {
  const b = await chromium.launch();
  // Startwerte: PIN 1234, Sollwert 20, Müll fällig
  const demo = await b.newPage(); await demo.close();
  let pg = await start(b, "Demo");
  const pin = await ko(pg, "Gartentor", "slot_pin"), val = await ko(pg, "Sollwert Pool", "slot_value"), mu = await ko(pg, "Restmüll", "muell_val");
  await pg.close();
  pg = await start(b, "Demo", [`2|${pin}|1234|1`, `2|${val}|20.0|0`, `2|${mu}|1.0|0`, "2|9001|8450.0|0", "2|9002|47503.779|0", "2|9003|6554.0|0",
    "2|9113|0.0|0", "2|9201|21.48|0", "2|9301|123.44|0", "2|9116|Testband|0", "2|9117|Testlied|0", "2|9118|1.0|0", "2|9115|25.0|0", "2|9112|1.0|0"]);

  console.log("Symbole aus der QC-Visu");
  ok("XAML-Symbol im Menü (ZIP64 wie vom HS)", await pg.locator('#grid .mcard:has-text("Wohnen") svg.qci').count() === 1);
  ok("helle Grautöne folgen dem Farbschema, Farben bleiben", await pg.evaluate(() => { const h = document.querySelector("#grid svg.qci").innerHTML; return h.includes('fill="currentColor"') && h.includes("#DC3C3C"); }));
  ok("ohne passendes Symbol: eigenes Ersatzsymbol", await pg.locator('#grid .mcard:has-text("Küche") svg.qci').count() === 0 && await pg.locator('#grid .mcard:has-text("Küche") .ic svg').count() === 1);
  console.log("Menü");
  ok("Startseite ist das Menü", (await pg.textContent("#title")) === "Menü");
  ok("Eintrag nur für Gruppe 1 sichtbar (Garten)", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 1);
  await pg.click('#grid .mcard:has-text("Erdgeschoss")'); ok("Etage zeigt Räume", await pg.locator("#grid .mcard").count() === 4);
  await pg.click('nav button[data-v="m:0"]'); await pg.click('#grid .mcard:has-text("Wetter")'); await pg.waitForTimeout(600);
  ok("Webseite eingebettet, Höhe an Inhalt (fest positioniert)", parseInt(await pg.evaluate(() => getComputedStyle(fifr).height)) >= 500 && parseInt(await pg.evaluate(() => getComputedStyle(fifr).height)) < 560);
  ok("Adresse nicht angezeigt", !(await pg.textContent("#frame .fbar")).includes("http"));
  console.log("Plugin Wertanzeige (1-2)");

  await pg.click('#grid .mcard:has-text("Zähler")'); await pg.waitForTimeout(300);
  ok("Wertanzeige öffnet, Webseite zu", await pg.isVisible("#plug") && !(await pg.isVisible("#frame")));
  ok("Werte formatiert", (await pg.textContent("#pbody")).includes("8.450kWh") && (await pg.textContent("#pbody")).includes("47.503,78kWh"), await pg.textContent("#pbody"));
  await pg.evaluate(() => WSI.onmessage({ data: "1|9003|6600.0|0" })); await pg.waitForTimeout(50);
  ok("Wert aktualisiert sich live", (await pg.textContent("#pbody")).includes("6.600kWh"));
  await pg.click("#pclose"); ok("Schließen", !(await pg.isVisible("#plug")));
  console.log("Plugin Kamera (0-2)");
  await pg.route("http://10.9.9.9/**", r => r.abort());
  await pg.click('#grid .mcard:has-text("Kamera")'); await pg.waitForTimeout(600);
  ok("Bild über den HS wird geladen", camPics >= 1 && await pg.locator('#pbody img[data-cam="0"]').count() === 1, String(camPics));
  ok("nicht erreichbare Kamera: Hinweis statt kaputtem Bild", (await pg.textContent("#pbody")).includes("Garten") && (await pg.locator("#pbody .cerr").count()) === 1, await pg.textContent("#pbody"));
  const html = await pg.content(), logTxt = await pg.textContent("#log");
  ok("Kamera-Passwort nirgends auf der Seite", !html.includes("GeheimesKameraPasswort") && !logTxt.includes("GeheimesKameraPasswort"));
  ok("Kamera-Adressen nicht im Log", !logTxt.includes("endpoints/call") && !logTxt.includes("10.9.9.9"));
  await pg.click('#pbody [data-pa="sel"][data-i="0"]'); await pg.waitForTimeout(200);
  { const c0 = camPics; await pg.waitForTimeout(1200); const n = camPics - c0;
    ok("Endpunkt-Kamera in der Einzelansicht fast live (3–8 Bilder in 1,2 s)", n >= 3 && n <= 8, String(n));
    ok("Anzeige Bilder/s", /Bilder\/s/.test(await pg.textContent("#pbody .camfps")));
    ok("kein Knopf „einmal anmelden“ mehr", !(await pg.textContent("#pbody")).includes("einmal öffnen")); }
  await pg.click('#pbody [data-pa="cmd"]'); s = await sent(pg); ok("Licht-Knopf (toggle) sendet 1", s[0] === "1|9401|1", JSON.stringify(s));
  await pg.click('#pbody [data-pa="cmd"]'); s = await sent(pg); ok("nochmal → 0", s[0] === "1|9401|0", JSON.stringify(s));
  await pg.click("#pclose");
  console.log("Plugin Sonos (1-25, Sendewerte aus dem Original-Plugin)");
  await pg.click('#grid .mcard:has-text("Musik")'); await pg.waitForTimeout(300);
  ok("Titel und Interpret", (await pg.textContent("#pbody")).includes("Testlied") && (await pg.textContent("#pbody")).includes("Testband"));
  ok("Weiter gesperrt (CanNext = 0)", await pg.isDisabled('#pbody [data-pa="next"]'));
  const sonos = [["play", "1|9101|1"], ["prev", "1|9104|0"], ["vup", "1|9105|1"], ["vdn", "1|9105|0"], ["stop", "1|9103|1"], ["mute", "1|9106|1"]];
  for (const [a, exp] of sonos) { await pg.click(`#pbody [data-pa="${a}"]`); s = await sent(pg); ok(a + " sendet " + exp, s[0] === exp, JSON.stringify(s)); }
  await pg.evaluate(() => WSI.onmessage({ data: "1|9110|1.0|0" })); await pg.waitForTimeout(50);
  await pg.click('#pbody [data-pa="play"]'); s = await sent(pg); ok("spielt → Knopf sendet Pause", s[0] === "1|9102|1", JSON.stringify(s));
  await pg.click("#pclose");
  console.log("Plugin Kamera-Archiv (0-7)");
  await pg.click('#grid .mcard:has-text("Klingelbilder")'); await pg.waitForTimeout(400);
  ok("neuestes Bild zuerst", picFetch.at(-1) === "71/7", JSON.stringify(picFetch));
  ok("Zeitstempel lesbar", (await pg.textContent('#pbody select option:checked')).includes("09.11.2026") && (await pg.textContent('#pbody select option:checked')).includes("18:30:12"));
  await pg.click('#pbody [data-pa="older"]'); await pg.waitForTimeout(200); ok("älter → Bild 6", picFetch.at(-1) === "71/6", JSON.stringify(picFetch));
  ok("Bild 2 von 3", (await pg.textContent("#pbody")).includes("Bild 2 von 3"));
  await pg.selectOption('#pbody select[data-pa="pick"]', "2"); await pg.waitForTimeout(200); ok("Auswahl → ältestes Bild 5", picFetch.at(-1) === "71/5");
  await pg.click('#pbody [data-pa="cam"][data-i="1"]'); await pg.waitForTimeout(300);
  ok("zweite Kamera: leeres Archiv", (await pg.textContent("#pbody")).includes("Keine Bilder"));
  await pg.click("#pclose");
  console.log("Plugin Meldungsarchiv (0-4)");
  await pg.click('#grid .mcard:has-text("Meldungen")'); await pg.waitForTimeout(400);
  const rows = await pg.locator("#pbody .mrow span").allTextContents();
  ok("neueste zuerst, Sonderzeichen korrekt", rows[0] === "Fenster Bad offen & Regen" && rows.length === 3, JSON.stringify(rows));
  ok("Datum lesbar", (await pg.textContent("#pbody .mrow time")).includes("09.11.2026, 12:05:00"));
  await pg.fill('#pbody input[data-pa="q"]', "pumpe"); await pg.waitForTimeout(100);
  ok("Suche filtert", (await pg.locator("#pbody .mrow").count()) === 2 && (await pg.textContent("#pbody")).includes("2 von 3"));
  ok("Suchfeld behält Fokus", await pg.evaluate(() => document.activeElement.matches('#pbody input[data-pa="q"]')));
  await pg.click("#pclose");
  console.log("Plugin Diagramm (0-3, Regeln aus dem Original-Plugin)");
  archFetch.length = 0;
  await pg.click('#grid .mcard:has-text("Klima")'); await pg.waitForTimeout(500);
  const exp = await pg.evaluate(() => { const d = new Date(); d.setHours(d.getHours() - 23, 0, 0, 0); return yymm(d); });
  ok("Tag: Abruf wie Original", JSON.stringify(archFetch.map(a => a.join("/")).sort()) === JSON.stringify([`502/${exp}/10/144/1`, `602/${exp}/10/144/0`]), JSON.stringify(archFetch));
  ok("zwei Achsen = zwei Diagramme", (await pg.locator("#pbody svg[data-chart]").count()) === 2);
  const v = await pg.evaluate(() => PLUG.data.vals);
  ok("Mittelwert (calc 2) = sum/count", v[0][0] === 20 && v[0][1] === 20.5, JSON.stringify(v[0].slice(0, 3)));
  ok("Maximum (calc 3)", v[1][0] === 50 && v[1][2] === 52);
  ok("Block ohne Werte = Lücke", v[0][5] === null && v[1][5] === null);
  ok("aktueller Wert in der Legende", (await pg.textContent("#pbody .clegend")).includes("21,5 °C"), await pg.textContent("#pbody .clegend"));
  const box = await pg.locator('#pbody svg[data-chart="0"]').boundingBox();
  await pg.mouse.move(box.x + 44 + 2, box.y + 60); await pg.waitForTimeout(50);
  ok("Fadenkreuz zeigt Werte", (await pg.textContent("#pbody .ctip")).includes("Temperatur: 20,0 °C"), await pg.textContent("#pbody .ctip"));
  archFetch.length = 0; await pg.click('#pbody [data-pa="rg"][data-k="week"]'); await pg.waitForTimeout(400);
  const expW = await pg.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return yymm(d); });
  ok("Woche: 45 min × 224 ab 00:00", archFetch.some(a => a.join("/") === `503/${expW}/45/224/1`), JSON.stringify(archFetch));
  await pg.click("#pclose");
  console.log("Plugin Balkendiagramme (1-16, Regeln aus dem Original)");
  await pg.click('#grid .mcard:has-text("Verbrauch")'); await pg.waitForTimeout(300);
  ok("Übersicht mit aktuellem Wert", (await pg.textContent("#pbody")).includes("123,4l"), await pg.textContent("#pbody"));
  archFetch.length = 0; await pg.click('#pbody [data-pa="open"][data-i="0"]'); await pg.waitForTimeout(400);
  const e7 = await pg.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 6); d.setHours(0, 0, 0, 0); return yymm(d); });
  ok("7 Tage: 1440 × 7, Genauigkeit 2", archFetch.length === 1 && archFetch[0].join("/") === `701/${e7}/1440/7/2`, JSON.stringify(archFetch));
  ok("„Maximum“ = max", JSON.stringify((await pg.evaluate(() => PLUG.data.vals))[0].slice(0, 3)) === "[50,51,52]");
  ok("28 Tage ausgeblendet (use_chart_28d=False)", (await pg.locator('#pbody [data-pa="rg"][data-k="28d"]').count()) === 0);
  ok("Statistik", (await pg.textContent("#pbody")).includes("Minimum") && (await pg.textContent("#pbody")).includes("Summe"));
  archFetch.length = 0; await pg.click('#pbody [data-pa="rg"][data-k="24h"]'); await pg.waitForTimeout(400);
  const e24 = await pg.evaluate(() => { const d = new Date(); d.setMinutes(0, 0, 0); d.setDate(d.getDate() - 1); return yymm(d); });
  ok("24 h: 60 × 24 ab volle Stunde − 1 Tag", archFetch[0] && archFetch[0].join("/") === `701/${e24}/60/24/2`, JSON.stringify(archFetch));
  archFetch.length = 0; await pg.click('#pbody [data-pa="rg"][data-k="52w"]'); await pg.waitForTimeout(400);
  const w = await pg.evaluate(() => { const n = 51 * 7 + (new Date().getDay() + 6) % 7, d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (n - 1)); return [n, yymm(d)]; });
  ok("52 Wochen: Tageswerte, Anzahl wie Original", archFetch[0] && archFetch[0].join("/") === `701/${w[1]}/1440/${w[0]}/2`, JSON.stringify(archFetch));
  const wv = await pg.evaluate(() => PLUG.data.vals[0]);
  ok("51 volle Wochen, Wochensumme", wv.length === 51 && wv[0] === [0, 1, 2, 3, 4, 5, 6].reduce((a, i) => a + (i === 5 ? 0 : 50 + i % 20), 0), JSON.stringify(wv.slice(0, 2)));
  await pg.click('#pbody [data-pa="back"]'); await pg.waitForTimeout(100);
  archFetch.length = 0; await pg.click('#pbody [data-pa="open"][data-i="1"]'); await pg.waitForTimeout(400);
  const dv = await pg.evaluate(() => PLUG.data.vals);
  ok("Zwei Reihen: AVERAGE = sum/count, MIN = min, Block ohne Werte = 0", dv.length === 2 && dv[0][0] === 20 && dv[1][1] === 1 && dv[0][5] === 0, JSON.stringify(dv.map(v => v.slice(0, 6))));
  await pg.click("#pclose");

  console.log("Taster (1-118, Mitschnitt flows3/flows4)");
  await pg.click('nav button:has-text("Flur")'); await pg.waitForTimeout(200);
  for (const [n, exp] of [["Taster Flanke 1", ["1"]], ["Taster Flanke 0", ["0"]], ["Taster Impuls 1", ["1", "0"]], ["Taster Impuls 0", ["0", "1"]]]) {
    const k = await ko(pg, n, "slot_switch"); await card(pg, n).locator("[data-press]").hover();
    await pg.mouse.down(); await pg.waitForTimeout(200); await pg.mouse.up();
    const s = await sent(pg); ok(n + " sendet " + exp.join(", "), JSON.stringify(s) === JSON.stringify(exp.map(v => `1|${k}|${v}`)), JSON.stringify(s));
  }
  console.log("PIN (1-106)");
  const sw = await ko(pg, "Gartentor", "switch");
  await card(pg, "Gartentor").locator(".tog").click(); await pg.fill("#dinput", "0000"); await pg.click("#dok"); await pg.waitForTimeout(100);
  ok("falsche PIN abgelehnt", (await pg.textContent("#derr")) === "PIN falsch");
  await pg.fill("#dinput", "1234"); await pg.click("#dok"); s = await sent(pg); ok("richtige PIN schaltet", s[0] === `1|${sw}|1`, JSON.stringify(s));
  console.log("Müll (0-7)");
  await pg.click('nav button:has-text("Garten")'); await pg.waitForTimeout(200);
  await card(pg, "Restmüll").locator('[data-act="waste"]').click(); s = await sent(pg); ok("Erledigt sendet 0", s[0] === `1|${mu}|0`, JSON.stringify(s));
  console.log("Wert (1-125)");
  await card(pg, "Sollwert Pool").locator('[data-act="vplus"]').click(); s = await sent(pg); ok("Plus sendet absoluten Wert 20.5", s[0] === `1|${val}|20.5`, JSON.stringify(s));
  await card(pg, "Sollwert Pool").locator('[data-act="vedit"]').click(); await pg.fill("#dinput", "50"); await pg.click("#dok"); await pg.waitForTimeout(100);
  ok("Eingabe über Max abgelehnt", (await pg.textContent("#derr")).includes("35"));
  await pg.fill("#dinput", "30"); await pg.click("#dok"); s = await sent(pg); ok("Eingabe 30 gesendet", s[0] === `1|${val}|30`, JSON.stringify(s));
  console.log("Szene (1-109)");
  await pg.click('nav button:has-text("Wohnen")'); await pg.waitForTimeout(200);
  const sk = await ko(pg, "Lichtszenen", "slot_scene"), sb = card(pg, "Lichtszenen").locator("[data-press]").first();
  await sb.hover(); await pg.mouse.down(); await pg.mouse.up(); s = await sent(pg); ok("kurz = Szene 5", s[0] === `1|${sk}|5`, JSON.stringify(s));
  await sb.hover(); await pg.mouse.down(); await pg.waitForTimeout(1200); await pg.mouse.up(); await pg.click("#dok"); s = await sent(pg);
  ok("halten + OK = 133 (lernen)", s[0] === `1|${sk}|133`, JSON.stringify(s));
  console.log("Schaltuhr (Mitschnitt flows5–8)");
  await pg.click('nav button:has-text("Flur")'); await pg.waitForTimeout(200);
  await card(pg, "Taster Flanke 0").hover(); await card(pg, "Taster Flanke 0").locator(".tbtn").click(); await pg.waitForTimeout(500);
  await pg.click("#tactive"); s = await sent(pg); ok("Uhr ein = 12|uhr|1", s[0] === `12|${UHR}|1`, JSON.stringify(s));
  await pg.click('#tbody [data-t="new"]'); await pg.fill("#ttime", "07:15"); await pg.click('#tbody [data-t="save"]'); s = await sent(pg);
  ok("neuer Punkt 07:15 Mo–Fr Ein = wie Original", s[0] === `13|${UHR}|2|0|11111100000000107150000001`, JSON.stringify(s));
  const conv = await pg.evaluate(() => [
    tpBuild("111111110000001060000000001", { days: "1111111", astro: false, mode: 1, t1: "0601", t2: "0000", filter: 0, action: 1 }),
    tpBuild(null, { days: "1111111", astro: true, mode: 1, t1: "0010", t2: "0000", filter: 0, action: 1 }),
    tpBuild(null, { days: "1111111", astro: true, mode: 0, t1: "0020", t2: "0000", filter: 0, action: 2 }),
    tpBuild(null, { days: "1111111", astro: false, mode: 2, t1: "0015", t2: "0500", filter: 0, action: 2 }),
    tpBuild("11010100000001300300000102", { days: "1010100", astro: true, mode: 3, t1: "0030", t2: "0000", filter: 3, action: 2 })]);
  ok("alter Punkt wird umgeschrieben wie Original", conv[0] === "11111111000000106010000001", conv[0]);
  ok("SA + 00:10", conv[1] === "11111111000001100100000001", conv[1]);
  ok("SA − 00:20", conv[2] === "11111111000001000200000002", conv[2]);
  ok("Zufall 00:15 / 05:00", conv[3] === "11111111000000200150500002", conv[3]);
  ok("SU + 00:30, Mo Mi Fr, Nur Urlaubstage", conv[4] === "11010100000001300300000302", conv[4]);
  console.log("Verbindung");
  await pg.evaluate(() => { tdlg.close(); WSI.onclose({ code: 1006 }); }); await pg.waitForTimeout(100);
  ok("Hinweis mit Countdown und Knopf", (await pg.textContent("#btxt")).includes("neuer Versuch in") && await pg.isVisible("#bnow"));
  const n0 = await pg.evaluate(() => WSN); await pg.click("#bnow"); await pg.waitForTimeout(300);
  ok("„Jetzt verbinden“ verbindet sofort", (await pg.evaluate(() => WSN)) === n0 + 1);
  ok("nach Verbindung kein Hinweis", !(await pg.isVisible("#banner")));
  await pg.close();
  console.log("Ansicht Klassisch (Vorlagen-Übersetzer)");
  pg = await start(b, "Demo", ["2|111|1.0|0", "2|116|42.0|0"]);
  await pg.selectOption("#uisel", "classic"); await pg.waitForTimeout(700);
  ok("klassische Ansicht sichtbar, moderne versteckt", await pg.isVisible("#classic") && !(await pg.isVisible("#app main")));
  ok("Menü mit 3 Spalten", (await pg.locator("#cl-left .cl-mt").count()) > 5 && (await pg.textContent("#cl-title")) === "Menü");
  await pg.click('#cl-left .cl-mt:has-text("Wohnen")'); await pg.waitForTimeout(300);
  const rowTxt = n => pg.locator(`#cl-left .cl-row:has(.cl-name:text-is("${n}"))`);
  ok("Raumzeile aus der Vorlage: Texte, logic, group", (await rowTxt("Deckenlicht").textContent()).replace(/\s+/g, "").includes("EINAUSANeinzeln"), await rowTxt("Deckenlicht").textContent());
  ok("Wertanzeige aus value_slot mit Einheit", (await rowTxt("Leselampe").textContent()).includes("42%"), await rowTxt("Leselampe").textContent());
  await sent(pg);
  await rowTxt("Deckenlicht").locator('.cl-p[data-pos="1"] .cl-z[data-z="3"]').click(); s = await sent(pg);
  ok("Klick rechts = AUS (action_up click 3)", s[0] === "1|110|0", JSON.stringify(s));
  const zb = await rowTxt("Leselampe").locator('.cl-p[data-pos="1"] .cl-z[data-z="2"]').boundingBox();
  await pg.mouse.move(zb.x + 5, zb.y + 5); await pg.mouse.down(); await pg.waitForTimeout(80); await pg.mouse.up(); s = await sent(pg);
  ok("kurz (≤ 500 ms) = Aus", JSON.stringify(s) === JSON.stringify(["1|115|0"]), JSON.stringify(s));
  await pg.mouse.down(); await pg.waitForTimeout(700); await pg.mouse.up(); s = await sent(pg);
  ok("halten (> 500 ms) = dimmen, loslassen = stopp", JSON.stringify(s) === JSON.stringify(["1|117|1", "1|117|0"]), JSON.stringify(s));
  await rowTxt("Leselampe").locator('.cl-p[data-pos="2"] .cl-z').click(); await pg.waitForTimeout(200);
  ok("Popup der Vorlage -> Einstellungsfenster", await pg.isVisible("#clcard") && (await pg.textContent("#clcardg")).includes("Leselampe"));
  await pg.click("#clcardx"); await pg.click('#cl-nav [data-sys]'); await pg.click('#cl-sys [data-sysa="modern"]'); await pg.waitForTimeout(200);
  ok("zurück auf Modern", !(await pg.isVisible("#classic")) && await pg.isVisible("#app main"));
  await pg.close();
  console.log("Rechte");
  pg = await start(b, "Gast");
  ok("Gast sieht Gruppe-1-Einträge nicht", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 0);
  ok("Unterseite Extras sichtbar", await pg.locator("#grid .mcard", { hasText: "Extras" }).count() === 1);
  await pg.close(); await b.close();
  console.log(fails ? `\n${fails} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
  process.exit(fails ? 1 : 0);
})();
