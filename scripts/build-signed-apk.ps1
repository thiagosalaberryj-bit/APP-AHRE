[CmdletBinding()]
param([switch] $SoloFirmar)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$android = Join-Path $raiz 'android'
$expo = Join-Path $raiz '.expo'
$origen = Join-Path $android 'app/build/outputs/apk/release/app-release.apk'
$destino = Join-Path $expo 'ahre-local-firmada.apk'
$huella = '2616fd4a893e35d1ee2fa72a5f58cca2edd5ecda1072dc2728541de5c0fc51d4'
$rutaCredencial = 'AHRE/android-signing/ahre-eas-release.dpapi'
$credencial = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) $rutaCredencial
if (-not (Test-Path -LiteralPath $credencial -PathType Leaf)) {
    $credencial = Join-Path $env:USERPROFILE "AppData/Local/$rutaCredencial"
}
if (-not (Test-Path -LiteralPath $credencial -PathType Leaf)) {
    throw 'Falta la credencial cifrada de Expo EAS para este usuario de Windows.'
}

$propiedades = Join-Path $android 'local.properties'
$lineaSdk = Get-Content -LiteralPath $propiedades | Where-Object { $_ -match '^sdk\.dir=' } | Select-Object -First 1
if (-not $lineaSdk) { throw 'Falta sdk.dir en android/local.properties.' }
$sdk = $lineaSdk.Substring('sdk.dir='.Length).Trim().Replace('\:', ':').Replace('\\', '\')
$firmador = Get-ChildItem -LiteralPath (Join-Path $sdk 'build-tools') -Directory |
    Sort-Object Name -Descending |
    ForEach-Object { Join-Path $_.FullName 'lib/apksigner.jar' } |
    Where-Object { Test-Path -LiteralPath $_ -PathType Leaf } |
    Select-Object -First 1
if (-not $firmador) { throw 'El SDK de Android no contiene apksigner.' }

$jdk = Get-ChildItem -LiteralPath (Join-Path $expo 'ahre-jdk17') -Directory -ErrorAction SilentlyContinue |
    Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName 'bin/java.exe') -PathType Leaf } |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $jdk) { $jdk = $env:JAVA_HOME }
if (-not $jdk) { throw 'Configurá JAVA_HOME con la ruta del JDK que usa Gradle.' }
$java = Join-Path $jdk 'bin/java.exe'
if (-not (Test-Path -LiteralPath $java -PathType Leaf)) { throw 'El JDK elegido no contiene java.exe.' }

if (-not $SoloFirmar) {
    $javaAnterior = $env:JAVA_HOME
    Push-Location -LiteralPath $android
    try {
        $env:JAVA_HOME = $jdk
        & .\gradlew.bat :app:assembleRelease
        if ($LASTEXITCODE -ne 0) { throw "Gradle terminó con código $LASTEXITCODE." }
    } finally {
        $env:JAVA_HOME = $javaAnterior
        Pop-Location
    }
}
if (-not (Test-Path -LiteralPath $origen -PathType Leaf)) {
    throw "No se encontró la APK generada por Gradle en $origen."
}

New-Item -ItemType Directory -Path $expo -Force | Out-Null
$identificador = [guid]::NewGuid().ToString('N')
$almacen = Join-Path ([IO.Path]::GetTempPath()) "ahre-$identificador.jks"
$temporal = Join-Path $expo "ahre-$identificador.apk"
$secreto = Get-Content -LiteralPath $credencial -Raw | ConvertTo-SecureString
try {
    $datos = [System.Net.NetworkCredential]::new('', $secreto).Password | ConvertFrom-Json
    [IO.File]::WriteAllBytes($almacen, [Convert]::FromBase64String($datos.keystore))
    $env:AHRE_EAS_STORE_PASS = $datos.keystorePassword
    $env:AHRE_EAS_KEY_PASS = $datos.keyPassword
    & $java -jar $firmador sign --ks $almacen --ks-key-alias $datos.keyAlias `
        --ks-pass env:AHRE_EAS_STORE_PASS --key-pass env:AHRE_EAS_KEY_PASS `
        --v4-signing-enabled false --out $temporal $origen
    if ($LASTEXITCODE -ne 0) { throw "apksigner terminó con código $LASTEXITCODE." }

    $certificados = & $java -jar $firmador verify --print-certs $temporal
    if ($LASTEXITCODE -ne 0 -or $certificados -notcontains "Signer #1 certificate SHA-256 digest: $huella") {
        throw 'La firma de la APK no coincide con el certificado de distribución de AHRE.'
    }
    Move-Item -LiteralPath $temporal -Destination $destino -Force
    Write-Output "APK firmada y verificada: $destino"
} finally {
    $secreto.Dispose()
    Remove-Item Env:AHRE_EAS_STORE_PASS, Env:AHRE_EAS_KEY_PASS -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $almacen, $temporal -ErrorAction SilentlyContinue
}
