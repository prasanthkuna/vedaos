$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$maestro = Join-Path $repoRoot "tools\\maestro\\maestro\\bin\\maestro.bat"
$flowDir = Join-Path $PSScriptRoot "..\\e2e\\maestro"

if (!(Test-Path $maestro)) {
  throw "Maestro binary not found at: $maestro"
}

$adb = Join-Path $env:LOCALAPPDATA "Android\\Sdk\\platform-tools\\adb.exe"
if (!(Test-Path $adb)) {
  throw "adb not found at: $adb"
}

$devices = (& $adb devices | Out-String)
if ($devices -notmatch "emulator-\d+\s+device") {
  Write-Output $devices
  throw "No Android emulator detected. Start emulator before running E2E."
}

$env:APP_URL = if ($env:APP_URL) { $env:APP_URL } else { "exp://10.0.2.2:8098" }

Write-Output "Running Maestro flows from: $flowDir"
Write-Output "APP_URL: $env:APP_URL"

& $maestro test (Join-Path $flowDir "01-onboarding-generate.yaml")
& $maestro test (Join-Path $flowDir "02-atmakaraka-quickproof.yaml")
& $maestro test (Join-Path $flowDir "03-validate-scoreboard.yaml")
