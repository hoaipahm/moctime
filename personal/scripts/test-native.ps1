$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$javaRoot=if($env:JAVA_HOME){$env:JAVA_HOME}else{'C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot'}
$output=Join-Path $root 'android\build\jvm-tests'
New-Item -ItemType Directory -Path $output -Force | Out-Null
& (Join-Path $javaRoot 'bin\javac.exe') -encoding UTF-8 -d $output (Join-Path $root 'android\src\vn\moc\personal\ReminderTime.java') (Join-Path $root 'tests\java\ReminderTimeTest.java')
if($LASTEXITCODE -ne 0){throw 'Native test compilation failed'}
& (Join-Path $javaRoot 'bin\java.exe') -cp $output ReminderTimeTest
if($LASTEXITCODE -ne 0){throw 'Native time tests failed'}
