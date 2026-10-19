param([string]$GradlePath, [switch]$Offline)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$androidRoot = Join-Path $projectRoot 'android'
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
if (!(Test-Path -LiteralPath $sdkRoot)) { throw 'Install the Android SDK in Android Studio, or set ANDROID_HOME.' }
if (!$env:JAVA_HOME) {
    $javaCommand = Get-Command javac -ErrorAction Stop
    $env:JAVA_HOME = Split-Path (Split-Path $javaCommand.Source -Parent) -Parent
}
"sdk.dir=$($sdkRoot.Replace('\','/').Replace(':','\:'))" | Set-Content (Join-Path $androidRoot 'local.properties') -Encoding ascii

# Keep this folder backed up privately: the same key is needed for every APK update.
$signingDir = Join-Path $androidRoot '.signing'
$keyFile = Join-Path $signingDir 'escape-room.jks'
$passwordFile = Join-Path $signingDir 'signing.properties'
if (!(Test-Path -LiteralPath $keyFile)) {
    if (Test-Path -LiteralPath $passwordFile) { throw 'Signing password exists but key is missing. Restore the key from backup.' }
    New-Item -ItemType Directory -Path $signingDir -Force | Out-Null
    $bytes = New-Object byte[] 32
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $random.GetBytes($bytes)
    $random.Dispose()
    $env:ESCAPE_ROOM_KEY_PASSWORD = [BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()
    try {
        & (Join-Path $env:JAVA_HOME 'bin\keytool.exe') -genkeypair -keystore $keyFile -storetype JKS -alias escape-room -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=Escape Room, O=Snickbar' -storepass:env ESCAPE_ROOM_KEY_PASSWORD -keypass:env ESCAPE_ROOM_KEY_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Could not create APK signing key.' }
        "storePassword=$env:ESCAPE_ROOM_KEY_PASSWORD" | Set-Content $passwordFile -Encoding ascii
    } finally { Remove-Item Env:\ESCAPE_ROOM_KEY_PASSWORD -ErrorAction SilentlyContinue }
}
if (!(Test-Path -LiteralPath $passwordFile)) { throw 'Restore android/.signing/signing.properties from your private backup.' }

$gradle = if ($GradlePath) { $GradlePath } else { Join-Path $androidRoot 'gradlew.bat' }
if (!(Test-Path -LiteralPath $gradle)) { throw 'Gradle wrapper missing. Supply -GradlePath with an installed Gradle 8.14.3, then generate the wrapper.' }
$buildArgs = @('-p', $androidRoot, 'assembleRelease', 'lintRelease', '--console=plain', '--no-daemon')
if ($Offline) { $buildArgs += '--offline' }
& $gradle @buildArgs
if ($LASTEXITCODE -ne 0) { throw 'Android build failed.' }
$outputDir = Join-Path $projectRoot 'dist'
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
$apk = Join-Path $outputDir 'EscapeRoom-0.5.0.apk'
Copy-Item -LiteralPath (Join-Path $androidRoot 'app\build\outputs\apk\release\app-release.apk') -Destination $apk
$toolsVersion = Get-ChildItem (Join-Path $sdkRoot 'build-tools') -Directory | Sort-Object Name -Descending | Select-Object -First 1
& (Join-Path $toolsVersion.FullName 'apksigner.bat') verify --verbose $apk
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
Get-FileHash -LiteralPath $apk -Algorithm SHA256
Write-Output "Installable APK: $apk"
