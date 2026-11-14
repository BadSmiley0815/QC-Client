# QC-Client - Android-Huelle: Bauwerkzeuge einrichten (einmalig)
# SPDX-License-Identifier: GPL-3.0-or-later
#
# Laedt nach %LOCALAPPDATA%\QC-Client-Android (nichts systemweit, kein Eintrag im PATH):
#   jdk\  Eclipse Temurin JDK 17 (ZIP, ca. 190 MB)          Quelle: api.adoptium.net / github.com/adoptium
#   sdk\  Android-Kommandozeilenwerkzeuge (ZIP, ca. 150 MB)  Quelle: dl.google.com
#         + platforms;android-34 und build-tools;34.0.0 ueber sdkmanager (zusammen ca. 130 MB)
# Der sdkmanager zeigt die Android-SDK-Lizenz und fragt nach Zustimmung.
# Mit -AcceptLicenses wird die Frage automatisch mit "y" beantwortet.
#
# Hinweis: Datei rein ASCII halten (PowerShell 5.1 liest Skripte ohne BOM als ANSI).
param(
    [string]$ToolsDir = "$env:LOCALAPPDATA\QC-Client-Android",
    [string]$CmdlineTools = "commandlinetools-win-15859902_latest.zip",
    [switch]$AcceptLicenses
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.IO.Compression.FileSystem

New-Item -ItemType Directory -Force $ToolsDir | Out-Null
$tmp = Join-Path $ToolsDir 'download'
New-Item -ItemType Directory -Force $tmp | Out-Null

# ---- JDK 17 ----
$jdkRoot = Join-Path $ToolsDir 'jdk'
$javac = Get-ChildItem $jdkRoot -Recurse -Filter javac.exe -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $javac) {
    Write-Host 'Lade JDK 17 (Temurin) ...'
    $meta = Invoke-RestMethod 'https://api.adoptium.net/v3/assets/latest/17/hotspot?os=windows&architecture=x64&image_type=jdk'
    $pkg = $meta[0].binary.package
    $zip = Join-Path $tmp $pkg.name
    Invoke-WebRequest $pkg.link -OutFile $zip -UseBasicParsing
    $sum = (Get-FileHash $zip -Algorithm SHA256).Hash.ToLower()
    if ($sum -ne $pkg.checksum) { throw "JDK: Pruefsumme stimmt nicht ($sum)" }
    New-Item -ItemType Directory -Force $jdkRoot | Out-Null
    [IO.Compression.ZipFile]::ExtractToDirectory($zip, $jdkRoot)
    Remove-Item $zip
    $javac = Get-ChildItem $jdkRoot -Recurse -Filter javac.exe | Select-Object -First 1
}
$jdk = Split-Path -Parent (Split-Path -Parent $javac.FullName)
Write-Host "JDK: $jdk"

# ---- Android SDK ----
$sdk = Join-Path $ToolsDir 'sdk'
$sdkmanager = Join-Path $sdk 'cmdline-tools\latest\bin\sdkmanager.bat'
if (-not (Test-Path $sdkmanager)) {
    Write-Host 'Lade Android-Kommandozeilenwerkzeuge ...'
    $zip = Join-Path $tmp $CmdlineTools
    Invoke-WebRequest "https://dl.google.com/android/repository/$CmdlineTools" -OutFile $zip -UseBasicParsing
    $ex = Join-Path $tmp 'cmdline'
    if (Test-Path $ex) { Remove-Item $ex -Recurse -Force }
    [IO.Compression.ZipFile]::ExtractToDirectory($zip, $ex)
    New-Item -ItemType Directory -Force (Join-Path $sdk 'cmdline-tools') | Out-Null
    Move-Item (Join-Path $ex 'cmdline-tools') (Join-Path $sdk 'cmdline-tools\latest')
    Remove-Item $zip
    Remove-Item $ex -Recurse -Force
}

$env:JAVA_HOME = $jdk
$env:PATH = "$jdk\bin;$env:PATH"
$pkgs = @('platforms;android-34', 'build-tools;34.0.0')
Write-Host "Installiere $($pkgs -join ', ') ..."
if ($AcceptLicenses) {
    # Antworten ueber eine ASCII-Datei: die PowerShell-Pipe kommt bei der .bat nicht sauber an
    $yes = Join-Path $tmp 'yes.txt'
    [IO.File]::WriteAllText($yes, ("y`r`n" * 20), [Text.Encoding]::ASCII)
    cmd /c "`"$sdkmanager`" --sdk_root=`"$sdk`" $(($pkgs | ForEach-Object { '"' + $_ + '"' }) -join ' ') < `"$yes`""
} else {
    & $sdkmanager "--sdk_root=$sdk" $pkgs
}
if ($LASTEXITCODE -ne 0) { throw "sdkmanager meldet Fehler $LASTEXITCODE" }
if (-not (Test-Path (Join-Path $sdk 'build-tools\34.0.0\aapt2.exe'))) { throw 'build-tools fehlen (Lizenz nicht bestaetigt?)' }
Write-Host "Fertig. Android SDK: $sdk"
Write-Host 'Weiter mit: powershell -ExecutionPolicy Bypass -File android\build.ps1'
