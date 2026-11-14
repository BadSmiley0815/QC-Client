/* QC-Client – Android-Hülle · https://github.com/BadSmiley0815/QC-Client
   Copyright (C) 2026 BadSmiley0815 · SPDX-License-Identifier: GPL-3.0-or-later

   Zeigt qc.html in einem WebView. Die Seite liegt in der App (assets/qc.html) und wird unter der
   Herkunft des HomeServers ausgeliefert (https://<HS>/qc-app/qc.html, per shouldInterceptRequest):
   Alle Abrufe an den HS sind damit „gleiche Herkunft“, CORS spielt keine Rolle.
   Das (meist selbst erstellte) Zertifikat des HS bestätigt man einmal; die App merkt sich den
   SHA-256-Fingerabdruck und lässt danach nur genau dieses Zertifikat zu. */
package io.github.badsmiley0815.qcclient;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.net.http.SslCertificate;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.io.IOException;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends Activity {
    static final String ACTION_SETUP = "io.github.badsmiley0815.qcclient.SETUP";
    static final String APP_PATH = "/qc-app/qc.html";
    static final String K_ADDR = "addr", K_PIN = "pin.";
    static final int BG = 0xFF141716, INK = 0xFFE9ECE9;
    static final int PROBE = 1, APP = 2;

    SharedPreferences prefs;
    WebView web;
    LinearLayout overlay;
    TextView msg;
    Button bRetry, bAnyway, bAddr;

    volatile String host;        // nur der Name bzw. die IP
    volatile String authority;   // host[:port]
    volatile String startUrl;
    volatile boolean bundled;    // true: Seite aus der App, false: Seite vom HomeServer
    int phase;
    String probeError;
    boolean sslDenied;

    /* Zertifikatsfehler, die auf die Antwort im Dialog warten */
    final List<SslErrorHandler> sslWait = new ArrayList<SslErrorHandler>();
    final List<String> sslWaitFp = new ArrayList<String>();
    boolean sslDialog;

    GeolocationPermissions.Callback geoCb;
    String geoOrigin;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        prefs = getSharedPreferences("qc", MODE_PRIVATE);
        buildUi();
        if (ACTION_SETUP.equals(getIntent().getAction())) askAddress(); else start();
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        if (ACTION_SETUP.equals(i.getAction())) askAddress();
    }

    @Override protected void onResume() { super.onResume(); web.onResume(); }
    @Override protected void onPause() { web.onPause(); super.onPause(); }
    @Override protected void onDestroy() { web.destroy(); super.onDestroy(); }

    @Override
    public void onBackPressed() {
        if (overlay.getVisibility() != View.VISIBLE && web.canGoBack()) web.goBack();
        else moveTaskToBack(true);
    }

    /* ---------------- Oberfläche ---------------- */
    int dp(int v) { return Math.round(v * getResources().getDisplayMetrics().density); }

    Button button(String text, View.OnClickListener l) {
        Button b = new Button(this);
        b.setText(text); b.setAllCaps(false); b.setOnClickListener(l);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(240), ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(10);
        overlay.addView(b, lp);
        return b;
    }

    void buildUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        root.setFitsSystemWindows(true);

        web = new WebView(this);
        web.setBackgroundColor(BG);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        overlay = new LinearLayout(this);
        overlay.setOrientation(LinearLayout.VERTICAL);
        overlay.setGravity(Gravity.CENTER);
        overlay.setBackgroundColor(BG);
        overlay.setPadding(dp(24), dp(24), dp(24), dp(24));
        overlay.setClickable(true);
        msg = new TextView(this);
        msg.setTextColor(INK); msg.setTextSize(16); msg.setGravity(Gravity.CENTER);
        overlay.addView(msg, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        bRetry = button("Erneut versuchen", new View.OnClickListener() { public void onClick(View v) { start(); } });
        bAnyway = button("Trotzdem öffnen", new View.OnClickListener() { public void onClick(View v) { openApp(); } });
        bAddr = button("Adresse ändern", new View.OnClickListener() { public void onClick(View v) { askAddress(); } });
        root.addView(overlay, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage: Anmeldung, Ansicht, Zwischenspeicher
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);   // Kamerabilder per http
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(false);           // target=_blank läuft über shouldOverrideUrlLoading
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " QC-Client-Android");
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) WebView.setWebContentsDebuggingEnabled(true);
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
    }

    void showOverlay(String text, boolean buttons, boolean anyway) {
        msg.setText(text);
        bRetry.setVisibility(buttons ? View.VISIBLE : View.GONE);
        bAddr.setVisibility(buttons ? View.VISIBLE : View.GONE);
        bAnyway.setVisibility(buttons && anyway ? View.VISIBLE : View.GONE);
        overlay.setVisibility(View.VISIBLE);
    }

    /* ---------------- Adresse ---------------- */
    /* „192.168.1.10“ oder „hs.example:8443“ -> Seite aus der App;
       „https://<HS>/opt/hs-client/qc.html“ -> Seite vom HomeServer. Immer https. */
    boolean parse(String addr) {
        String a = addr == null ? "" : addr.trim();
        if (a.isEmpty()) return false;
        if (!a.contains("://")) a = "https://" + a;
        Uri u = Uri.parse(a);
        String h = u.getHost(), au = u.getEncodedAuthority();
        if (h == null || h.isEmpty() || au == null || au.contains("@")) return false;
        String path = u.getEncodedPath();
        host = h; authority = au;
        bundled = path == null || path.isEmpty() || path.equals("/");
        startUrl = "https://" + au + (bundled ? APP_PATH : path + (u.getEncodedQuery() != null ? "?" + u.getEncodedQuery() : ""));
        return true;
    }

    void askAddress() {
        final EditText in = new EditText(this);
        in.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        in.setHint("z. B. 192.168.1.10");
        in.setText(prefs.getString(K_ADDR, ""));
        in.setSingleLine(true);
        FrameLayout box = new FrameLayout(this);
        box.setPadding(dp(20), dp(4), dp(20), 0);
        box.addView(in);
        new AlertDialog.Builder(this)
            .setTitle("Adresse des HomeServers")
            .setMessage("IP-Adresse oder Name genügt – der QC-Client steckt in der App.\n\n"
                + "Wer die Seite lieber vom HomeServer lädt, gibt die ganze Adresse an, "
                + "z. B. https://…/opt/hs-client/qc.html.")
            .setView(box)
            .setCancelable(false)
            .setPositiveButton("OK", (d, w) -> {
                String a = in.getText().toString().trim();
                if (!parse(a)) { askAddress(); return; }
                prefs.edit().putString(K_ADDR, a).apply();
                start();
            })
            .setNegativeButton("Abbrechen", (d, w) -> {
                if (prefs.getString(K_ADDR, null) == null) finish();
            })
            .show();
    }

    /* ---------------- Start ---------------- */
    void start() {
        if (!parse(prefs.getString(K_ADDR, null))) { askAddress(); return; }
        showOverlay("Verbinde mit " + authority + " …", false, false);
        probeError = null; sslDenied = false;
        if (bundled) {
            /* Erst ein echter Abruf beim HS: Dabei meldet der WebView das Zertifikat. Die Zustimmung gilt
               danach für alle Verbindungen zu diesem Server mit diesem Zertifikat, auch für den WebSocket. */
            phase = PROBE;
            web.loadUrl("https://" + authority + "/?probe=" + System.currentTimeMillis());
        } else openApp();
    }

    void openApp() {
        showOverlay("Lade QC-Client …", false, false);
        probeError = null;
        phase = APP;
        web.loadUrl(startUrl);
    }

    boolean sameHost(Uri u) {
        String h = u.getHost(), sc = u.getScheme();
        return h != null && h.equalsIgnoreCase(host) && ("https".equals(sc) || "http".equals(sc));
    }

    /* ---------------- Zertifikat ---------------- */
    static String fingerprint(SslCertificate c) {
        try {
            byte[] der = null;
            if (Build.VERSION.SDK_INT >= 29 && c.getX509Certificate() != null) der = c.getX509Certificate().getEncoded();
            if (der == null) { Bundle b = SslCertificate.saveState(c); if (b != null) der = b.getByteArray("x509-certificate"); }
            if (der == null) return null;
            byte[] h = MessageDigest.getInstance("SHA-256").digest(der);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < h.length; i++) { if (i > 0) sb.append(i % 8 == 0 ? '\n' : ':'); sb.append(String.format("%02X", h[i])); }
            return sb.toString();
        } catch (Exception e) { return null; }
    }

    void sslAnswer(String fp, boolean trust) {
        for (int i = 0; i < sslWait.size(); i++) {
            if (trust && fp.equals(sslWaitFp.get(i))) sslWait.get(i).proceed(); else sslWait.get(i).cancel();
        }
        sslWait.clear(); sslWaitFp.clear(); sslDialog = false;
    }

    void onSsl(SslErrorHandler h, SslError e) {
        Uri u = Uri.parse(e.getUrl());
        String hs = u.getHost();
        final String fp = fingerprint(e.getCertificate());
        if (fp == null || hs == null || host == null || !hs.equalsIgnoreCase(host)) { h.cancel(); return; }   // fremde Server: nie
        final String key = K_PIN + host.toLowerCase();
        String pin = prefs.getString(key, null);
        if (fp.equals(pin)) { h.proceed(); return; }
        sslWait.add(h); sslWaitFp.add(fp);
        if (sslDialog) return;
        sslDialog = true;
        String text = pin == null
            ? "Der HomeServer " + host + " weist sich mit einem Zertifikat aus, das Android nicht prüfen kann. "
              + "Bei einem selbst erstellten Zertifikat ist das normal.\n\nFingerabdruck (SHA-256):\n" + fp
              + "\n\nNur bestätigen, wenn du im eigenen Netz bist. Die App lässt danach nur genau dieses Zertifikat zu."
            : "Achtung: Der HomeServer " + host + " zeigt ein anderes Zertifikat als bisher.\n\nNeu:\n" + fp
              + "\n\nBisher:\n" + pin + "\n\nNach einem Firmware-Update oder einem neuen Zertifikat ist das normal. "
              + "Im Zweifel abbrechen.";
        new AlertDialog.Builder(this)
            .setTitle(pin == null ? "Zertifikat des HomeServers" : "Zertifikat hat sich geändert")
            .setMessage(text)
            .setCancelable(false)
            .setPositiveButton("Vertrauen", (d, w) -> { prefs.edit().putString(key, fp).apply(); sslAnswer(fp, true); })
            .setNegativeButton("Abbrechen", (d, w) -> { sslDenied = true; sslAnswer(fp, false); })
            .show();
    }

    /* ---------------- WebView ---------------- */
    class Client extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
            Uri u = r.getUrl();
            String au = authority;
            if (bundled && r.isForMainFrame() && au != null && "https".equals(u.getScheme())
                    && au.equalsIgnoreCase(u.getEncodedAuthority()) && APP_PATH.equals(u.getPath())) {
                try { return new WebResourceResponse("text/html", "utf-8", getAssets().open("qc.html")); }
                catch (IOException e) { return null; }
            }
            return null;
        }

        @Override
        public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
            if (!r.isForMainFrame()) return false;              // eingebettete Seiten bleiben eingebettet
            Uri u = r.getUrl();
            if (sameHost(u)) return false;
            if (phase == APP) {                                 // fremde Seiten (z. B. open-meteo.com) im Browser öffnen
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (ActivityNotFoundException e) { /* keine passende App */ }
            }
            return true;
        }

        @Override
        public void onReceivedSslError(WebView v, SslErrorHandler h, SslError e) { onSsl(h, e); }

        @Override
        public void onPageStarted(WebView v, String url, Bitmap icon) { if (phase == APP) probeError = null; }

        @Override
        public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
            if (r.isForMainFrame()) probeError = String.valueOf(e.getDescription());
        }

        @Override
        public void onPageFinished(WebView v, String url) {
            if (phase == PROBE) {
                if (probeError == null) { openApp(); return; }
                phase = 0;
                showOverlay(sslDenied ? "Zertifikat nicht bestätigt – ohne das kommt keine Verbindung zum HomeServer zustande."
                    : "HomeServer " + authority + " nicht erreichbar.\n(" + probeError + ")\n\nWLAN an? Adresse richtig?", true, !sslDenied);
            } else if (phase == APP) {
                if (probeError != null) {
                    showOverlay("Seite konnte nicht geladen werden.\n(" + probeError + ")", true, false);
                    return;
                }
                web.clearHistory();                             // die Probe-Seite soll nicht über „Zurück“ erreichbar sein
                overlay.setVisibility(View.GONE);
            }
        }
    }

    class Chrome extends WebChromeClient {
        @Override
        public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
            if (checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) { cb.invoke(origin, true, false); return; }
            geoCb = cb; geoOrigin = origin;
            requestPermissions(new String[] { Manifest.permission.ACCESS_COARSE_LOCATION }, 1);
        }
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        if (code != 1 || geoCb == null) return;
        geoCb.invoke(geoOrigin, res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED, false);
        geoCb = null;
    }
}
