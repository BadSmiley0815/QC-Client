// Beispielbilder für die README – nur mit der erfundenen Demo-Visu aus test/ (keine echte Anlage).
// Aufruf:  node test/screenshots.js      → docs/img/*.png
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), T = f => fs.readFileSync(path.join(__dirname, f));
const OUT = path.join(ROOT, "docs", "img");
fs.mkdirSync(OUT, { recursive: true });

const FILES = { "client_project.xml": "demo_project.xml", "client_templates.xml": "demo_templates.xml", "client_language.xml": "demo_language.xml",
  "quad_plugin.xml": "demo_plugin.xml", "1-2_900.xml": "demo_1-2_900.xml", "1-25_902.xml": "demo_1-25_902.xml", "0-7_903.xml": "demo_0-7_903.xml",
  "0-4_904.xml": "demo_0-4_904.xml", "0-3_905.xml": "demo_0-3_905.xml", "1-16_906.xml": "demo_1-16_906.xml", "0-2_901.xml": "demo_0-2_901.xml", "1-3_907.xml": "demo_1-3_907.xml", "1-2_908.xml": "demo_1-2_908.xml",
  "public_templates.xml": "demo_public_templates.xml", "public_language.xml": "demo_public_language.xml" };

// gleichmäßige, glaubwürdige Verläufe für die Diagramme
function arch(q) {
  const n = +q[3], id = +q[0], rows = [];
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2, hum = Math.floor(id / 100) === 6;
    const v = hum ? 52 + 6 * Math.sin(t * 3 - 1) + Math.sin(t * 11) : 21 + 1.5 * Math.sin(t * 3) + 0.4 * Math.sin(t * 17);
    rows.push(`<row count="1" sum="${v.toFixed(2)}" min="${(v - 0.6).toFixed(2)}" max="${(v + 0.6).toFixed(2)}"/>`);
  }
  return `<arch>${rows.join("")}</arch>`;
}

async function open(b, ui) {
  const pg = await b.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 2, colorScheme: "light" });
  await pg.route("https://hs.test/**", r => {
    const u = r.request().url(), n = u.split("/").pop().split("?")[0];
    if (n === "qc.html") return r.fulfill({ status: 200, contentType: "text/html", body: T("../qc.html") });
    if (u.includes("/quad/arch/")) return r.fulfill({ status: 200, contentType: "text/xml", body: arch(u.split("/quad/arch/")[1].split("?")[0].split("/")) });
    if (n === "client_design.xml") return r.fulfill({ status: 200, contentType: "text/xml", body: T("demo_design.xml") });
    if (n === "client_icons.xaml.zip") return r.fulfill({ status: u.includes("/quad/client/design_0/") ? 200 : 404, contentType: "application/zip", body: T("demo_icons.xaml.zip") });
    if (n === "client_templates.xml" && !u.includes("/design_4/")) return r.fulfill({ status: 403, body: "" });
    if (/public_(templates|language)\.xml$/.test(n) && !/\/quad\/public\/(design_4\/public_templates|public_language)/.test(u)) return r.fulfill({ status: 404, body: "" });
    const f = FILES[n]; let body = f ? T(f).toString() : "";
    // Plugins in die Quadranten der klassischen Ansicht legen (oben Klima + Verbrauch, unten Zähler + Musik)
    if (n === "quad_plugin.xml") body = body.replace(/title="(Klima|Verbrauch)"/g, '$& quad_3="1"').replace(/title="(Zähler|Musik|Wetter)"/g, '$& quad_3="2"');
    r.fulfill({ status: f ? 200 : 404, body });
  });
  await pg.route(/^http:\/\/(?!hs\.test)/, r => r.abort());
  await pg.route("https://api.open-meteo.com/**", r => { const t = new Date(), D = i => { const x = new Date(t); x.setDate(t.getDate() + i); return x.toISOString().slice(0, 10); };
    r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({
      current: { temperature_2m: 5.2, relative_humidity_2m: 80, weather_code: 2, wind_speed_10m: 12, wind_direction_10m: 90, precipitation: 0, is_day: 1 },
      daily: { time: [0, 1, 2, 3, 4, 5, 6].map(D), weather_code: [2, 3, 61, 71, 95, 45, 0], temperature_2m_max: [8, 8, 9, 4, 6, 7, 10], temperature_2m_min: [-3, -2, 4, 0, 1, 2, 3],
        precipitation_sum: [0, 2, 5, 1, 0, 0, 0], precipitation_probability_max: [0, 66, 100, 40, 10, 5, 0], wind_speed_10m_max: [15, 15, 23, 10, 8, 9, 7], wind_direction_10m_dominant: [90, 180, 250, 0, 45, 300, 200] } }) }); });
  await pg.addInitScript(ui => {
    try { localStorage.setItem("hsc.ui", JSON.stringify(ui)); localStorage.setItem("hsc.wx.hs.test.907", JSON.stringify({ name: "Musterstadt", lat: 49.45, lon: 11.08 })); } catch (e) {}
    window.WebSocket = class {
      constructor() { this.readyState = 1; const me = this; window.WSI = me;
        setTimeout(() => { me.onmessage({ data: "93|SID|PROJ" }); me.onmessage({ data: "10|2000000001|0|0|0" }); me.onmessage({ data: "95||" }); }, 20); }
      send(s) { const p = s.split("|"), me = this; if (p[0] === "1") setTimeout(() => me.onmessage({ data: `1|${p[1]}|${p[2]}|0` }), 20); }
      close() {} };
  }, ui);
  await pg.goto("https://hs.test/opt/hs-client/qc.html");
  await pg.fill("#lhost", "hs.test"); await pg.fill("#luser", "Demo"); await pg.fill("#lpass", "x"); await pg.click("button[type=submit]");
  await pg.waitForTimeout(1500);
  // ein paar Startwerte, damit die Visu nicht leer aussieht
  await pg.evaluate(() => { let i = 0;
    for (const e of Object.values(P_.els)) for (const [slot, ko] of Object.entries(e.kos || {})) {
      if (!ko) continue; i++;
      const v = /pin/i.test(slot) ? 1234 : /temp|soll|value|val/i.test(slot) ? 20 + (i % 5) : i % 3 === 0 ? 1 : 0;
      WSI.onmessage({ data: `1|${ko}|${v}|0` }); }
    [["9001", "4821"], ["9002", "6375.42"], ["9003", "3904"], ["9401", "3.4"], ["9402", "71"], ["9403", "7.5"], ["9404", "270"], ["9405", "0"]].forEach(([k, v]) => WSI.onmessage({ data: `1|${k}|${v}|0` })); });
  await pg.waitForTimeout(500);
  return pg;
}

(async () => {
  const b = await chromium.launch();
  let pg = await open(b, "modern");
  await pg.locator("nav >> text=Wohnen, #nav >> text=Wohnen").first().click().catch(() => pg.locator("text=Wohnen").nth(1).click());
  await pg.waitForTimeout(800);
  await pg.screenshot({ path: path.join(OUT, "modern.png") });
  await pg.close();

  pg = await open(b, "modern");
  await pg.locator("text=Klima").first().click(); await pg.waitForTimeout(1500);
  await pg.evaluate(() => { const e = document.getElementById("pbody"); (e && e.closest("section, .plug, div") || e).scrollIntoView({ block: "end" }); }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, "plugins.png") });
  await pg.close();

  pg = await open(b, "classic");
  await pg.click('#cl-left .cl-mt:has-text("Wohnen")'); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: path.join(OUT, "klassisch.png") });
  // Popup aus der Vorlage (erfundene Vorlage 99-7 mit PIN): Zeile antippen, PIN, Popup
  await pg.locator('#cl-left .cl-row:has-text("Lamellen") .cl-p[data-pos="1"] .cl-z').first().click(); await pg.waitForTimeout(300);
  await pg.fill("#dinput", "1234"); await pg.press("#dinput", "Enter"); await pg.waitForTimeout(700);
  await pg.screenshot({ path: path.join(OUT, "klassisch_popup.png") });
  await pg.close();
  pg = await open(b, "classic"); await pg.waitForTimeout(500);
  await pg.screenshot({ path: path.join(OUT, "klassisch_menue.png") });
  await pg.evaluate(() => clSetStyle("gira")); await pg.click('#cl-left .cl-mt:has-text("Wohnen")'); await pg.waitForTimeout(1200);
  await pg.screenshot({ path: path.join(OUT, "klassisch_gira.png") });
  await pg.evaluate(() => clSetStyle("modern"));
  await pg.close();

  pg = await open(b, "classic");
  await pg.click('#cl-q2c .cl-tab:has-text("Wetter")'); await pg.waitForTimeout(1200);
  await pg.screenshot({ path: path.join(OUT, "klassisch_wetter.png") });
  await pg.close();
  pg = await open(b, "modern");
  await pg.evaluate(() => openPlugin("Wetter", "907")); await pg.waitForTimeout(1200);
  await pg.evaluate(() => document.getElementById("plug").scrollIntoView({ block: "start" })); await pg.waitForTimeout(300);
  await pg.screenshot({ path: path.join(OUT, "wetter.png") });
  await pg.close();
  await b.close();
  console.log("Bilder in docs/img/");
})();
