// Browser-Tests für qc.html gegen einen nachgebauten HomeServer (Demo-Visu, keine echte Anlage).
// Aufruf:  node test/run-tests.js      (benötigt: npm i playwright  &&  npx playwright install chromium)
// Die erwarteten Befehle stammen aus Mitschnitten des Original-QuadClients (siehe docs/protokoll.md).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), T = f => fs.readFileSync(path.join(__dirname, f));
const UHR = "2000000001";
let addinMode = "ok", addinGets = [];
let fails = 0, camPics = 0, proxyPics = [], publicHits = 0, s, picFetch = [], archFetch = [];
const ok = (name, cond, info = "") => { console.log((cond ? "  ✓ " : "  ✗ ") + name + (cond ? "" : "  → " + info)); if (!cond) fails++; };

async function start(b, user, extra = []) {
  const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await pg.route("https://hs.test/**", r => {
    const u = r.request().url(), n = u.split("/").pop().split("?")[0];
    if (n === "qc.html") return r.fulfill({ status: 200, contentType: "text/html", body: T("../qc.html") });
    if (n === "seite.html") return r.fulfill({ status: 200, contentType: "text/html", body: '<body style="margin:0"><div style="position:absolute;top:300px;height:200px;width:200px">fest positioniert</div></body>' });
    if (u.includes("/quad/camarch/list/71?")) return r.fulfill({ status: 200, contentType: "text/xml", body: '<camarch count="3"><pic date="20261108101500" id="5"/><pic date="20261109183012" id="7"/><pic date="20261109090000" id="6"/></camarch>' });
    if (u.includes("/kamera/list?")) return r.fulfill({ status: u.includes("k=K1") ? 200 : 401, contentType: "application/json", body: '{"version":"0.3","cams":["garten","hof"]}' });
    if (u.includes("/kamera/garten.mjpg")) { proxyPics.push(u.split("/kamera/")[1]); return r.fulfill({ status: 200, contentType: "multipart/x-mixed-replace; boundary=myboundary", body: Buffer.from("LS1teWJvdW5kYXJ5DQpDb250ZW50LVR5cGU6IGltYWdlL2pwZWcNCkNvbnRlbnQtTGVuZ3RoOiA2MzMNCg0K/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzuiiivBP1k//ZDQotLW15Ym91bmRhcnkNCkNvbnRlbnQtVHlwZTogaW1hZ2UvanBlZw0KDQr/2P/gABBKRklGAAEBAAABAAEAAP/bAEMACAYGBwYFCAcHBwkJCAoMFA0MCwsMGRITDxQdGh8eHRocHCAkLicgIiwjHBwoNyksMDE0NDQfJzk9ODI8LjM0Mv/bAEMBCQkJDAsMGA0NGDIhHCEyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMv/AABEIAAgACAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/AKlFFFfCH5of/9kNCi0tbXlib3VuZGFyeQ0KQ29udGVudC1UeXBlOiBpbWFnZS9qcGVnDQpDb250ZW50LUxlbmd0aDogNjMzDQoNCv/Y/+AAEEpGSUYAAQEAAAEAAQAA/9sAQwAIBgYHBgUIBwcHCQkICgwUDQwLCwwZEhMPFB0aHx4dGhwcICQuJyAiLCMcHCg3KSwwMTQ0NB8nOT04MjwuMzQy/9sAQwEJCQkMCwwYDQ0YMiEcITIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy/8AAEQgACAAIAwEiAAIRAQMRAf/EAB8AAAEFAQEBAQEBAAAAAAAAAAABAgMEBQYHCAkKC//EALUQAAIBAwMCBAMFBQQEAAABfQECAwAEEQUSITFBBhNRYQcicRQygZGhCCNCscEVUtHwJDNicoIJChYXGBkaJSYnKCkqNDU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6g4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2drh4uPk5ebn6Onq8fLz9PX29/j5+v/EAB8BAAMBAQEBAQEBAQEAAAAAAAABAgMEBQYHCAkKC//EALURAAIBAgQEAwQHBQQEAAECdwABAgMRBAUhMQYSQVEHYXETIjKBCBRCkaGxwQkjM1LwFWJy0QoWJDThJfEXGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoKDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uLj5OXm5+jp6vLz9PX29/j5+v/aAAwDAQACEQMRAD8A8Wooor9ZOE//2Q0K", "base64") }); }
    if (u.includes("/kamera/garten.")) { proxyPics.push(u.split("/kamera/")[1]); return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }); }
    if (u.includes("/endpoints/call?key=CP@CAM")) { camPics++; return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }); }
    if (u.includes("/quad/arch/")) { const q = u.split("/quad/arch/")[1].split("?")[0].split("/"); archFetch.push(q);
      const n = +q[3], rows = []; for (let i = 0; i < n; i++) rows.push(i === 5 ? '<row count="0" sum="0" min="0" max="0"/>' : `<row count="2" sum="${40 + i % 10}" min="${i % 7}" max="${50 + i % 20}"/>`);
      return r.fulfill({ status: 200, contentType: "text/xml", body: `<arch>${rows.join("")}</arch>` }); }
    if (u.includes("/quad/msg/81/1000?")) return r.fulfill({ status: 200, contentType: "text/xml", body: Buffer.from('<msgarch count="3"><msg date="20261107080000" text="Pumpe Störung"/><msg date="20261109120500" text="Fenster Bad offen &amp; Regen"/><msg date="20261108200000" text="Pumpe wieder OK"/></msgarch>', "latin1") });
    if (u.includes("/quad/camarch/list/72?")) return r.fulfill({ status: 200, contentType: "text/xml", body: '<camarch count="0"></camarch>' });
    if (u.includes("/quad/camarch/pic/")) { picFetch.push(u.split("/quad/camarch/pic/")[1].split("?")[0]); return r.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") }); }
    if (u.includes("/opt/hsfsweb/widgets/")) { addinGets.push(u.split("/opt/hsfsweb/widgets/")[1]);
      return r.fulfill({ status: 200, contentType: "text/html", body: addinMode === "stumm" ? "<body>stumm</body>" : T("demo_addin.html") }); }
    if (u.includes("/opt/hsfsweb/icons/demo_icon.svg")) return r.fulfill({ status: 200, contentType: "image/svg+xml", body: '<svg viewBox="0 0 4 4"><path d="M0 0h4"/></svg>', headers: { "access-control-allow-origin": "*" } });
    if (n === "quad_plugin.json") return r.fulfill({ status: 200, contentType: "application/json", body: T("demo_quad_plugin.json") });
    if (n === "demo.addin.wetter_907.json") return addinMode === "ohne" ? r.fulfill({ status: 404, body: "" }) : r.fulfill({ status: 200, contentType: "application/json", body: Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), T("demo_addin_907.json")]) });
    if (u.includes("/quad/load/ADDINS/SETTINGS907.JSON?SID")) return r.fulfill({ status: 200, contentType: "application/json", body: '{"ort":"Demostadt"}' });
    const f = { "client_project.xml": "demo_project.xml", "client_templates.xml": "demo_templates.xml", "client_language.xml": "demo_language.xml",
      "quad_plugin.xml": "demo_plugin.xml", "1-2_900.xml": "demo_1-2_900.xml", "1-25_902.xml": "demo_1-25_902.xml", "0-7_903.xml": "demo_0-7_903.xml", "0-4_904.xml": "demo_0-4_904.xml", "0-3_905.xml": "demo_0-3_905.xml", "1-16_906.xml": "demo_1-16_906.xml", "0-2_901.xml": "demo_0-2_901.xml", "1-3_907.xml": "demo_1-3_907.xml", "1-2_908.xml": "demo_1-2_908.xml", "99-2_909.xml": "demo_99-2_909.xml", "50-1_950.xml": "demo_50-1_950.xml", "1-15_951.xml": "demo_1-15_951.xml", "1-21_952.xml": "demo_1-21_952.xml", "180-1_953.xml": "demo_180-1_953.xml", "99-3_954.xml": "demo_99-3_954.xml" }[n];
    if (n === "client_design.xml") return r.fulfill({ status: 200, contentType: "text/xml", body: T("demo_design.xml") });
    if (u.includes("/quad/public/design_4/public_templates.xml")) return r.fulfill({ status: 200, contentType: "text/xml", body: T("demo_public_templates.xml") });
    if (u.includes("/quad/public/public_language.xml")) return r.fulfill({ status: 200, contentType: "text/xml", body: T("demo_public_language.xml") });
    if (u.includes("/quad/plugins/design_0/icons/1-2_icons.xaml.zip")) return r.fulfill({ status: 200, contentType: "application/zip", body: T("demo_plugin_1-2_icons.xaml.zip") });
    if (u.includes("/quad/public/design_0/public_icons.xaml.zip")) { publicHits++; return r.fulfill({ status: 404, body: "" }); }
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
  ok("Menü-LED in der Farbe aus dem Projekt (Aus = grün)", await pg.evaluate(() => { const c = [...document.querySelectorAll("#grid .mcard")].find(x => x.textContent.includes("Alarm scharf"));
    const l = c && c.querySelector(".mled"); return !!l && /190, 220, 0|BEDC00/i.test(l.style.background); }));
  ok("XAML: Line, Polyline/Polygon, PathFigure mit Segmenten, GeometryGroup werden umgesetzt", await pg.evaluate(() => {
    const X = b => `<Canvas xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation" Width="48" Height="48">${b}</Canvas>`;
    const a = xamlToSvg(X('<Line X1="4" Y1="4" X2="40" Y2="40" Stroke="#FFFFFFFF" StrokeThickness="2"/><Polygon Points="4,40 20,44 30,40" Fill="#FFFFFFFF"/>'));
    const b = xamlToSvg(X('<Path Fill="#FFFFFFFF"><Path.Data><GeometryGroup><EllipseGeometry Center="10,10" RadiusX="6" RadiusY="6"/><PathGeometry><PathFigure StartPoint="20,20"><LineSegment Point="40,20"/><ArcSegment Point="40,40" Size="10,10"/></PathFigure></PathGeometry></GeometryGroup></Path.Data></Path>'));
    return a && /M4 4L40 40/.test(a.b) && /L20 44L30 40Z/.test(a.b) && b && /A6 6/.test(b.b) && /M20 20L40 20A10 10/.test(b.b); }));
  ok("helle Grautöne folgen dem Farbschema, Farben bleiben", await pg.evaluate(() => { const h = document.querySelector("#grid svg.qci").innerHTML; return h.includes('fill="currentColor"') && h.includes("#DC3C3C"); }));
  ok("fehlende Symbole werden auch in importierten Symbolpaketen (public) gesucht", publicHits >= 1, String(publicHits));
  ok("ohne passendes Symbol: eigenes Ersatzsymbol", await pg.locator('#grid .mcard:has-text("Küche") svg.qci').count() === 0 && await pg.locator('#grid .mcard:has-text("Küche") .ic svg').count() === 1);
  console.log("Menü");
  ok("Startseite ist das Menü", (await pg.textContent("#title")) === "Menü");
  ok("Eintrag nur für Gruppe 1 sichtbar (Garten)", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 1);
  await pg.click('#grid .mcard:has-text("Erdgeschoss")'); ok("Etage zeigt Räume", await pg.locator("#grid .mcard").count() === 4);
  await pg.click('nav button[data-v="m:0"]'); await pg.click('#grid .mcard:has-text("Wetter")'); await pg.waitForTimeout(600);
  { const fh = parseInt(await pg.evaluate(() => getComputedStyle(fifr).height)), vh = await pg.evaluate(() => innerHeight);
    ok("Webseite eingebettet, mindestens Bildschirmhöhe (v0.9.5)", fh >= vh - 120 && fh <= vh + 50, fh + " bei Fenster " + vh); }
  ok("Adresse nicht angezeigt", !(await pg.textContent("#frame .fbar")).includes("http"));
  console.log("Plugin Wertanzeige (1-2)");

  await pg.click('#grid .mcard:has-text("Zähler")'); await pg.waitForTimeout(300);
  ok("Wertanzeige öffnet, Webseite zu", await pg.isVisible("#plug") && !(await pg.isVisible("#frame")));
  await pg.waitForTimeout(400); ok("Kachel-Symbol aus dem Symbolpaket des Plugins (/quad/plugins/design_0/icons/1-2_icons.xaml.zip)", await pg.evaluate(() => QCI.has("1-2_strom")));
  ok("Werte formatiert", (await pg.textContent("#pbody")).includes("8.450kWh") && (await pg.textContent("#pbody")).includes("47.503,78kWh"), await pg.textContent("#pbody"));
  { const rowB = () => pg.locator('#pbody .row:has-text("Wechselrichter") b').textContent(), rowT = () => pg.locator('#pbody .row:has-text("Meldung") b').textContent();
    const b0 = await rowB();
    await pg.evaluate(() => { WSI.onmessage({ data: "1|9421|1|0" }); WSI.onmessage({ data: "1|9422|Alles gut|0" }); }); await pg.waitForTimeout(200);
    const b1 = await rowB(), t1 = await rowT();
    await pg.evaluate(() => WSI.onmessage({ data: "1|9421|0.0|0" })); await pg.waitForTimeout(200);
    ok("Wertanzeige Format BOOLEAN: nur der passende Text aus „wahr/unwahr“, ohne Zahl (v0.9.45)", b0 === "–" && b1 === "ONLINE" && await rowB() === "OFFLINE", [b0, b1, await rowB()].join(" | "));
    ok("Wertanzeige Format TEXT: Text des KOs, Einheit bleibt weg (v0.9.45)", t1 === "Alles gut", t1); }
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
  console.log("Kamera-Proxy (Baustein 14783)");
  await pg.click("#cpbtn"); ok("Einstellung vorbelegt mit https://<HS>/kamera/", (await pg.inputValue("#cpurl")) === "https://hs.test/kamera/");
  await pg.fill("#cpkey", "falsch"); await pg.click("#cpok"); await pg.waitForTimeout(300);
  ok("falscher Schlüssel wird gemeldet", (await pg.textContent("#cperr")).includes("Schlüssel falsch") && await pg.isVisible("#cpdlg"));
  await pg.fill("#cpkey", "K1"); await pg.click("#cpok"); await pg.waitForTimeout(300);
  ok("gespeichert, Navigation zeigt „eingerichtet“", !(await pg.isVisible("#cpdlg")) && (await pg.textContent("#cpbtn")).includes("eingerichtet"));
  await pg.click('#grid .mcard:has-text("Kamera")'); await pg.waitForTimeout(600);
  ok("Kamera „Garten“ läuft über den Proxy (kein Hinweis mehr)", proxyPics.some(x => x.startsWith("garten.jpg?k=K1")) && (await pg.locator("#pbody .cerr").count()) === 0, JSON.stringify(proxyPics));
  ok("Kamera ohne Proxy-Namen bleibt am Endpunkt", await pg.evaluate(() => document.querySelector('#pbody img[data-cam="0"]').src.includes("endpoints/call")));
  await pg.click('#pbody [data-pa="sel"][data-i="1"]'); await pg.waitForTimeout(300);
  ok("Einzelansicht: Live-Strom (MJPEG) über den Proxy", proxyPics.some(x => x.startsWith("garten.mjpg?k=K1")) && await pg.evaluate(() => document.querySelector('#pbody img[data-cam="1"]').dataset.live === "1"));
  ok("Live-Strom vom HS liest der Client selbst: 3 Einzelbilder als Blob (mit und ohne Content-Length)", await pg.evaluate(() => { const im = document.querySelector('#pbody img[data-cam="1"]');
    return im.src.startsWith("blob:") && !!im.dataset.mjpg && camM(im).tot === 3; }), await pg.evaluate(() => camM(document.querySelector('#pbody img[data-cam="1"]')).tot));
  ok("Schlüssel nicht im Log", !(await pg.textContent("#log")).includes("K1"));
  await pg.click("#pclose");
  await pg.click("#cpbtn"); await pg.click("#cpdel"); ok("Proxy entfernen", (await pg.textContent("#cpbtn")).includes("aus"));
  console.log("Plugin Wetter (1-3, Open-Meteo + Wertanzeige als Station)");
  { const om = [];
    await pg.route("https://api.open-meteo.com/**", r => { om.push(r.request().url()); const t = new Date(), D = i => { const x = new Date(t); x.setDate(t.getDate() + i); return x.toISOString().slice(0, 10); };
      const days = [0, 1, 2, 3, 4, 5, 6];
      r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({
        current: { temperature_2m: 5.2, relative_humidity_2m: 80, weather_code: 3, wind_speed_10m: 12, wind_direction_10m: 90, precipitation: 0, is_day: 1 },
        daily: { time: days.map(D), weather_code: [2, 3, 61, 71, 95, 45, 0], temperature_2m_max: [8, 8, 9, 4, 6, 7, 10], temperature_2m_min: [-3, -2, 4, 0, 1, 2, 3],
          precipitation_sum: [0, 2, 5, 1, 0, 0, 0], precipitation_probability_max: [0, 66, 100, 40, 10, 5, 0], wind_speed_10m_max: [15, 15, 23, 10, 8, 9, 7], wind_direction_10m_dominant: [90, 180, 250, 0, 45, 300, 200] } }) }); });
    await pg.route("https://geocoding-api.open-meteo.com/**", r => { om.push(r.request().url()); r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ results: [{ name: "Nürnberg", latitude: 49.45421, longitude: 11.07752, admin1: "Bayern", country: "Deutschland", postcodes: ["90402"] }] }) }); });
    await pg.evaluate(() => { WSI.onmessage({ data: "2|9401|3.4|0" }); WSI.onmessage({ data: "2|9402|71|0" }); WSI.onmessage({ data: "2|9403|7.5|0" }); WSI.onmessage({ data: "2|9404|270|0" }); WSI.onmessage({ data: "2|9405|1|0" }); openPlugin("Wetter", "907"); });
    await pg.waitForTimeout(500);
    ok("ohne Ort: Einstellungen mit Ortssuche", await pg.isVisible('#pbody input[data-pa="wxq"]'));
    ok("Vorlage Wetterstation (99-4) im Projekt automatisch als Station gewählt", await pg.evaluate(() => document.querySelector('#pbody select[data-pa="wxst"]').value === "e:1091" && /Temperatur: ✓/.test(document.querySelector("#pbody .wxset").textContent)));
    await pg.selectOption('#pbody select[data-pa="wxst"]', "908"); await pg.waitForTimeout(300);
    ok("Wertanzeige als Station wählbar, Werte an der Bezeichnung erkannt", await pg.evaluate(() => { const t = document.querySelector("#pbody .wxset").textContent;
      return document.querySelector('#pbody select[data-pa="wxst"]').value === "908" && /Temperatur: Temperatur/.test(t) && /Windrichtung: Richtung/.test(t) && /Wind: Geschwindigkeit/.test(t) && /Luftfeuchte: Feuchte/.test(t); }));
    await pg.fill('#pbody input[data-pa="wxq"]', "Nürnberg"); await pg.press('#pbody input[data-pa="wxq"]', "Enter"); await pg.waitForTimeout(300);
    ok("Ortssuche (Enter) zeigt Treffer", (await pg.textContent("#pbody .hits")).includes("90402"));
    await pg.click('#pbody [data-pa="wxpick"]'); await pg.waitForTimeout(500);
    const tx = await pg.textContent("#pbody");
    ok("Vorhersage: 7 Tage ab Heute", await pg.locator("#pbody .wxd").count() === 7 && tx.includes("Heute") && tx.includes("Morgen"), tx.slice(0, 200));
    ok("Jetzt: Werte der Station (3,4°, 71 %, 7,5 km/h W, Regen)", /3,4°/.test(tx) && tx.includes("71 %") && /8 km\/h/.test(tx) && tx.includes(" W") && tx.includes("Regen"), tx.slice(0, 300));
    ok("Abfrage mit Einheiten aus der Plugin-Einstellung, ohne Portal-Kennung", om.some(u => u.includes("wind_speed_unit=kmh") && u.includes("latitude=49.454")) && !om.some(u => u.includes("GEHEIM")));
    await pg.evaluate(() => WSI.onmessage({ data: "1|9401|4.6|0" })); await pg.waitForTimeout(80);
    ok("Stationswert aktualisiert sich live", /4,6°/.test(await pg.textContent("#pbody .wxnow")));
    ok("Ort wird je Gerät gespeichert", await pg.evaluate(() => (store.get("wx.hs.test.907", {}) || {}).name === "Nürnberg"));
    ok("Klassisch: Jetzt + 4 Tage, blättern", await pg.evaluate(() => { const d = HOSTS[0].plug.data, h = PLUGIN_TYPES["1-3"].htmlClassic(d); return (h.match(/class="cl-wxd"/g) || []).length === 4 && h.includes('data-pa="wxpg"') && h.includes("cl-wxn"); }));
    ok("Vorlage Wetterstation (99-4) als Quelle: Werte aus ihren Slots", await pg.evaluate(async () => {
      const d = HOSTS[0].plug.data; d.set = { ...d.set, st: "e:1091" }; d.stv = null; await PLUGIN_TYPES["1-3"].station(d); renderHost(HOSTS[0]);
      const t = document.querySelector("#pbody .wxnow").textContent, src = document.querySelector("#pbody .wxsrc").textContent;
      return d.stId === "e:1091" && /4,6°/.test(t) && t.includes("Regen") && t.includes(" W") && src.includes("Wetterstation"); }));
    await pg.click("#pclose");
  }
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
  ok("Umlaute aus ISO-8859-1 ohne Angabe im Kopf (v0.9.46)", rows[2] === "Pumpe Störung", JSON.stringify(rows));
  ok("Kodierung: UTF-8 bleibt, Angabe im XML-Kopf gilt", await pg.evaluate(() => {
    const u = new TextEncoder().encode('<a t="Tür – Größe"/>'), l = Uint8Array.from('<?xml version="1.0" encoding="ISO-8859-1"?><a t="T\u00fcr"/>', c => c.charCodeAt(0));
    return hsText(u.buffer) === '<a t="Tür – Größe"/>' && hsText(l.buffer).includes('t="Tür"'); }));
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
  pg = await start(b, "Demo", ["2|111|1.0|0", "2|116|42.0|0", "2|190|0.0|0", "2|191|4711|0"]);
  await pg.selectOption("#uisel", "classic"); await pg.waitForTimeout(700);
  ok("klassische Ansicht sichtbar, moderne versteckt", await pg.isVisible("#classic") && !(await pg.isVisible("#app main")));
  ok("Menü mit 3 Spalten", (await pg.locator("#cl-left .cl-mt").count()) > 5 && (await pg.textContent("#cl-title")) === "Menü");
  await pg.click('#cl-left .cl-mt:has-text("Wohnen")'); await pg.waitForTimeout(300);
  const rowTxt = n => pg.locator(`#cl-left .cl-row:has(.cl-name:text-is("${n}"))`);
  ok("Raumzeile aus der Vorlage: Texte, logic, group", (await rowTxt("Deckenlicht").textContent()).replace(/\s+/g, "").includes("EINAUSANeinzeln"), await rowTxt("Deckenlicht").textContent());
  ok("Wertanzeige aus value_slot mit Einheit", (await rowTxt("Leselampe").textContent()).includes("42%"), await rowTxt("Leselampe").textContent());
  await pg.evaluate(() => go("r:14")); await pg.waitForTimeout(300);
  ok("Zeitschaltuhr: Uhr-Symbol nur in der Zeile mit Uhr (v0.9.46)", (await rowTxt("Taster Flanke 0").locator(".cl-uhr").count()) === 1 && (await pg.locator("#cl-left .cl-uhr").count()) === 1);
  await rowTxt("Taster Flanke 0").locator(".cl-uhr").click(); await pg.waitForTimeout(400);
  ok("Uhr-Symbol steht in der dritten Spalte (v0.9.47)", await rowTxt("Taster Flanke 0").locator(".cl-uhr.p3").count() === 1);
  ok("Uhr-Symbol öffnet die Zeitschaltuhr", await pg.evaluate(() => tdlg.open && ttitle.textContent.includes("Taster Flanke 0")));
  await pg.evaluate(u => WSI.onmessage({ data: "12|" + u + "|1" }), UHR); await pg.waitForTimeout(100);
  ok("Uhr aktiv färbt das Symbol", await rowTxt("Taster Flanke 0").locator(".cl-uhr.on").count() === 1);
  await pg.evaluate(u => { WSI.onmessage({ data: "12|" + u + "|0" }); tdlg.close(); }, UHR); await pg.waitForTimeout(100);
  console.log("Vorlagen-Aktionen navigation und plugin (v0.9.47)");
  ok("Projekt-Zwischenspeicher unter neuem Schlüssel, alter entfernt", await pg.evaluate(() => !!store.get("proj5.hs.test", null) && store.get("proj4.hs.test", null) === null && !!Object.values(P_.els).find(e => e.tpl === "90-1").ids.slot_room));
  await rowTxt("Zu den Meldungen").locator('.cl-p[data-pos="1"] .cl-z').click(); await pg.waitForTimeout(500);
  ok("Klassisch: Aktion plugin öffnet das Plugin im Quadranten, kein Einstellungsfenster", await pg.evaluate(() => !clcard.open && [1, 2].some(q => CL.hosts[q].plug && CL.hosts[q].plug.id === "904")));
  await rowTxt("Zum Wohnen").locator('.cl-p[data-pos="2"] .cl-z').click(); await pg.waitForTimeout(400);
  ok("Klassisch: Aktion navigation springt in den Raum, kein Einstellungsfenster", await pg.evaluate(() => cur === "r:12" && !clcard.open) && (await pg.textContent("#cl-title")).includes("Wohnen"), await pg.textContent("#cl-title"));
  await pg.evaluate(() => { clSetUi("modern"); go("r:14"); }); await pg.waitForTimeout(400);
  ok("Modern: Kachel zeigt je Sprungziel einen Knopf mit dem Namen", (await card(pg, "Zum Wohnen").locator('[data-act="cljump"]').allTextContents()).join("|") === "Wohnen" && (await card(pg, "Zu den Meldungen").locator('[data-act="cljump"]').allTextContents()).join("|") === "Meldungen");
  await card(pg, "Zu den Meldungen").locator('[data-act="cljump"]').click(); await pg.waitForTimeout(400);
  ok("Modern: Knopf öffnet das Plugin", await pg.evaluate(() => HOSTS[0].plug && HOSTS[0].plug.id === "904"));
  await pg.click("#pclose"); await card(pg, "Zum Wohnen").locator('[data-act="cljump"]').click(); await pg.waitForTimeout(300);
  ok("Modern: Knopf springt in den Raum", await pg.evaluate(() => cur === "r:12"));
  await pg.evaluate(() => clSetUi("classic")); await pg.waitForTimeout(500);
  await sent(pg);
  await rowTxt("Deckenlicht").locator('.cl-p[data-pos="1"] .cl-z[data-z="3"]').click(); s = await sent(pg);
  ok("Klick rechts = AUS (action_up click 3)", s[0] === "1|110|0", JSON.stringify(s));
  const zb = await rowTxt("Leselampe").locator('.cl-p[data-pos="1"] .cl-z[data-z="2"]').boundingBox();
  await pg.mouse.move(zb.x + 5, zb.y + 5); await pg.mouse.down(); await pg.waitForTimeout(80); await pg.mouse.up(); s = await sent(pg);
  ok("kurz (≤ 500 ms) = Aus", JSON.stringify(s) === JSON.stringify(["1|115|0"]), JSON.stringify(s));
  await pg.mouse.down(); await pg.waitForTimeout(700); await pg.mouse.up(); s = await sent(pg);
  ok("halten (> 500 ms) = dimmen, loslassen = stopp", JSON.stringify(s) === JSON.stringify(["1|117|1", "1|117|0"]), JSON.stringify(s));
  await rowTxt("Leselampe").locator('.cl-p[data-pos="2"] .cl-z').click(); await pg.waitForTimeout(200);
  ok("Popup der Vorlage -> Einstellungsfenster (Popup mit „Ablauf/Szene“-Teilen bzw. fehlend)", await pg.isVisible("#clcard") && (await pg.textContent("#clcardg")).includes("Leselampe"));
  await pg.click("#clcardx");
  await sent(pg); await rowTxt("Rollladen").locator('.cl-p[data-pos="1"] .cl-z[data-z="3"]').click(); s = await sent(pg);
  ok("Pfeiltaste in einer Gruppe (Jalousie ohne Sperre) sendet", JSON.stringify(s) === JSON.stringify(["1|113|1"]), JSON.stringify(s));
  await rowTxt("Heizung").locator('.cl-p[data-pos="2"] .cl-z').click(); await pg.waitForTimeout(250);
  ok("Gira-Vorlage: unterstütztes Popup erscheint im Original-Stil statt Einstellungsfenster", await pg.isVisible("#clpop") && !(await pg.isVisible("#clcard")) && /Soll/.test(await pg.textContent("#clpop")));
  await sent(pg); await pg.locator('#clpop .clp-b:has-text("+")').click(); s = await sent(pg);
  ok("Popup-Taste + (action_repeat) sendet sofort", s.length === 1 && /^1\|\d+\|/.test(s[0]), JSON.stringify(s));
  await pg.locator('#clpop .clp-b:has-text("OK")').click(); await pg.waitForTimeout(150);
  ok("importierte Vorlage aus public: Feld zeigt Text", (await rowTxt("Lamellen").textContent()).replace(/\s+/g, "").includes("LRLinks") && !(await rowTxt("Lamellen").textContent()).includes("XX"), await rowTxt("Lamellen").textContent());
  await rowTxt("Lamellen").locator('.cl-p[data-pos="1"] .cl-z').click(); await pg.waitForTimeout(200);
  ok("PIN-Abfrage vor dem Popup", await pg.isVisible("#dlg") && !(await pg.isVisible("#clpop")));
  await pg.fill("#dinput", "4711"); await pg.press("#dinput", "Enter"); await pg.waitForTimeout(200);
  ok("Popup im Original-Stil mit Überschrift und Knöpfen", await pg.isVisible("#clpop") && /Lamellen/.test(await pg.textContent("#clpop")) && (await pg.locator("#clpop .clp-b").count()) === 4);
  ok("Text im Raster mit Layoutzelle (links/rechts)", await pg.evaluate(() => { const t = [...document.querySelectorAll("#clpop .cl-t")]; const a = t.find(x => x.textContent === "Info"), b = t.find(x => x.textContent === "0");
    return a && b && a.style.left === b.style.left && a.style.textAlign === "left" && b.style.textAlign === "right"; }));
  ok("Knopf des aktuellen Werts markiert", (await pg.locator("#clpop .clp-b.sel").textContent()).includes("Links"));
  await sent(pg); await pg.locator('#clpop .clp-b:has-text("Mitte")').click(); s = await sent(pg);
  ok("Popup-Knopf sendet Wert (action_down set), unverbundener Slot wird übersprungen", JSON.stringify(s) === JSON.stringify(["1|190|2"]) && !(await pg.isVisible("#clcard")), JSON.stringify(s));
  await pg.evaluate(() => window.WSI.onmessage({ data: "1|190|2.0|0" })); await pg.waitForTimeout(150);
  ok("Markierung folgt dem KO", (await pg.locator("#clpop .clp-b.sel").textContent()).includes("Mitte"));
  await pg.locator('#clpop .clp-b:has-text("Max")').click(); s = await sent(pg);
  ok("Knopf über layout=Raster+Layout, step_up mit border", JSON.stringify(s) === JSON.stringify(["1|190|4"]), JSON.stringify(s));
  await pg.waitForTimeout(150); const slb = await pg.locator("#clpop .clp-s").boundingBox();
  await pg.mouse.move(slb.x + slb.width / 2, slb.y + slb.height - 2); await pg.mouse.down(); await pg.mouse.move(slb.x + slb.width / 2, slb.y + slb.height * 0.45, { steps: 4 }); await pg.mouse.up(); s = await sent(pg);
  ok("Schieberegler (senkrecht) sendet beim Loslassen", JSON.stringify(s) === JSON.stringify(["1|190|2"]), JSON.stringify(s));
  ok("kein „kann der Client noch nicht“", !(await pg.textContent("#clpop")).includes("noch nicht"));
  await pg.locator('#clpop .clp-b:has-text("OK")').click(); await pg.waitForTimeout(150);
  ok("OK schließt das Popup (action_up close)", !(await pg.isVisible("#clpop")));
  await pg.click('#cl-nav [data-sys]'); await pg.click('#cl-sys [data-sysa="modern"]'); await pg.waitForTimeout(200);
  ok("zurück auf Modern", !(await pg.isVisible("#classic")) && await pg.isVisible("#app main"));
  ok("KO-Telegramm zeichnet nur den Anzeigeort neu, dessen Plugin das KO benutzt (v0.9.38)", await pg.evaluate(() => {
    let n = { a: 0, b: 0 }; PLUGIN_TYPES.__t = { html: d => "<i>" + (++n[d.k]) + "</i>" };
    const mk = (k, tag) => ({ body: document.createElement("div"), plug: { id: k, cls: "__t", data: { k }, tags: new Set([tag]) } });
    const A = mk("a", "99991"), B = mk("b", "99992"); HOSTS.push(A, B);
    WSI.onmessage({ data: "1|99991|1|0" }); WSI.onmessage({ data: "1|99991|2|0" });
    HOSTS.splice(HOSTS.indexOf(A), 2); delete PLUGIN_TYPES.__t;
    return n.a === 2 && n.b === 0; }));
  await pg.close();
  console.log("Klassisch auf dem Handy: ein Plugin in voller Größe (v0.9.40)");
  {
    const p3 = await start(b, "Demo"); await p3.selectOption("#uisel", "classic"); await p3.waitForTimeout(500);
    await p3.evaluate(() => { PLUGS["900"].quad = "1"; PLUGS["905"].quad = "1"; PLUGS["901"].quad = "2"; clRender(); });
    await p3.waitForTimeout(600);
    ok("breit: zwei Quadranten mit je einem Plugin", await p3.evaluate(() => !!CL.hosts[1].plug && !!CL.hosts[2].plug && CL.hosts[1].classic === true));
    await p3.setViewportSize({ width: 400, height: 860 }); await p3.waitForTimeout(400);
    ok("Handy, Menü-Seite: kein Plugin läuft", await p3.evaluate(() => !CL.hosts[1].plug && !CL.hosts[2].plug));
    await p3.click("#cl-nav button[data-pg]"); await p3.waitForTimeout(800);
    const st = () => p3.evaluate(() => { const b = document.getElementById("cl-q1b").getBoundingClientRect(), q2 = document.getElementById("cl-q2b"), nav = document.getElementById("cl-nav").getBoundingClientRect(), sel = document.querySelector(".cl-psel");
      const el = document.querySelector("#cl-q1b *"); return { w: Math.round(b.width), top: Math.round(b.top), bottom: Math.round(b.bottom), nav: Math.round(nav.top), q2: q2.getClientRects().length, sel: sel && sel.textContent, title: document.getElementById("cl-title").textContent,
        id: CL.hosts[1].plug && CL.hosts[1].plug.id, h2: !!CL.hosts[2].plug, raw: document.getElementById("cl-q1b").classList.contains("cl-raw"), fs: el ? parseFloat(getComputedStyle(el).fontSize) * el.getBoundingClientRect().width / (el.offsetWidth || 1) : 0 }; });
    let r = await st();
    ok("ein Plugin über die ganze Breite, zweiter Quadrant weg", r.w >= 398 && r.w <= 401 && r.q2 === 0 && !r.h2 && r.id === "900", JSON.stringify(r));
    ok("Inhalt reicht bis zur unteren Leiste", Math.abs(r.bottom - r.nav) <= 3 && r.bottom - r.top > 500, JSON.stringify(r));
    ok("Auswahlzeile und Titel nennen das Plugin", r.sel === r.title && r.sel.length > 0, JSON.stringify(r));
    ok("Inhalt in normaler Schriftgröße (nicht verkleinert), bewegliche Darstellung", r.fs >= 12 && !r.raw, JSON.stringify(r));
    if (process.env.QC_SHOT) await p3.screenshot({ path: process.env.QC_SHOT + "1.png" });
    await p3.click('button[data-pnav="1"]'); await p3.waitForTimeout(800); r = await st();
    ok("› blättert zum nächsten Plugin (Diagramm)", r.id === "905" && r.sel === r.title, JSON.stringify(r));
    ok("Darstellung ohne CSS-zoom (ältere WebViews rechnen darunter anders)", await p3.evaluate(() => { const c = getComputedStyle(document.getElementById("cl-q1b")); return (c.zoom === "1" || c.zoom === "normal" || c.zoom === undefined) && c.transform !== "none"; }));
    { const bx = await p3.locator("#cl-q1b svg[data-chart]").first().boundingBox(), hov = async f => { await p3.mouse.move(bx.x + 44 + (bx.width - 54) * f, bx.y + bx.height / 2); await p3.waitForTimeout(150); return p3.evaluate(() => CL.hosts[1].plug.data.hover); };
      const a = await hov(0.25), c = await hov(0.75), n = await p3.evaluate(() => CHART_RANGES.find(r => r.k === CL.hosts[1].plug.data.cur).count);
      ok("Fadenkreuz im Diagramm trifft die Stelle unter dem Zeiger (¼ und ¾ der Breite)", Math.abs(a - n * 0.25) <= 1 && Math.abs(c - n * 0.75) <= 1, JSON.stringify({ a, c, n, bx })); }
    if (process.env.QC_SHOT) await p3.screenshot({ path: process.env.QC_SHOT + "2.png" });
    await p3.click('button[data-pnav="1"]'); await p3.waitForTimeout(800); r = await st();
    ok("› blättert weiter in die Plugins des zweiten Quadranten (Kamera), dann Ende", r.id === "901" && await p3.isDisabled('button[data-pnav="1"]'), JSON.stringify(r));
    if (process.env.QC_SHOT) await p3.screenshot({ path: process.env.QC_SHOT + "3.png" });
    await p3.click('#cl-nav button[data-nav="m:0"]'); await p3.waitForTimeout(300);
    ok("zurück im Menü: Plugin beendet", await p3.evaluate(() => !CL.hosts[1].plug));
    await p3.setViewportSize({ width: 1200, height: 900 }); await p3.waitForTimeout(900);
    ok("wieder breit: beide Quadranten laufen in der klassischen Darstellung", await p3.evaluate(() => !!CL.hosts[1].plug && !!CL.hosts[2].plug && CL.hosts[1].classic && CL.hosts[2].classic && document.getElementById("cl-q2b").getClientRects().length > 0));
    await p3.close();
  }
  console.log("Sichtbarkeit im Raum (visible_slot, v0.9.45)");
  {
    const pv = await start(b, "Demo", []);
    await pv.click('nav button:has-text("Bad")'); await pv.waitForTimeout(300);
    const has = async () => await pv.locator('#grid .card:has-text("Nur wenn an")').count();
    const h0 = await has(), n0 = await pv.locator("#grid .card").count();
    await pv.evaluate(() => WSI.onmessage({ data: "1|9420|1|0" })); await pv.waitForTimeout(400);
    const h1 = await has();
    await pv.evaluate(() => WSI.onmessage({ data: "1|9420|0|0" })); await pv.waitForTimeout(400);
    ok("Element mit Sichtbarkeits-KO: ohne Wert und bei 0 verborgen, bei 1 sichtbar; übrige Elemente bleiben", h0 === 0 && h1 === 1 && await has() === 0 && n0 === 3 && await pv.locator("#grid .card").count() === 3, [h0, h1, n0].join(" "));
    await pv.selectOption("#uisel", "classic"); await pv.waitForTimeout(400);
    const rows = async () => await pv.locator('#cl-left .cl-row[data-ref]').count();
    const r0 = await rows();
    await pv.evaluate(() => WSI.onmessage({ data: "2|9420|1|0" })); await pv.waitForTimeout(500);
    const r1 = await rows(), tx = await pv.textContent("#cl-left");
    ok("Klassisch: Zeile erscheint mit dem Sichtbarkeits-KO (auch beim Anfangswert)", r1 === r0 + 1 && tx.includes("Nur wenn an"), r0 + " " + r1);
    await pv.close();
  }
  console.log("Eigenes Kamera-Plugin 99-2 (v0.9.43)");
  {
    const pk = await start(b, "Demo", []); await pk.route("https://10.9.9.9/**", r => r.abort());
    const c0 = camPics; await pk.evaluate(() => openPlugin("RTSP/ONVIF/MJPG", "909")); await pk.waitForTimeout(900);
    const tx = await pk.textContent("#pbody");
    ok("99-2: Standbild über den HS wird geladen, drei Kameras", camPics > c0 && await pk.locator("#pbody .camtile").count() === 3, tx);
    ok("99-2: Kacheln mit kurzem Hinweis (Anmeldung, nur RTSP)", tx.includes("Anmeldung nötig") && tx.includes("Nur RTSP"), tx);
    await pk.click('#pbody [data-pa="sel"][data-i="1"]'); await pk.waitForTimeout(300);
    const tx1 = await pk.textContent("#pbody");
    ok("99-2: Kachel antippen → ganzer Hinweis auf den Kamera-Proxy", tx1.includes("verlangt eine Anmeldung") && tx1.includes("14783") && tx1.includes("Windows-QuadClient"), tx1);
    await pk.click('#pbody [data-pa="all"]'); await pk.waitForTimeout(300);
    const hk = await pk.content();
    ok("99-2: Passwort und RTSP-Adresse nirgends auf der Seite", !hk.includes("GeheimesKameraPasswort") && !hk.includes("rtsp://"));
    await pk.click('#pbody [data-pa="sel"][data-i="0"]'); await pk.waitForTimeout(300);
    ok("99-2: Einzelansicht", await pk.locator('#pbody .carch img[data-cam="0"]').count() === 1);
    await pk.evaluate(() => WSI.onmessage({ data: "1|9410|1|0" })); await pk.waitForTimeout(300);
    ok("99-2: KO „show“ schaltet auf die Kamera um", (await pk.textContent("#pbody")).includes("Garten") && await pk.locator("#pbody .camtile").count() === 0, await pk.textContent("#pbody"));
    await pk.selectOption("#uisel", "classic"); await pk.waitForTimeout(300);
    await pk.evaluate(() => { PLUGS["909"].quad = "1"; PLUGS["909"].vis = "1"; const l = clQuadList(1); CL.qsel[1] = l.findIndex(p => p.id === "909"); CL.hosts[1].plug = null; clRender(); }); await pk.waitForTimeout(700);
    ok("99-2: Klassisch im Quadranten statt „kann der Client noch nicht“", await pk.locator("#cl-q1b img[data-cam]").count() >= 1 && !(await pk.textContent("#cl-q1b")).includes("noch nicht"), await pk.textContent("#cl-q1b"));
    await pk.click('#cl-nav [data-sys]'); await pk.waitForTimeout(150);
    const st0 = await pk.textContent('#cl-sys [data-sysa="camproxy"]');
    await pk.click('#cl-sys [data-sysa="camproxy"]'); await pk.waitForTimeout(200);
    const dlgOpen = await pk.evaluate(() => document.getElementById("cpdlg").open);
    await pk.fill("#cpurl", "https://hs.test/kamera/"); await pk.fill("#cpkey", "K1"); await pk.click('#cpform button[type="submit"], #cpform button:not([type])'); await pk.waitForTimeout(700);
    ok("Klassisch: System-Menü zeigt die Versionsnummer (v0.9.47)", await pk.evaluate(() => document.getElementById("cl-ver").textContent === "QC-Client v" + VERSION));
    ok("Klassisch: System → Kamera-Proxy öffnet die Einstellung, Zustand steht im Menü (v0.9.44)", st0 === "Kamera-Proxy: aus" && dlgOpen && await pk.textContent('#cl-sys [data-sysa="camproxy"]') === "Kamera-Proxy: eingerichtet", st0 + " " + dlgOpen);
    await pk.close();
  }
  console.log("Gira-Addins im iframe (v0.9.42, Mini-Addin der Tests)");
  {
    const pa = await start(b, "Demo", ["2|9401|3.4|0", "2|9402|71|0"]);
    const frame = () => pa.frames().find(f => f.url().includes("/opt/hsfsweb/widgets/"));
    await pa.evaluate(() => openPlugin("Wetter", "907")); await pa.waitForTimeout(500);
    ok("Schalter aus (Standard): eigenes Wetter-Plugin, kein Addin geladen", await pa.locator("#pbody iframe").count() === 0 && await pa.isVisible('#pbody input[data-pa="wxq"]') && addinGets.length === 0, String(addinGets));
    await pa.selectOption("#addinsel", "1"); await pa.waitForTimeout(900);
    const fr = await pa.evaluate(() => { const f = document.querySelector("#pbody iframe"); return f && { src: f.src, sb: f.getAttribute("sandbox") }; });
    ok("Schalter ein: Addin der Klasse im iframe, Adresse mit Version und Sprache", !!fr && fr.src === "https://hs.test/opt/hsfsweb/widgets/demo.addin.wetter/index.html?cache=1.2.3&culture=de", JSON.stringify(fr));
    ok("iframe ohne allow-same-origin (Addin kommt nicht an Seite und Speicher)", !!fr && fr.sb === "allow-scripts", JSON.stringify(fr));
    const cfg = await frame().evaluate(() => CFG);
    ok("get-configuration: Einstellungen, KO-Werte, Auswahl mit Unterpunkt, Wiederholgruppe", !!cfg && cfg.datapoints.password === "DEMO" && cfg.datapoints.intervall === "60" && cfg.datapoints.aussen === 3.4
      && cfg.datapoints.quelle === "station" && cfg.datapoints["quelle.station.feuchte"] === 71 && cfg.datapoints.tag === 2 && cfg.datapoints["tag.0.name"] === "heute" && cfg.datapoints["tag.1.wind"] === "", JSON.stringify(cfg && cfg.datapoints));
    ok("get-configuration: Ansicht, Benutzerkennung ohne Namen, Darstellung, eigenes Stylesheet", cfg.view === "hs-app" && /^qc.+/.test(cfg.host.userId) && !cfg.host.userId.includes("Demo") && cfg.viewMode === "widget" && cfg.connection === 1 && /^(light|dark)$/.test(cfg.theme) && cfg.styleSheet.includes("--c0") && cfg.culture === "de", JSON.stringify(cfg).slice(0, 200));
    ok("Addin erfährt, dass die Verbindung steht", await frame().evaluate(() => GOT.some(g => g.type === "connection-status-changed" && g.data === 1)));
    await pa.evaluate(() => { WSI.onmessage({ data: "1|9401|5.5|0" }); WSI.onmessage({ data: "1|9403|12|0" }); WSI.onmessage({ data: "1|9999|1|0" }); }); await pa.waitForTimeout(200);
    const vc = await frame().evaluate(() => GOT.filter(g => g.type === "value-changed").map(g => g.data));
    ok("KO-Telegramm → value-changed mit Namen des Addins, altem und neuem Wert; fremde KOs nicht", vc.length === 2 && vc[0].id === "aussen" && vc[0].newValue === 5.5 && vc[0].oldValue === 3.4 && vc[1].id === "tag.1.wind" && vc[1].newValue === 12, JSON.stringify(vc));
    await sent(pa); await frame().evaluate(() => setDp("aussen", 7));
    ok("set-datapoint → Telegramm an das zugehörige KO", (await sent(pa)).includes("1|9401|7"));
    const sto = await frame().evaluate(async () => { const a = await ask("storage-set", { scope: "Device", key: "ort", value: "Musterdorf" });
      return [a, await ask("storage-get", { scope: "Device", key: "ort" }), await ask("storage-get", { scope: "Global", key: "x" }), await ask("storage-set", { scope: "Global", key: "x", value: "{}" }), await ask("get-icon", { name: "demo_icon" }), await ask("get-icon", { name: "../../quad/x" }), await ask("ping")]; });
    ok("Speicher „Device“ je Gerät und Instanz", sto[0] === true && sto[1] === "Musterdorf" && await pa.evaluate(() => store.get("addin.hs.test.907.ort") === "Musterdorf"), JSON.stringify(sto));
    ok("Speicher „Global“: lesen vom HS, schreiben (noch) abgelehnt", sto[2] === '{"ort":"Demostadt"}' && sto[3] === false, JSON.stringify(sto));
    ok("get-icon liefert das SVG, fremde Pfade nicht", sto[4].includes("<svg") && sto[5] === "", JSON.stringify(sto.slice(4)));
    await pa.selectOption("#addinsel", "0"); await pa.waitForTimeout(500);
    ok("Schalter wieder aus: eigenes Plugin zurück", await pa.locator("#pbody iframe").count() === 0 && await pa.isVisible('#pbody input[data-pa="wxq"]'));
    addinMode = "ohne"; await pa.selectOption("#addinsel", "1"); await pa.waitForTimeout(600);
    ok("Instanz ohne Addin-Einstellungen: eigenes Plugin", await pa.locator("#pbody iframe").count() === 0 && await pa.isVisible('#pbody input[data-pa="wxq"]'));
    addinMode = "stumm"; await pa.selectOption("#addinsel", "0"); await pa.selectOption("#addinsel", "1"); await pa.waitForTimeout(600);
    const before = await pa.locator("#pbody iframe").count(); await pa.waitForTimeout(11000);
    ok("Addin antwortet nicht: nach 10 s eigenes Plugin", before === 1 && await pa.locator("#pbody iframe").count() === 0 && await pa.isVisible('#pbody input[data-pa="wxq"]'), String(before));
    addinMode = "ok"; await pa.selectOption("#addinsel", "0"); await pa.selectOption("#uisel", "classic"); await pa.waitForTimeout(400);
    await pa.evaluate(() => { PLUGS["907"].quad = "1"; clRender(); }); await pa.selectOption("#addinsel", "1").catch(() => pa.evaluate(() => addinSwitch(true)));
    await pa.evaluate(() => { const l = clQuadList(1); CL.qsel[1] = l.findIndex(p => p.id === "907"); CL.hosts[1].plug = null; clRender(); }); await pa.waitForTimeout(900);
    const qf = await pa.$("#cl-q1b iframe"), cv = qf ? await (await qf.contentFrame()).evaluate(() => CFG && CFG.view) : null;
    ok("Klassisch: Addin im Quadranten mit Ansicht hs-c19-quad", cv === "hs-c19-quad" && await pa.locator("#cl-q1b iframe.addin-ifr").count() === 1, String(cv));
    await pa.close();
  }
  console.log("Anmeldung gescheitert: Meldung und Diagnose (v0.9.39)");
  for (const [fall, up] of [["abgelehnt", true], ["nicht erreichbar", false]]) {
    const p2 = await b.newPage();
    await p2.route("https://hs.test/**", r => { const u = r.request().url();
      if (u.includes("qc.html")) return r.fulfill({ status: 200, contentType: "text/html", body: T("../qc.html") });
      return up ? r.fulfill({ status: 200, body: "ok" }) : r.abort(); });
    await p2.addInitScript(() => { window.WebSocket = class { constructor() { this.readyState = 3; setTimeout(() => this.onclose && this.onclose({ code: 1006, reason: "", wasClean: false }), 30); } send() {} close() {} }; });
    await p2.goto("https://hs.test/opt/hs-client/qc.html");
    await p2.fill("#lhost", "hs.test"); await p2.fill("#luser", "GeheimerBenutzer"); await p2.fill("#lpass", "GeheimesPasswort"); await p2.check("#lremember"); await p2.click("button[type=submit]");
    await p2.waitForTimeout(700);
    const m = await p2.textContent("#lmsg"), d = await p2.textContent("#ldiag");
    ok("Fall „" + fall + "“: passende Meldung", up ? m.includes("hat die Anmeldung aber abgelehnt") : m.includes("nicht erreichbar"), m);
    ok("Fall „" + fall + "“: Diagnose mit Version, Code und HTTPS-Ergebnis", await p2.isVisible("#ldiagbox") && d.includes("QC-Client 0.9.") && d.includes("Code 1006") && d.includes(up ? "HTTPS-Abruf: erreichbar" : "HTTPS-Abruf: NICHT erreichbar"), d);
    ok("Fall „" + fall + "“: Diagnose ohne Adresse, Benutzer und Passwort", !d.includes("hs.test") && !d.includes("GeheimerBenutzer") && !d.includes("GeheimesPasswort"), d);
    ok("Fall „" + fall + "“: gemerktes Passwort verworfen (kein Selbst-Anmelden beim Neuladen)", await p2.evaluate(() => !JSON.stringify(localStorage).includes("GeheimesPasswort")));
    await p2.close();
  }
  console.log("Rechte");
  console.log("Plugin Ressourcen 50-1 (v0.9.49, erfundene Einstellungen)");
  { const pr = await start(b, "Demo", ["2|9501|1500.0|0", "2|9502|-300.0|0", "2|9503|200.0|0", "2|9504|64.0|0"]); const errs = []; pr.on("pageerror", e => errs.push(e.message));
    await pr.evaluate(() => openPlugin("Ressourcen", "950")); await pr.waitForTimeout(900);
    const tx = (await pr.textContent("#pbody")).replace(/\s+/g, " ");
    ok("Bilanz: Erzeugung, Einspeisung bei negativem Netzwert (Betrag), Speicher", tx.includes("Erzeugung1500 W") && tx.includes("Netz-Einspeisung300 W") && tx.includes("Speicher-Bezug200 W"), tx.slice(0, 300));
    ok("Instrument mit Wert und Grenzen, Wertanzeige mit Beschriftung", (await pr.locator("#pbody svg.rgauge").count()) === 1 && tx.includes("64%0100") && tx.includes("PV1500 W"), tx.slice(0, 300));
    ok("unbekannte Art wird übersprungen und im Protokoll genannt", await pr.evaluate(() => document.getElementById("log").textContent.includes("unbekannte Art „Unbekannt“")));
    await pr.evaluate(() => WSI.onmessage({ data: "1|9502|450.0|0" })); await pr.waitForTimeout(300);
    ok("KO-Telegramm: Netz wechselt auf Bezug", (await pr.textContent("#pbody")).replace(/\s+/g, " ").includes("Netz-Bezug450 W"));
    { const tz = async () => (await pr.textContent("#pbody")).replace(/\s+/g, " "), t0 = await tz();                // v0.9.56: Zufallswerte, nur Anzeige
      const nSent = await pr.evaluate(() => { window.__zs = 0; const o = WSI.send; WSI.send = function (m) { if (!/^80/.test(m)) window.__zs++; return o && o.apply(this, arguments); }; return 0; });
      await pr.selectOption("#reszsel", "1"); await pr.waitForTimeout(300); const t1 = await tz();
      ok("Zufallswerte: eingeschaltet, gekennzeichnet, Anzeige ändert sich", t1.includes("Zufallswerte (Test)") && t1.replace(/Zufallswerte[^E]*/, "") !== t0, t1.slice(0, 200));
      await pr.evaluate(() => resDemoTick()); await pr.waitForTimeout(100); const t2 = await tz();
      ok("Zufallswerte: nächster Wechsel bringt neue Werte, Takt 5 s", t2 !== t1 && await pr.evaluate(() => RES_DEMO_MS === 5000 && RES_DEMO !== null), t2.slice(0, 200));
      ok("Zufallswerte: echte Werte unberührt, nichts gesendet", await pr.evaluate(() => V.get("9501") === "1500.0" && V.get("9502") === "450.0" && window.__zs === 0) && nSent === 0);
      await pr.selectOption("#reszsel", "0"); await pr.waitForTimeout(300); const t3 = await tz();
      ok("Zufallswerte aus: wieder die echten Werte, Kennzeichnung weg", t3 === t0 && !t3.includes("Zufallswerte"), t3.slice(0, 200)); }
    await pr.evaluate(() => { PLUGS["950"].quad = "1"; PLUGS["950"].vis = "1"; }); await pr.selectOption("#uisel", "classic"); await pr.waitForTimeout(600);
    await pr.evaluate(() => clPlugin("950")); await pr.waitForTimeout(900);
    ok("Klassisch: Kacheln im Quadranten", (await pr.textContent("#cl-q1b")).includes("Netz-Bezug") && (await pr.locator("#cl-q1b svg.rgauge").count()) === 1, await pr.textContent("#cl-q1b"));
    ok("Klassisch (v0.9.52): Werteliste der Bilanz beginnt unter dem Titel", await pr.evaluate(() => { const t = document.querySelector("#cl-q1b .res-tile:has(.list)"); return t.querySelector(".list .row").getBoundingClientRect().top >= t.querySelector(".cap").getBoundingClientRect().bottom - 1; }));
    await pr.evaluate(() => document.querySelector('#cl-sys [data-sysa="resdemo"]').click()); await pr.waitForTimeout(300);
    ok("Klassisch (v0.9.56): Zufallswerte über das System-Menü, Kennzeichnung in der Blätterleiste", (await pr.locator("#cl-q1b .cl-pgb .res-demo").count()) === 1 && (await pr.textContent('#cl-sys [data-sysa="resdemo"]')) === "Zufallswerte: ein" && !(await pr.textContent("#cl-q1b")).includes("Netz-Bezug450 W"), await pr.textContent("#cl-q1b"));
    await pr.evaluate(() => resDemo(false)); await pr.waitForTimeout(200);
    await pr.evaluate(() => { const d = HOSTS.find(h => h.plug && h.plug.cls === "50-1" && h.plug.data).plug.data; window.__k0 = d.tiles[0].kos.slice(); d.tiles[0].kos = ["9501", "9501", "9501", ""]; resDemo(true); }); await pr.waitForTimeout(200);
    ok("v0.9.57: Zeilen am selben KO bekommen eigene Zufallswerte", await pr.evaluate(() => { const r = [...document.querySelectorAll("#cl-q1b .res-tile")][0].querySelectorAll(".row b"); return r.length === 3 && new Set([...r].map(x => x.textContent)).size >= 2; }), await pr.textContent("#cl-q1b"));
    await pr.evaluate(() => { resDemo(false); const d = HOSTS.find(h => h.plug && h.plug.cls === "50-1" && h.plug.data).plug.data; window.__k1 = d.tiles[0].kos.join(); d.tiles[0].kos = window.__k0; resDemo(false); }); await pr.waitForTimeout(200);
    ok("v0.9.57: nach dem Ausschalten hängen die Zeilen wieder an ihren KOs", await pr.evaluate(() => window.__k1 === "9501,9501,9501," && HOSTS.every(h => !h.plug || !h.plug.data || !h.plug.data.tiles || h.plug.data.tiles.every(t => !t.zk))));
    ok("Klassisch: nach dem Ausschalten wieder echte Werte", (await pr.textContent("#cl-q1b")).replace(/\s+/g, " ").includes("Netz-Bezug450 W") && (await pr.locator("#cl-q1b .res-demo").count()) === 0);
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pr.close(); }

  console.log("Plugin Energiefluss 180-1 (v0.9.58, erfundene Einstellungen)");
  { const pe = await start(b, "Demo", ["2|9801|4200.0|0", "2|9802|800.0|0", "2|9803|1900.0|0", "2|9804|1500.0|0", "2|9805|71.0|0", "2|9806|12.3|0", "2|9807|68.0|0", "2|9808|81.0|0", "2|9809|16.2|0", "2|9810|3.1|0", "2|9811|17.5|0", "2|9812|1.0|0"]);
    const errs = []; pe.on("pageerror", e => errs.push(e.message));
    await pe.evaluate(() => openPlugin("Energiefluss", "953")); await pe.waitForTimeout(900);
    const nt = async k => (await pe.textContent(`#pbody [data-ef="${k}"]`)).replace(/\s+/g, " "), on = async k => pe.locator(`#pbody .ef-l.on[data-ef="${k}"]`).count();
    ok("vier Kreise: Titel, Wert, Einheit, Zusatzzeile (v0.9.59 wie im QuadClient)", (await nt("pv")).includes("PV-ANLAGE4200W17.5 kWh") && (await nt("haus")).includes("HAUS1900W12.3 kWh") && (await nt("bat")).includes("SPEICHER800W lädt71 %") && (await nt("netz")).includes("NETZ1500WEinspeisung"), [await nt("pv"), await nt("haus"), await nt("bat"), await nt("netz")].join(" | "));
    ok("Fußzeile: Eigenver., Autarkie, Einspeisung, Netzbezug, Live", (await nt("evpct")).includes("EIGENVER.68%") && (await nt("autpct")).includes("81%") && (await nt("einsp")).includes("16.2kWh") && (await nt("bezug")).includes("3.1kWh") && (await pe.textContent("#pbody svg.ef")).includes("Live"), await nt("einsp"));
    ok("Einspeisung und Laden: Linien PV–Haus, PV–Netz, Speicher–Haus (rückwärts); Netz–Haus fehlt", await on("pvHaus") === 1 && await on("pvNetz") === 1 && await pe.locator('#pbody .ef-l.rev[data-ef="batHaus"]').count() === 1 && await on("netzHaus") === 0 && await pe.locator("#pbody .ef-l").count() === 3);
    await pe.evaluate(() => { WSI.onmessage({ data: "1|9804|-650.0|0" }); WSI.onmessage({ data: "1|9812|2.0|0" }); }); await pe.waitForTimeout(300);
    ok("Netz negativ = Bezug (Betrag), Speicher entlädt: Linien Netz→Haus und Speicher→Haus", (await nt("netz")).includes("650WBezug") && (await nt("bat")).includes("W entlädt") && await on("netzHaus") === 1 && await on("batHaus") === 1 && await pe.locator("#pbody .ef-l.rev").count() === 0 && await on("pvNetz") === 0, await nt("netz"));
    await pe.evaluate(() => WSI.onmessage({ data: "1|9812|3.0|0" })); await pe.waitForTimeout(300);
    ok("Speicher-Status 3 = Ruhe: nur „W“, keine Speicher-Linie", (await nt("bat")).includes("800W71 %") && await on("batHaus") === 0 && await pe.locator("#pbody .ef-l").count() === 2, await nt("bat"));
    await pe.evaluate(() => { WSI.onmessage({ data: "1|9812|1.0|0" }); }); await pe.emulateMedia({ reducedMotion: "reduce" }); await pe.waitForTimeout(300);
    ok("v0.9.60: Linien laufen auch bei „Animationen reduzieren“, beim Laden rückwärts", await pe.evaluate(() => { const a = getComputedStyle(document.querySelector('#pbody .ef-l[data-ef="pvHaus"]')), r = getComputedStyle(document.querySelector('#pbody .ef-l[data-ef="batHaus"]'));
      return a.animationName === "efrun" && a.animationDirection === "normal" && r.animationName === "efrun" && r.animationDirection === "reverse"; }));
    await pe.emulateMedia({ reducedMotion: null }); await pe.evaluate(() => { WSI.onmessage({ data: "1|9812|3.0|0" }); }); await pe.waitForTimeout(200);
    ok("Einstellungen auch als Unterelemente lesbar, ohne KO „Warte auf Daten“", await pe.evaluate(() => { const T = PLUGIN_TYPES["180-1"], P = s => new DOMParser().parseFromString(s, "text/xml");
      const a = T.read(P('<project><settings><pv>77</pv><netz ko="78"/></settings></project>')), e = T.read(P("<project/>"));
      return a.ko.pv === "77" && a.ko.netz === "78" && a.ko.haus === "" && T.html(e).includes("Warte auf Daten") && T.tags(e).filter(Boolean).length === 0; }));
    await pe.evaluate(() => { PLUGS["953"].quad = "1"; PLUGS["953"].vis = "1"; }); await pe.selectOption("#uisel", "classic"); await pe.waitForTimeout(600);
    await pe.evaluate(() => clPlugin("953")); await pe.waitForTimeout(900);
    ok("Klassisch: Zeichnung füllt den Quadranten, ohne überzustehen", await pe.evaluate(() => { const q = document.querySelector("#cl-q1b"), s = q.querySelector("svg.ef"); if (!s) return false; const a = q.getBoundingClientRect(), r = s.getBoundingClientRect(); return r.height > 200 && r.bottom <= a.bottom + 1 && r.right <= a.right + 1 && r.left >= a.left - 1; }));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pe.close(); }

  console.log("Energiefluss mit Verbrauchern 99-3 und Zufallswerte (v0.9.61, erfundene Einstellungen)");
  { const pv = await start(b, "Demo", ["2|9821|5000.0|0", "2|9822|600.0|0", "2|9823|9000.0|0", "2|9824|-4600.0|0", "2|9825|55.0|0", "2|9826|2.0|0", "2|9841|7400.0|0", "2|9842|0.0|0", "2|9843|900.0|0", "2|9844|-40.0|0",
      "2|9801|4200.0|0", "2|9803|1900.0|0", "2|9804|1500.0|0", "2|9812|1.0|0"]);
    const errs = []; pv.on("pageerror", e => errs.push(e.message));
    await pv.evaluate(() => openPlugin("Energiefluss Verbraucher", "954")); await pv.waitForTimeout(900); await sent(pv);
    const nt = async k => (await pv.textContent(`#pbody [data-ef="${k}"]`)).replace(/\s+/g, " "), cls = k => pv.getAttribute(`#pbody [data-ef="${k}"]`, "class");
    ok("Grundwerte aus <ko id tag>: PV, Haus, Netz-Bezug, Speicher entlädt", (await nt("pv")).includes("PV-ANLAGE5000W") && (await nt("haus")).includes("HAUS9000W") && (await nt("netz")).includes("4600WBezug") && (await nt("bat")).includes("600W entlädt55 %"), await nt("bat"));
    ok("vier Verbraucher, der ohne KO fehlt", await pv.locator("#pbody .ef-vb").count() === 4 && await pv.locator('#pbody [data-ef="vb:wb2"]').count() === 0);
    ok("Verbraucher: Name, Leistung, Vorgabe-Name ohne Angabe", (await nt("vb:wb1")).includes("Wallbox Garage") && (await nt("vb:wb1")).includes("7400 W") && (await nt("vb:wm")).includes("Waschmaschine") && (await nt("vb:wm")).includes("0 W"), await nt("vb:wb1") + "|" + await nt("vb:wm"));
    ok("Anschlusspunkt: Haus als Vorgabe, PV und Speicher wählbar; unbekanntes Symbol fällt auf die Vorgabe", await pv.evaluate(() => { const a = k => document.querySelector(`#pbody [data-ef="vb:${k}"]`).dataset.an, d = HOSTS.find(h => h.plug && h.plug.cls === "99-3").plug.data;
      const l = k => document.querySelector(`#pbody [data-ef="vbl:${k}"]`).getAttribute("d");
      return a("wb1") === "haus" && a("wm") === "haus" && a("s1") === "pv" && a("s2") === "bat" && l("wb1").startsWith("M253 197L") && l("s1").startsWith("M253 44L") && l("s2").startsWith("M95 120L") && d.vb.find(q => q.id === "s2").icon === "steckdose" && d.vb.find(q => q.id === "wm").icon === "wasch"; }));
    ok("Linien: mit Leistung fließend, ohne Leistung dünner Strich, negativ rückwärts", (await cls("vbl:wb1")) === "ef-l on" && (await cls("vbl:wm")) === "ef-l0" && (await cls("vbl:s2")) === "ef-l on rev", await cls("vbl:s2"));
    await pv.evaluate(() => { WSI.onmessage({ data: "1|9842|12800.0|0" }); WSI.onmessage({ data: "1|9841|0.0|0" }); }); await pv.waitForTimeout(300);
    ok("KO-Telegramm: Verbraucher wechselt, ab 10 kW in kW", (await nt("vb:wm")).includes("12.8 kW") && (await cls("vbl:wm")) === "ef-l on" && (await cls("vbl:wb1")) === "ef-l0", await nt("vb:wm"));
    ok("Plätze: bis zehn am Haus eine Reihe mit Namen, darüber zwei Reihen ohne; höchstens 17", await pv.evaluate(() => { const mk = (n, an) => Array.from({ length: n }, (_, i) => ({ id: an + i, name: "V", icon: "sonst", an, ko: "" }));
      const a = efPlace(mk(10, "haus")), c = efPlace(mk(13, "haus").concat(mk(2, "pv"), mk(1, "bat"), mk(1, "netz"))), uniq = l => new Set(l.map(p => p.s.x + "," + p.s.y)).size === l.length;
      const T = PLUGIN_TYPES["99-3"], x = new DOMParser().parseFromString("<project>" + Array.from({ length: 20 }, (_, i) => `<vb id="s${i}" tag="${7000 + i}"/>`).join("") + "</project>", "text/xml");
      return a.length === 10 && uniq(a) && a.every(p => p.s.nm && p.s.y === 199) && c.length === 17 && uniq(c) && c.filter(p => p.q.an === "haus").every(p => !p.s.nm && p.s.y > 150) && c.filter(p => p.q.an !== "haus").every(p => p.s.y === 24) && T.read(x).vb.length === 17 && T.tags(T.read(x)).filter(Boolean).length === 17; }));
    const real = (await pv.textContent("#pbody")).replace(/\s+/g, " ");
    await pv.selectOption("#reszsel", "1"); await pv.waitForTimeout(300); const z1 = (await pv.textContent("#pbody")).replace(/\s+/g, " ");
    ok("Zufallswerte: gekennzeichnet, eigene Verbraucher bleiben, Werte ändern sich", z1.includes("ZUFALLSWERTE") && await pv.locator("#pbody .ef-vb").count() === 4 && z1.includes("Wallbox Garage") && z1.replace("ZUFALLSWERTE", "") !== real, z1.slice(0, 200));
    await pv.evaluate(() => { openPlugin("Energiefluss", "953"); }); await pv.waitForTimeout(900); await pv.evaluate(() => efDemoTick()); await pv.waitForTimeout(200);
    const z2 = (await pv.textContent("#pbody")).replace(/\s+/g, " ");
    ok("Zufallswerte im Plugin 180-1: neun Beispiel-Verbraucher an Haus, PV und Speicher", z2.includes("ZUFALLSWERTE") && await pv.locator("#pbody .ef-vb").count() === 9 && await pv.locator('#pbody .ef-vb[data-an="pv"]').count() === 1 && await pv.locator('#pbody .ef-vb[data-an="bat"]').count() === 1 && z2.includes("Wärmepumpe"), z2.slice(0, 200));
    ok("Zufallswerte: Haus mindestens so groß wie seine Verbraucher, Netz = Bilanz", await pv.evaluate(() => HOSTS.filter(h => h.plug && h.plug.data && h.plug.data.fake).every(h => { const f = h.plug.data.fake, s = f.vb.filter(q => q.an === "haus").reduce((a, q) => a + q.val, 0);
      return f.haus >= s && Math.abs(f.netz - (f.pv - f.haus - (f.batstate === 1 ? f.bat : -f.bat))) <= 1; })));
    await pv.selectOption("#reszsel", "0"); await pv.waitForTimeout(300); const z3 = (await pv.textContent("#pbody")).replace(/\s+/g, " ");
    ok("Zufallswerte aus: echte Werte, keine Beispiel-Verbraucher, nichts gesendet", !z3.includes("ZUFALLSWERTE") && z3.includes("PV-ANLAGE4200W") && await pv.locator("#pbody .ef-vb").count() === 0 && (await sent(pv)).length === 0 && await pv.evaluate(() => V.get("9801") === "4200.0"), z3.slice(0, 200));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pv.close(); }

  console.log("Klassisch am Handy größer (v0.9.62)");
  { const ph = await start(b, "Demo", ["2|111|1.0|0", "2|116|42.0|0"]); const errs = []; ph.on("pageerror", e => errs.push(e.message));
    await ph.selectOption("#uisel", "classic"); await ph.waitForTimeout(500); await ph.setViewportSize({ width: 400, height: 860 }); await ph.waitForTimeout(500);
    const m = await ph.evaluate(() => { const t = [...document.querySelectorAll("#cl-left .cl-mt")].map(e => e.getBoundingClientRect()); return { s: CL.s, n: t.length, w: Math.round(t[0].width), cols: new Set(t.map(r => Math.round(r.left))).size, max: Math.max(...t.map(r => r.right)), zoom: getComputedStyle(document.querySelector("#cl-left .cl-mt")).zoom }; });
    ok("Bühne 453 breit: Maßstab rund 0,88 statt 0,59; Menü zwei Spalten ohne CSS-zoom, nichts steht über", Math.abs(m.s - 400 / 453) < 0.01 && m.cols === 2 && m.max <= 401 && m.w > 180 && (m.zoom === "1" || m.zoom === "normal" || m.zoom === undefined), JSON.stringify(m));
    await ph.click('#cl-left .cl-mt:has-text("Wohnen")'); await ph.waitForTimeout(400);
    const r = await ph.evaluate(() => { const row = [...document.querySelectorAll("#cl-left .cl-row[data-ref]")].find(e => e.querySelector(".cl-name") && e.querySelector(".cl-name").textContent === "Deckenlicht"), nm = row.querySelector(".cl-name"), rb = row.getBoundingClientRect(), nb = nm.getBoundingClientRect();
      const ps = [...row.querySelectorAll(".cl-p")].map(e => e.getBoundingClientRect()).filter(q => q.width > 0);
      return { r2: row.classList.contains("r2"), h: row.offsetHeight, fs: parseFloat(getComputedStyle(nm).fontSize) * CL.s, below: ps.length > 0 && ps.every(q => q.top >= nb.top + 30 * CL.s && q.bottom <= rb.bottom + 1 && q.left >= -1 && q.right <= 401),
        n: ps.length, over: document.documentElement.scrollWidth - window.innerWidth, rows: document.querySelectorAll("#cl-left .cl-row[data-ref]").length, cap: Math.floor(CL.rows / 2) }; });
    ok("Funktionszeile zweizeilig (80 hoch), Name mindestens 17 px groß", r.r2 && r.h === 80 && r.fs >= 17, JSON.stringify(r));
    ok("Felder der Vorlage stehen in der zweiten Zeile und bleiben im Bild, kein waagrechter Überlauf", r.below && r.over <= 0, JSON.stringify(r));
    ok("pro Seite halb so viele Funktionszeilen", r.rows <= r.cap && r.cap >= 5, JSON.stringify(r));
    await ph.setViewportSize({ width: 1366, height: 768 }); await ph.waitForTimeout(500);
    ok("breit unverändert: Zeile 40 hoch, einzeilig", await ph.evaluate(() => { const row = document.querySelector("#cl-left .cl-row[data-ref]"); return !!row && !row.classList.contains("r2") && row.offsetHeight === 40; }));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await ph.close(); }

  console.log("Plugin Meldeanlage 1-15, nur Anzeige (v0.9.51, erfundene Einstellungen)");
  { const pm = await start(b, "Demo", ["2|9601|1.0|0", "2|9603|0.0|0", "2|9604|0.0|0", "2|9611|1.0|0", "2|9613|1.0|0", "2|9614|0.0|0",
      "2|9621|Anlage bereit|0", "2|9622|Zeile zwei|0", "2|9631|Fenster Bad|0", "2|9632|Tuer Keller|0", "2|9640|2.0|0", "2|9650|0.0|0"]);
    const errs = []; pm.on("pageerror", e => errs.push(e.message));
    await pm.evaluate(() => openPlugin("Meldeanlage", "951")); await pm.waitForTimeout(900); await sent(pm);
    const tx = async () => (await pm.textContent("#pbody")).replace(/\s+/g, " ");
    let x = await tx();
    ok("Bereiche: Extern scharfschaltbereit, Intern scharf", x.includes("ExternScharfschaltbereit") && x.includes("InternScharf"), x.slice(0, 300));
    ok("Statusanzeige zeigt die belegten Textzeilen", x.includes("Anlage bereit") && x.includes("Zeile zwei"), x.slice(0, 300));
    ok("Melderliste: Anzahl und Einträge", x.includes("fehlend oder offen2") && x.includes("Fenster Bad") && x.includes("Tuer Keller"), x.slice(0, 400));
    ok("Ereignisspeicher aus dem Meldungsarchiv, neueste zuerst, Umlaute richtig", x.includes("Pumpe Störung") && x.indexOf("Fenster Bad offen") < x.indexOf("Pumpe wieder OK"), x.slice(0, 600));
    ok("Feuer-Alarm nur bei aktivem Alarm", await pm.locator("#pbody .ma-fire").count() === 0);
    await pm.evaluate(() => { WSI.onmessage({ data: "1|9650|1.0|0" }); WSI.onmessage({ data: "1|9604|1.0|0" }); WSI.onmessage({ data: "1|9613|0.0|0" }); WSI.onmessage({ data: "1|9611|0.0|0" }); }); await pm.waitForTimeout(300);
    x = await tx();
    ok("KO-Telegramme: Feuer-Alarm erscheint, Extern meldet Alarm, Intern nicht bereit", await pm.locator("#pbody .ma-fire").count() === 1 && x.includes("ExternAlarm") && x.includes("InternNicht bereit zum Scharfschalten"), x.slice(0, 300));
    ok("Bereiche mit Knopf zum Scharfschalten, Quittung erst bei Alarm, Hinweis steht da", await pm.locator("#pbody .ma-area .ma-arm").count() === 2 && await pm.locator("#pbody .ma-ack").count() === 1 && x.includes("gedrückt halten"), x.slice(-200));
    await pm.evaluate(() => document.querySelectorAll("#pbody .pval").forEach(e => e.click())); const s1 = await sent(pm);
    ok("Antippen der Kacheln sendet nichts an den HomeServer", s1.length === 0, JSON.stringify(s1));
    ok("unbekannte Art wird übersprungen und im Protokoll genannt", await pm.evaluate(() => document.getElementById("log").textContent.includes("Meldeanlage: unbekannte Art „Unbekannt“")));
    await pm.evaluate(() => { PLUGS["951"].quad = "1"; PLUGS["951"].vis = "1"; }); await pm.selectOption("#uisel", "classic"); await pm.waitForTimeout(600);
    await pm.evaluate(() => clPlugin("951")); await pm.waitForTimeout(900);
    const mq = pm.locator("#cl-q1b"), mt = async () => (await mq.textContent()).replace(/\s+/g, " ");
    ok("Klassisch: Kacheln in zwei Spalten ohne Rollen, Quittung bei Alarm da", await mq.locator(".cl-vgrid .cl-vt").count() === 6 && await mq.locator(".ma-ack").count() === 1
      && await mq.locator(".cl-vgrid").evaluate(e => e.scrollHeight <= e.clientHeight + 1 && getComputedStyle(e).gridTemplateColumns.trim().split(/\s+/).length === 2), await mt());
    ok("Klassisch: Zustand der Bereiche und Statuszeilen in der Kachel", (await mt()).includes("ExternAlarm") && (await mt()).includes("InternNicht bereit") && (await mt()).includes("Anlage bereit"), await mt());
    ok("Klassisch: Melderliste zeigt die Anzahl groß", (await mq.locator(".ma-det .big").textContent()).trim() === "2");
    await mq.locator('[data-pa="pg"][data-d="1"]').click(); await pm.waitForTimeout(200);
    ok("Klassisch: zweite Seite mit dem Überfall-Alarm und Halteknopf", (await mt()).includes("Überfall") && await mq.locator(".ma-raid .ma-hold").count() === 1, await mt());
    await mq.locator('[data-pa="pg"][data-d="-1"]').click(); await pm.waitForTimeout(200);
    await mq.locator(".ma-det").click(); await pm.waitForTimeout(200);
    ok("Klassisch: Melderliste öffnet die Unteransicht mit den Einträgen", (await mt()).includes("Fenster Bad") && (await mt()).includes("Tuer Keller") && await mq.locator('[data-pa="back"]').count() === 1, await mt());
    await mq.locator('[data-pa="back"]').click(); await pm.waitForTimeout(200); await mq.locator(".ma-msg").click(); await pm.waitForTimeout(200);
    ok("Klassisch: Ereignisspeicher öffnet die Meldungen", (await mt()).includes("Pumpe Störung"), await mt());
    await mq.locator('[data-pa="back"]').click(); await pm.waitForTimeout(200); const s2 = await sent(pm);
    ok("Klassisch: auch hier wird nichts an den HomeServer gesendet", s2.length === 0, JSON.stringify(s2));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pm.close(); }
  console.log("Plugin KNX-Alarmzentrale 1-21, nur Anzeige (v0.9.52, erfundene Einstellungen)");
  { const pz = await start(b, "Demo", ["2|9701|1.0|0", "2|9703|0.0|0", "2|9704|0.0|0", "2|9706|0.0|0", "2|9711|0.0|0", "2|9713|0.0|0", "2|9714|0.0|0", "2|9716|1.0|0", "2|9721|Zentrale ok|0", "2|9750|0.0|0", "2|9761|0.0|0"]);
    const errs = []; pz.on("pageerror", e => errs.push(e.message));
    await pz.evaluate(() => openPlugin("Alarmzentrale", "952")); await pz.waitForTimeout(700); await sent(pz);
    let x = (await pz.textContent("#pbody")).replace(/\s+/g, " ");
    ok("Bereiche: scharfschaltbereit und „Unscharf nach Alarm“, Statuszeile", x.includes("SB ExternScharfschaltbereit") && x.includes("SB InternUnscharf nach Alarm") && x.includes("Zentrale ok"), x.slice(0, 300));
    ok("Feuer-Kachel steht bei der Alarmzentrale immer da (v0.9.53), ohne Alarm „Kein Alarm“", x.includes("FeuerKein Alarm") && !(await pz.textContent("#pbody .ma-raid")).includes("Überfall-Alarm"), x.slice(0, 300));
    await pz.evaluate(() => { WSI.onmessage({ data: "1|9761|1.0|0" }); WSI.onmessage({ data: "1|9750|1.0|0" }); }); await pz.waitForTimeout(300);
    ok("Überfall-Alarm empfangen und Feuer-Alarm erscheinen bei Alarm", (await pz.textContent("#pbody .ma-raid")).includes("Überfall-Alarm") && (await pz.textContent("#pbody .ma-fire")).includes("Feuer-Alarm"));
    { const hb = pz.locator("#pbody .ma-hold"); await hb.dispatchEvent("pointerdown"); await pz.waitForTimeout(600); await hb.dispatchEvent("pointerup"); await pz.waitForTimeout(1800);
      const k = await sent(pz); ok("Überfall-Alarm (v0.9.53): kurzes Drücken sendet nichts", k.length === 0, JSON.stringify(k));
      await pz.locator("#pbody .ma-hold").dispatchEvent("pointerdown"); await pz.waitForTimeout(2300); const g = await sent(pz);
      ok("Überfall-Alarm: nach 2 s Halten wird einmal 1 auf „senden“ geschickt", g.length === 1 && /^1\|9760\|1(\.0)?$/.test(g[0]), JSON.stringify(g));
      await pz.locator("#pbody .ma-hold").dispatchEvent("pointerup"); }
    await pz.evaluate(() => { PLUGS["952"].quad = "1"; PLUGS["952"].vis = "1"; }); await pz.selectOption("#uisel", "classic"); await pz.waitForTimeout(600);
    await pz.evaluate(() => clPlugin("952")); await pz.waitForTimeout(700);
    ok("Klassisch: fünf Kacheln in zwei Spalten", await pz.locator("#cl-q1b .cl-vgrid .cl-vt").count() === 5, await pz.textContent("#cl-q1b"));
    await pz.evaluate(() => document.querySelectorAll("#cl-q1b .cl-vt").forEach(e => e.click())); const s3 = await sent(pz);
    ok("nur Anzeige: nichts wird gesendet", s3.length === 0, JSON.stringify(s3));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pz.close(); }

  console.log("Meldeanlage: Scharf-/Unscharfschalten und Quittieren mit Geräte-PIN (v0.9.54)");
  { const pa = await start(b, "Demo", ["2|9601|1.0|0", "2|9603|0.0|0", "2|9604|0.0|0", "2|9611|0.0|0", "2|9613|0.0|0", "2|9614|0.0|0", "2|9650|0.0|0"]);
    const errs = []; pa.on("pageerror", e => errs.push(e.message));
    await pa.evaluate(() => openPlugin("Meldeanlage", "951")); await pa.waitForTimeout(700); await sent(pa);
    const arm = () => pa.locator("#pbody .ma-area .ma-arm").first(), pin = async v => { await pa.fill("#dinput", v); await pa.click("#dok"); await pa.waitForTimeout(250); };
    ok("Knopf zeigt „scharf schalten“, Quittung ohne Alarm nicht da", (await arm().textContent()).trim() === "scharf schalten" && await pa.locator("#pbody .ma-ack").count() === 0);
    await arm().click(); await pa.waitForTimeout(200);
    ok("erstes Bedienen: PIN festlegen", (await pa.textContent("#dtitle")).includes("PIN festlegen"));
    await pin("12"); ok("PIN braucht vier Ziffern", (await pa.textContent("#derr")).includes("vier Ziffern"));
    await pin("4711"); ok("PIN wird wiederholt abgefragt", (await pa.textContent("#dtitle")).includes("wiederholen"));
    await pin("4711"); let k = await sent(pa);
    ok("danach wird scharf geschaltet: 1 auf den Scharfschalt-Eingang", k.length === 1 && /^1\|9602\|1(\.0)?$/.test(k[0]), JSON.stringify(k));
    ok("gespeichert wird nur ein Hashwert, nicht die PIN", await pa.evaluate(() => { const v = Object.entries(localStorage).filter(([n]) => n.includes("mapin.")); return v.length === 1 && !v[0][1].includes("4711") && v[0][1].length > 30; }));
    await pa.evaluate(() => WSI.onmessage({ data: "1|9603|1.0|0" })); await pa.waitForTimeout(300);
    ok("bei scharfem Bereich heißt der Knopf „unscharf schalten“", (await arm().textContent()).trim() === "unscharf schalten");
    await arm().click(); await pa.waitForTimeout(200); await pin("0000"); k = await sent(pa);
    ok("falsche PIN sendet nichts und fragt erneut", k.length === 0 && (await pa.textContent("#dtext")).includes("PIN falsch"), JSON.stringify(k));
    await pin("4711"); k = await sent(pa);
    ok("richtige PIN schaltet unscharf: 0", k.length === 1 && /^1\|9602\|0(\.0)?$/.test(k[0]), JSON.stringify(k));
    await arm().click(); await pa.waitForTimeout(200); await pa.click("#dcancel"); await pa.waitForTimeout(200); k = await sent(pa);
    ok("Abbrechen sendet nichts", k.length === 0, JSON.stringify(k));
    await pa.evaluate(() => WSI.onmessage({ data: "1|9604|1.0|0" })); await pa.waitForTimeout(300);
    ok("bei Alarm erscheint die Quittung", await pa.locator("#pbody .ma-ack .ma-ackb").count() === 1);
    await pa.locator("#pbody .ma-ackb").click(); await pa.waitForTimeout(200); await pin("4711"); k = await sent(pa);
    ok("Quittieren sendet 1 auf das Quittungs-KO", k.length === 1 && /^1\|9625\|1(\.0)?$/.test(k[0]), JSON.stringify(k));
    await pa.evaluate(() => { PLUGS["951"].quad = "1"; PLUGS["951"].vis = "1"; }); await pa.selectOption("#uisel", "classic"); await pa.waitForTimeout(600);
    await pa.evaluate(() => clPlugin("951")); await pa.waitForTimeout(700);
    await pa.locator("#cl-q1b .ma-area .ma-arm").first().click(); await pa.waitForTimeout(200); await pin("4711"); k = await sent(pa);
    ok("Klassisch: Knopf in der Kachel schaltet nach PIN", k.length === 1 && /^1\|9602\|0(\.0)?$/.test(k[0]), JSON.stringify(k));
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pa.close(); }

  console.log("Meldeanlage/Alarmzentrale mit eigenen Symbolen, Anordnung wie im QuadClient (v0.9.55)");
  { const pi = await start(b, "Demo", ["2|9601|1.0|0", "2|9603|0.0|0", "2|9604|0.0|0", "2|9611|0.0|0", "2|9613|1.0|0", "2|9614|0.0|0", "2|9650|0.0|0", "2|9621|Anlage bereit|0", "2|9640|2.0|0"]);
    const errs = []; pi.on("pageerror", e => errs.push(e.message));
    await pi.evaluate(() => { PLUGS["951"].quad = "1"; PLUGS["951"].vis = "1"; }); await pi.selectOption("#uisel", "classic"); await pi.waitForTimeout(600);
    await pi.evaluate(() => clPlugin("951")); await pi.waitForTimeout(700);
    const q = pi.locator("#cl-q1b");
    ok("jede Kachel hat links unten ein Symbol", await q.locator(".cl-vt").count() === 6 && await q.locator(".cl-vt .ico svg").count() === 6);
    ok("Zustandsfeld rechts: Extern bereit (grün umrandet), Intern scharf (gefüllt)", await q.locator(".ma-area .ma-sq.ok").count() === 1 && await q.locator(".ma-area .ma-sq.on").count() === 1);
    ok("Symbol unten links, Zustandsfeld rechts in der Kachel, nichts ragt heraus", await q.locator(".ma-area").first().evaluate(t => { const r = t.getBoundingClientRect(), i = t.querySelector(".ico").getBoundingClientRect(), s = t.querySelector(".ma-sq").getBoundingClientRect(), c = t.querySelector(".cap").getBoundingClientRect();
      return i.left - r.left < 30 && i.top > c.bottom - 2 && r.right - s.right < 20 && s.left > i.right && s.top >= r.top && s.bottom <= r.bottom && i.bottom <= r.bottom + 1; }));
    ok("Zustandsfeld ist als Feld erkennbar: Rahmen, „scharf“ gefüllt", await q.locator(".ma-area .ma-sq.ok").evaluate(e => parseFloat(getComputedStyle(e).borderTopWidth) >= 1) && await q.locator(".ma-area .ma-sq.on").evaluate(e => /233, 165, 45/.test(getComputedStyle(e).backgroundColor)));
    ok("Zustand steht zusätzlich als Text da", (await q.locator(".ma-area .ma-stt").first().textContent()).trim() === "Scharfschaltbereit");
    await pi.evaluate(() => WSI.onmessage({ data: "1|9604|1.0|0" })); await pi.waitForTimeout(300);
    ok("Alarm: rotes Feld mit Warndreieck, Quittung mit eigenem Feld", await q.locator(".ma-area .ma-sq.al").count() === 1 && await q.locator(".ma-ack button.ma-sq").count() === 1);
    await q.locator('[data-pa="pg"][data-d="1"]').click(); await pi.waitForTimeout(200);
    ok("Überfall: Haltefeld mit Symbol", await q.locator(".ma-raid button.ma-hold.ma-sq svg").count() === 1);
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pi.close();
    const pj = await start(b, "Demo", ["2|9601|1.0|0"]); await pj.evaluate(() => openPlugin("Meldeanlage", "951")); await pj.waitForTimeout(700);
    ok("Modern: Symbol vor jedem Kacheltitel", await pj.locator("#pbody .pval .cap .ma-ci svg").count() >= 6, String(await pj.locator("#pbody .pval .cap .ma-ci svg").count())); await pj.close(); }

  console.log("Balkendiagramme klassisch wie im QuadClient (v0.9.52)");
  { const pb = await start(b, "Demo", ["2|9301|123.44|0", "2|9302|7.0|0", "2|9303|68.0|0"]); const errs = []; pb.on("pageerror", e => errs.push(e.message));
    await pb.evaluate(() => { PLUGS["906"].quad = "1"; PLUGS["906"].vis = "1"; }); await pb.selectOption("#uisel", "classic"); await pb.waitForTimeout(600);
    await pb.evaluate(() => clPlugin("906")); await pb.waitForTimeout(900);
    const q = pb.locator("#cl-q1b");
    ok("Raster aus den Einstellungen: Grid_1x3 = eine Spalte, drei Zeilen", await q.locator(".cl-vgrid").evaluate(e => getComputedStyle(e).gridTemplateColumns.trim().split(/\s+/).length === 1 && getComputedStyle(e).gridTemplateRows.trim().split(/\s+/).length === 3));
    ok("eine Reihe: Wert groß; zwei Reihen: Liste mit Beschriftung", (await q.locator(".cl-vt").count()) === 2 && (await q.locator(".cl-vt").nth(0).locator(".big").textContent()).replace(/\s+/g, " ").includes("123,4 l")
      && (await q.locator(".cl-vt.multi .row").count()) === 2 && (await q.locator(".cl-vt.multi").textContent()).replace(/\s+/g, " ").includes("Bezug68 kWh"), await q.textContent());
    ok("Blätterleiste vorhanden, bei einer Seite gesperrt", await q.locator(".cl-pgb button:disabled").count() === 2);
    await q.locator(".cl-vt").nth(0).click(); await pb.waitForTimeout(700);
    ok("Antippen öffnet das Diagramm, „Übersicht“ führt zurück", await q.locator("svg[data-bars]").count() === 1 && await q.locator('[data-pa="back"]').count() === 1);
    await q.locator('[data-pa="back"]').click(); await pb.waitForTimeout(300);
    ok("zurück in der Kachelübersicht", await q.locator(".cl-vt").count() === 2);
    ok("keine Seitenfehler", errs.length === 0, JSON.stringify(errs)); await pb.close(); }

  console.log("Menü: Gebäudestruktur anzeigen; Wertanzeige klassisch mit Blättern (v0.9.50)");
  { const pm = await start(b, "Demo");
    const r = await pm.evaluate(() => { const out = {};
      P_.menu.push({ id: "t1", page: "0", t1: "Räume", t2: "", ico: "", group: "0", cmds: [{ type: "1", hierarchic: "False" }] }, { id: "t2", page: "0", t1: "Haus", t2: "", ico: "", group: "0", cmds: [{ type: "1", hierarchic: "True" }] },
        { id: "t3", page: "0", t1: "Neu", t2: "", ico: "", group: "0", cmds: [{ type: "42", foo: "1" }] }, { id: "t4", page: "0", t1: "Leer", t2: "", ico: "", group: "0", cmds: [] });
      menuAct("t1"); out.flat = cur + ":" + viewData(cur).rooms.length + ":" + P_.floors.reduce((n, f) => n + f.rooms.length, 0);
      menuAct("t2"); out.hier = cur + ":" + viewData(cur).rooms.map(x => x.mv).join(",");
      menuAct("t3"); menuAct("t4"); out.log = document.getElementById("log").textContent; return out; });
    const [fc, fn, fa] = r.flat.split(":").slice(1);
    ok("Gebäudestruktur anzeigen: alle Räume in einer Liste", r.flat.startsWith("g:0:") && +fn > 3 && fn === fa, r.flat);
    ok("Strukturierte Liste: erst die Gebäudeteile", r.hier.startsWith("g:1:f:") && r.hier.split(",").length >= 2, r.hier);
    await pm.waitForTimeout(300); await pm.locator('#grid .mcard[data-mv^="f:"]').first().click(); await pm.waitForTimeout(300);
    ok("Gebäudeteil antippen öffnet dessen Räume", await pm.evaluate(() => cur.startsWith("f:") && document.querySelectorAll('#grid .mcard[data-mv^="r:"]').length > 0));
    ok("unbekannter Befehl und Menüpunkt ohne Befehl stehen im Protokoll", r.log.includes("Befehl Art 42 kann der Client noch nicht (foo)") && r.log.includes("„Leer“ hat im Projekt keinen Befehl"));
    const w = await pm.evaluate(() => { const T = PLUGIN_TYPES["1-2"], d = Array.from({ length: 8 }, (_, i) => ({ cap: "Kachel " + i, icon: "", vals: [{ t: "A", ko: "1", d: 0, u: "W", f: "" }, { t: "B", ko: "2", d: 0, u: "W", f: "" }] }));
      const n = h => (h.match(/class="cl-vt/g) || []).length, h0 = T.htmlClassic(d); T.act(d, { dataset: { pa: "pg", d: "1" } }); const h1 = T.htmlClassic(d); T.act(d, { dataset: { pa: "pg", d: "1" } }); T.htmlClassic(d);
      return [n(h0), n(h1), d.page, h0.includes("cl-pgb"), /repeat\(3,1fr\)/.test(h0), h1.includes("Kachel 6") && !h1.includes("Kachel 5")].join(","); });
    ok("Wertanzeige klassisch: 6 Kacheln je Seite in 3 festen Zeilen, Blättern bleibt in den Grenzen", w === "6,2,1,true,true,true", w); await pm.close(); }
  pg = await start(b, "Gast");
  ok("Gast sieht Gruppe-1-Einträge nicht", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 0);
  ok("Unterseite Extras sichtbar", await pg.locator("#grid .mcard", { hasText: "Extras" }).count() === 1);
  await pg.close(); await b.close();
  console.log(fails ? `\n${fails} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
  process.exit(fails ? 1 : 0);
})();
