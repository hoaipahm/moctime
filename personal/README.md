# Mốc Personal — developer guide

An offline personal Android and web application with 31 spaces, 24 themes, and Vietnamese, English, French, and Simplified Chinese.

The repository-level [README](../README.md) contains current screenshots, download links, and installation instructions. The new application lives in this directory; the original Time Hub application remains at the repository root.

## Run locally

Use Node.js 24.14.1 or a compatible newer Node 24 release:

```sh
npm ci
npm run dev -- --port 4317
```

Open `http://localhost:4317`. To verify the production build:

```sh
npm run build
npm run preview -- --port 4318
```

The APK bundles the web build and works without a server. Browser PWA caching requires HTTPS or localhost after the initial successful load. Phone access to a development server over plain LAN HTTP does not provide the secure context required for microphone/PWA features.

## Tests

```sh
npm test
npm run format:check
npm run build
# Keep the dev server at port 4317 running:
npm run test:browser
```

`node scripts/verify-extra.mjs` additionally checks image/synthetic microphone persistence, valid media backup restoration, localized phone layouts and offline production reload. It requires both dev port 4317 and preview port 4318.

```powershell
$env:JAVA_HOME = 'C:\path\to\jdk-17'
.\scripts\test-native.ps1
.\scripts\build-android.ps1 -SdkRoot 'C:\path\to\Android\Sdk'
```

The native build uses SDK Platform 35, Build Tools 35.0.0, `aapt`, `javac`, `d8`, `zipalign` and `apksigner` directly. Configure `JAVA_HOME`; the machine-specific fallback in the helper is not a portable JDK installation. The default SDK fallback is `%LOCALAPPDATA%\MocBuildTools\sdk`.

The APK is written to `artifacts/Moc-Personal-<version>.apk`. Signing keys stay outside the repository at `~/.android/moc-personal-debug.keystore`. The development key password follows Android's standard debug convention; this is not a production signing setup. Preserve that key privately to sign compatible updates. Never commit it.

## Architecture

React screens call typed domain functions and IndexedDB transaction helpers. `src/i18n.ts` owns shared localized copy; `src/themes.ts` owns the complete palettes. Module metadata and fields are in `src/modules.ts`. Camera/photo selection and microphone capture go through browser APIs and the restricted native shell.

The Android WebView serves bundled assets from `https://appassets.androidplatform.net`. External links open outside the WebView. There is no bridge for arbitrary shell commands or general filesystem access. Document export uses the Android document picker.

## Reminders

An optional `reminderAt` local date/time is stored on dated entries. Old backups without it remain valid. `reminderPlan` filters future, unfinished entries, orders them and limits the native plan to 256 items. Native code validates and persists the plan before replacing alarms.

Notifications are opt-in. Android 13+ requires notification permission. The receiver re-registers future alarms after reboot, package replacement and clock/time-zone changes. The implementation uses inexact alarms and does not promise minute-precise delivery. Force-stopping, disabling notifications or battery policies may suppress or delay reminders. The focus timer does not use background alarms.

The reminder's time follows the device time zone; the profile time-zone selection only changes the dashboard clock. Java and browser date validation reject nonexistent local times. Ambiguous daylight-saving times use the earlier valid offset.

## Persistence and privacy

Entries, photos, audio, profile, locale, theme and daily busy-period records are kept in IndexedDB. Backup restoration validates its complete payload before an atomic replacement transaction. Device-specific notification permission and opt-in state are not transferred by backups.

Local data is not encrypted by this app. Future letters are hidden by UI date rules, not secure encryption. Do not store passwords or sensitive documents. Back up before uninstalling or clearing app/browser storage. Browser and APK data stores are separate; transfer Personal records with JSON backup/restore.

## Scope

Inventory, experiments, ideas, letters, memories, quests, thought tags, projects, media galleries, manual screenshot checklists, tools, project launch notes, reports, demos, links, daily schedules, voice clips, places, clothing, deadlines, pantry items, self-dates, postcards, notes, habits, countdowns and signed money amounts all have local workflows.

AI/OCR, speech transcription, cloud sync, semantic document parsing, online recommendations, automatic recipe generation, operating-system file management and desktop command execution are not connected. Reports compile existing entries without inventing conclusions. File classification reads selected files, computes hashes and exports a manifest without moving or deleting originals.

See [REVIEW.md](docs/REVIEW.md) and [RELEASE-1.1.0.md](docs/RELEASE-1.1.0.md) for verification boundaries and release details.
