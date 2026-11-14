# QC-Client - Android-Huelle bauen: android\build\QC-Client-<Version>.apk
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Braucht nur ein JDK (17 oder neuer) und aus dem Android SDK "build-tools" und eine "platform"
# (kein Gradle, kein Android Studio). Einrichten: android\setup-tools.ps1
# Gesucht wird in %LOCALAPPDATA%\QC-Client-Android, sonst JAVA_HOME bzw. ANDROID_HOME.
#
# Der Signaturschluessel entsteht beim ersten Bau in %LOCALAPPDATA%\QC-Client-Android
# (ausserhalb des Repos). Aufheben: Updates lassen sich nur mit demselben Schluessel
# ueber die vorhandene App installieren.
#
# Hinweis: Datei rein ASCII halten (PowerShell 5.1 liest Skripte ohne BOM als ANSI).
param(
    [string]$ToolsDir = "$env:LOCALAPPDATA\QC-Client-Android",
    [int]$ShellRev = 1,          # Stand der Huelle, erhoehen bei Aenderungen an android\ (siehe android\CHANGELOG.md)
    [switch]$Debuggable          # debuggable: WebView laesst sich ueber chrome://inspect ansehen
)
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $here

function Check($what) { if ($LASTEXITCODE -ne 0) { throw "$what fehlgeschlagen (Code $LASTEXITCODE)" } }

# ---- Werkzeuge finden ----
$jdk = $null
$j = Get-ChildItem (Join-Path $ToolsDir 'jdk') -Recurse -Filter javac.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if ($j) { $jdk = Split-Path -Parent (Split-Path -Parent $j.FullName) }
elseif ($env:JAVA_HOME -and (Test-Path "$env:JAVA_HOME\bin\javac.exe")) { $jdk = $env:JAVA_HOME }
if (-not $jdk) { throw 'Kein JDK gefunden. Erst android\setup-tools.ps1 ausfuehren oder JAVA_HOME setzen.' }

$sdk = $null
foreach ($c in @((Join-Path $ToolsDir 'sdk'), $env:ANDROID_HOME, $env:ANDROID_SDK_ROOT, "$env:LOCALAPPDATA\Android\Sdk")) {
    if ($c -and (Test-Path (Join-Path $c 'build-tools'))) { $sdk = $c; break }
}
if (-not $sdk) { throw 'Kein Android SDK gefunden. Erst android\setup-tools.ps1 ausfuehren oder ANDROID_HOME setzen.' }
$bt = Get-ChildItem (Join-Path $sdk 'build-tools') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'aapt2.exe') } | Sort-Object { [version]($_.Name -replace '[^0-9.].*$', '') } | Select-Object -Last 1
$plat = Get-ChildItem (Join-Path $sdk 'platforms') -Directory | Where-Object { Test-Path (Join-Path $_.FullName 'android.jar') } | Sort-Object { [int]($_.Name -replace '\D', '') } | Select-Object -Last 1
if (-not $bt -or -not $plat) { throw 'Im Android SDK fehlen build-tools oder platforms.' }
$bt = $bt.FullName
$androidJar = Join-Path $plat.FullName 'android.jar'
$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"

# ---- Version aus qc.html ----
$qc = Join-Path $repo 'qc.html'
$m = Select-String -Path $qc -Pattern 'const VERSION = "(\d+)\.(\d+)\.(\d+)"' | Select-Object -First 1
if (-not $m) { throw 'VERSION in qc.html nicht gefunden.' }
$g = $m.Matches[0].Groups
$verName = "$($g[1].Value).$($g[2].Value).$($g[3].Value)-a$ShellRev"
$verCode = [int]$g[1].Value * 1000000 + [int]$g[2].Value * 10000 + [int]$g[3].Value * 100 + $ShellRev
Write-Host "QC-Client $verName (Code $verCode) - JDK: $jdk - build-tools: $(Split-Path -Leaf $bt) - $($plat.Name)"

# ---- Bauen ----
$out = Join-Path $here 'build'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Force "$out\assets", "$out\classes", "$out\dex" | Out-Null
Copy-Item $qc "$out\assets\qc.html"

& "$bt\aapt2.exe" compile --dir "$here\res" -o "$out\res.zip"; Check 'aapt2 compile'
$link = @('link', '-o', "$out\base.apk", '-I', $androidJar, '--manifest', "$here\AndroidManifest.xml",
          '-A', "$out\assets", '--version-code', "$verCode", '--version-name', $verName)
if ($Debuggable) { $link += '--debug-mode' }
& "$bt\aapt2.exe" @link "$out\res.zip"; Check 'aapt2 link'

$src = Get-ChildItem "$here\src" -Recurse -Filter *.java | ForEach-Object { $_.FullName }
& "$jdk\bin\javac.exe" -encoding UTF-8 --release 8 -Xlint:-options -classpath $androidJar -d "$out\classes" $src; Check 'javac'

$classes = Get-ChildItem "$out\classes" -Recurse -Filter *.class | ForEach-Object { $_.FullName }
& "$bt\d8.bat" --release --lib $androidJar --min-api 26 --output "$out\dex" $classes; Check 'd8'

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [IO.Compression.ZipFile]::Open("$out\base.apk", 'Update')
try { [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, "$out\dex\classes.dex", 'classes.dex') | Out-Null } finally { $zip.Dispose() }

& "$bt\zipalign.exe" -f -p 4 "$out\base.apk" "$out\aligned.apk"; Check 'zipalign'

# ---- Signieren ----
New-Item -ItemType Directory -Force $ToolsDir | Out-Null
$ks = Join-Path $ToolsDir 'qc-client.keystore'
$pwFile = Join-Path $ToolsDir 'qc-client.keystore.pass'
if (-not (Test-Path $ks)) {
    $pw = -join ((1..24) | ForEach-Object { 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[(Get-Random -Maximum 55)] })
    [IO.File]::WriteAllText($pwFile, $pw)
    & "$jdk\bin\keytool.exe" -genkeypair -keystore $ks -storetype PKCS12 -alias qc -keyalg RSA -keysize 2048 -validity 10000 -storepass:file $pwFile -dname 'CN=QC-Client'; Check 'keytool'
    Write-Host "Neuer Signaturschluessel: $ks (aufheben!)"
}
$apk = Join-Path $out "QC-Client-$verName.apk"
& "$bt\apksigner.bat" sign --ks $ks --ks-key-alias qc --ks-pass "file:$pwFile" --out $apk "$out\aligned.apk"; Check 'apksigner sign'
& "$bt\apksigner.bat" verify --min-sdk-version 26 $apk; Check 'apksigner verify'
Remove-Item "$out\base.apk", "$out\aligned.apk", "$out\res.zip", "$apk.idsig" -ErrorAction SilentlyContinue

Write-Host "Fertig: $apk ($([math]::Round((Get-Item $apk).Length / 1KB)) KB)"
