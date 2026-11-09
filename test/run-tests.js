// Browser-Tests für qc.html gegen einen nachgebauten HomeServer (Demo-Visu, keine echte Anlage).
// Aufruf:  node test/run-tests.js      (benötigt: npm i playwright  &&  npx playwright install chromium)
// Die erwarteten Befehle stammen aus Mitschnitten des Original-QuadClients (siehe docs/protokoll.md).
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), T = f => fs.readFileSync(path.join(__dirname, f));
const UHR = "2000000001";
let fails = 0;
const ok = (name, cond, info = "") => { console.log((cond ? "  ✓ " : "  ✗ ") + name + (cond ? "" : "  → " + info)); if (!cond) fails++; };

async function start(b, user, extra = []) {
  const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
  await pg.route("https://hs.test/**", r => {
    const u = r.request().url(), n = u.split("/").pop().split("?")[0];
    if (n === "qc.html") return r.fulfill({ status: 200, contentType: "text/html", body: T("../qc.html") });
    if (n === "seite.html") return r.fulfill({ status: 200, contentType: "text/html", body: '<body style="margin:0"><div style="position:absolute;top:300px;height:200px;width:200px">fest positioniert</div></body>' });
    const f = { "client_project.xml": "demo_project.xml", "client_templates.xml": "demo_templates.xml", "client_language.xml": "demo_language.xml" }[n];
    if (n === "client_templates.xml" && !u.includes("/design_4/")) return r.fulfill({ status: 403, body: "" });
    let body = f ? T(f).toString() : ""; if (n === "client_project.xml") body = body.replace("https://example.org/", "https://hs.test/seite.html");
    r.fulfill({ status: f ? 200 : 404, body, headers: { "access-control-allow-origin": "*" } });
  });
  await pg.addInitScript(([uhr, extra]) => {
    window.SENT = [];
    window.WebSocket = class {
      constructor() { this.readyState = 1; const me = this; window.WSI = me;
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
  pg = await start(b, "Demo", [`2|${pin}|1234|1`, `2|${val}|20.0|0`, `2|${mu}|1.0|0`]);

  console.log("Menü");
  ok("Startseite ist das Menü", (await pg.textContent("#title")) === "Menü");
  ok("Eintrag nur für Gruppe 1 sichtbar (Garten)", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 1);
  await pg.click('#grid .mcard:has-text("Erdgeschoss")'); ok("Etage zeigt Räume", await pg.locator("#grid .mcard").count() === 4);
  await pg.click('nav button[data-v="m:0"]'); await pg.click('#grid .mcard:has-text("Wetter")'); await pg.waitForTimeout(600);
  ok("Webseite eingebettet, Höhe an Inhalt (fest positioniert)", parseInt(await pg.evaluate(() => getComputedStyle(fifr).height)) >= 500 && parseInt(await pg.evaluate(() => getComputedStyle(fifr).height)) < 560);
  ok("Adresse nicht angezeigt", !(await pg.textContent("#frame .fbar")).includes("http"));

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
  await pg.fill("#dinput", "1234"); await pg.click("#dok"); let s = await sent(pg); ok("richtige PIN schaltet", s[0] === `1|${sw}|1`, JSON.stringify(s));
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
  await pg.close();
  console.log("Rechte");
  pg = await start(b, "Gast");
  ok("Gast sieht Gruppe-1-Einträge nicht", await pg.locator("#grid .mcard", { hasText: "Garten" }).count() === 0);
  ok("Unterseite Extras sichtbar", await pg.locator("#grid .mcard", { hasText: "Extras" }).count() === 1);
  await pg.close(); await b.close();
  console.log(fails ? `\n${fails} Test(s) fehlgeschlagen` : "\nAlle Tests bestanden");
  process.exit(fails ? 1 : 0);
})();
