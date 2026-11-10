// Beispielbilder für die README – nur mit der erfundenen Demo-Visu aus test/ (keine echte Anlage).
// Aufruf:  node test/screenshots.js      → docs/img/*.png
const { chromium } = require("playwright");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), T = f => fs.readFileSync(path.join(__dirname, f));
const OUT = path.join(ROOT, "docs", "img");
fs.mkdirSync(OUT, { recursive: true });

const FILES = { "client_project.xml": "demo_project.xml", "client_templates.xml": "demo_templates.xml", "client_language.xml": "demo_language.xml",
  "quad_plugin.xml": "demo_plugin.xml", "1-2_900.xml": "demo_1-2_900.xml", "1-25_902.xml": "demo_1-25_902.xml", "0-7_903.xml": "demo_0-7_903.xml",
  "0-4_904.xml": "demo_0-4_904.xml", "0-3_905.xml": "demo_0-3_905.xml", "1-16_906.xml": "demo_1-16_906.xml", "0-2_901.xml": "demo_0-2_901.xml" };

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
    const f = FILES[n]; let body = f ? T(f).toString() : "";
    // Plugins in die Quadranten der klassischen Ansicht legen (oben Klima + Verbrauch, unten Zähler + Musik)
    if (n === "quad_plugin.xml") body = body.replace(/title="(Klima|Verbrauch)"/g, '$& quad_3="1"').replace(/title="(Zähler|Musik)"/g, '$& quad_3="2"');
    r.fulfill({ status: f ? 200 : 404, body });
  });
  await pg.route(/^http:\/\/(?!hs\.test)/, r => r.abort());
  await pg.addInitScript(ui => {
    try { localStorage.setItem("hsc.ui", JSON.stringify(ui)); } catch (e) {}
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
    [["9001", "4821"], ["9002", "6375.42"], ["9003", "3904"]].forEach(([k, v]) => WSI.onmessage({ data: `1|${k}|${v}|0` })); });
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
  await pg.close();
  await b.close();
  console.log("Bilder in docs/img/");
})();
