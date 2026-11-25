param([string]$SdkRoot = (Join-Path $env:LOCALAPPDATA 'MocBuildTools\sdk'))
$ErrorActionPreference = 'Stop'
$project = Split-Path $PSScriptRoot -Parent
$android = Join-Path $project 'android'
$build = Join-Path $android 'build'
$javaRoot = 'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'
if ($env:JAVA_HOME) { $javaRoot = $env:JAVA_HOME }
$tools = Join-Path $SdkRoot 'build-tools\35.0.0'
$platform = Join-Path $SdkRoot 'platforms\android-35\android.jar'
foreach ($required in @($platform, (Join-Path $tools 'aapt.exe'), (Join-Path $javaRoot 'bin\javac.exe'))) { if (!(Test-Path -LiteralPath $required)) { throw "Missing build tool: $required" } }
if (!(Test-Path (Join-Path $project 'dist\index.html'))) { throw 'Run npm run build first' }
function Invoke-Tool([string]$executable, [string[]]$arguments) {
 $previousPreference = $ErrorActionPreference
 $ErrorActionPreference = 'Continue'
 try { & $executable @arguments 2>&1 | ForEach-Object { Write-Output $_.ToString() }; $script:toolExitCode = $LASTEXITCODE } finally { $ErrorActionPreference = $previousPreference }
}
function Check-Exit([string]$operation) { if ($script:toolExitCode -ne 0) { throw "$operation failed with code $script:toolExitCode" } }
New-Item -ItemType Directory -Path $build,(Join-Path $build 'generated'),(Join-Path $build 'classes'),(Join-Path $build 'dex'),(Join-Path $build 'assets\web'),(Join-Path $android 'res\drawable'),(Join-Path $project 'artifacts') -Force | Out-Null
# Recreate only the validated build-local web assets to prevent stale bundles.
$web = [IO.Path]::GetFullPath((Join-Path $build 'assets\web'))
if (!$web.StartsWith([IO.Path]::GetFullPath($build) + [IO.Path]::DirectorySeparatorChar)) { throw 'Build assets escaped build directory' }
Get-ChildItem -LiteralPath $web -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $project 'dist\*') -Destination $web -Recurse -Force
Copy-Item -LiteralPath (Join-Path $project 'public\icon-192.png') -Destination (Join-Path $android 'res\drawable\app_icon.png') -Force
Invoke-Tool (Join-Path $tools 'aapt.exe') @('package','-f','-m','-J',(Join-Path $build 'generated'),'-M',(Join-Path $android 'AndroidManifest.xml'),'-S',(Join-Path $android 'res'),'-A',(Join-Path $build 'assets'),'-I',$platform,'-F',(Join-Path $build 'resources.apk'))
Check-Exit 'Android resource packaging'
$sources = @(Get-ChildItem -Path (Join-Path $android 'src'),(Join-Path $build 'generated') -Filter '*.java' -Recurse | Select-Object -ExpandProperty FullName)
Invoke-Tool (Join-Path $javaRoot 'bin\javac.exe') (@('-encoding','UTF-8','--release','8','-classpath',$platform,'-d',(Join-Path $build 'classes')) + $sources)
Check-Exit 'Java compilation'
$classes = @(Get-ChildItem -Path (Join-Path $build 'classes') -Filter '*.class' -Recurse | Select-Object -ExpandProperty FullName)
$env:JAVA_HOME = $javaRoot
$env:DEBUG = $null
Invoke-Tool (Join-Path $tools 'd8.bat') (@('--lib',$platform,'--min-api','26','--output',(Join-Path $build 'dex')) + $classes)
Check-Exit 'DEX compilation'
Copy-Item -LiteralPath (Join-Path $build 'resources.apk') -Destination (Join-Path $build 'unsigned.apk') -Force
Push-Location (Join-Path $build 'dex')
try { Invoke-Tool (Join-Path $tools 'aapt.exe') @('add',(Join-Path $build 'unsigned.apk'),'classes.dex'); Check-Exit 'DEX packaging' } finally { Pop-Location }
Invoke-Tool (Join-Path $tools 'zipalign.exe') @('-f','-p','4',(Join-Path $build 'unsigned.apk'),(Join-Path $build 'aligned.apk'))
Check-Exit 'APK alignment'
$keyDirectory = Join-Path $env:USERPROFILE '.android'
New-Item -ItemType Directory -Path $keyDirectory -Force | Out-Null
$key = Join-Path $keyDirectory 'moc-personal-debug.keystore'
if (!(Test-Path -LiteralPath $key)) {
 Invoke-Tool (Join-Path $javaRoot 'bin\keytool.exe') @('-genkeypair','-keystore',$key,'-storepass','android','-alias','androiddebugkey','-keypass','android','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Moc Personal Debug,O=Personal,C=VN')
 Check-Exit 'Personal development key creation'
}
$appVersion = (Get-Content -LiteralPath (Join-Path $project 'package.json') -Raw | ConvertFrom-Json).version
if($appVersion -notmatch '^\d+\.\d+\.\d+$'){throw 'Invalid app version'}
$apk = Join-Path $project "artifacts\Moc-Personal-$appVersion.apk"
Invoke-Tool (Join-Path $tools 'apksigner.bat') @('sign','--ks',$key,'--ks-key-alias','androiddebugkey','--ks-pass','pass:android','--key-pass','pass:android','--out',$apk,(Join-Path $build 'aligned.apk'))
Check-Exit 'APK signing'
Invoke-Tool (Join-Path $tools 'apksigner.bat') @('verify','--verbose',$apk)
Check-Exit 'APK verification'
Get-FileHash -LiteralPath $apk -Algorithm SHA256
