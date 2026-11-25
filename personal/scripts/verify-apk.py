"""Verify the APK contains the exact offline web build, without a device claim."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import zipfile
import argparse

root = Path(__file__).resolve().parent.parent
version = json.loads((root / 'package.json').read_text(encoding='utf-8'))['version']
parser=argparse.ArgumentParser()
parser.add_argument('--apk',type=Path)
args=parser.parse_args()
apk = args.apk.resolve() if args.apk else root / 'artifacts' / f'Moc-Personal-{version}.apk'
with zipfile.ZipFile(apk) as archive:
    names = set(archive.namelist())
    assert {'classes.dex', 'AndroidManifest.xml', 'resources.arsc'} <= names
    web_files = [file for file in (root / 'dist').rglob('*') if file.is_file()]
    for file in web_files:
        member = 'assets/web/' + file.relative_to(root / 'dist').as_posix()
        assert archive.read(member) == file.read_bytes(), f'Asset mismatch: {member}'
sdk = Path(os.environ['LOCALAPPDATA']) / 'MocBuildTools' / 'sdk'
badging = subprocess.run([str(sdk / 'build-tools/35.0.0/aapt.exe'), 'dump', 'badging', str(apk)], capture_output=True, text=True, encoding='utf-8', check=True).stdout
assert "name='vn.moc.personal'" in badging
assert "sdkVersion:'26'" in badging
report = {
    'apk': str(apk),
    'bytes': apk.stat().st_size,
    'sha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'bundledAssetsCompared': len(web_files),
    'assetsMatchBuild': True,
    'package': 'vn.moc.personal',
    'minSdk': 26,
    'nativeDeviceTested': False,
    'badging': badging,
}
(root / 'qa').mkdir(exist_ok=True)
(root / 'qa/artifact-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({key: value for key, value in report.items() if key != 'badging'}, ensure_ascii=False, indent=2))
