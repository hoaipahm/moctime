# App review — Mốc Personal 1.1.0

Reviewed on 25 November 2026. **Verdict: suitable for a clearly labeled development preview, with physical Android verification still required.** This is not a claim of production or Play Store readiness.

## Scope

Reviewed the new `personal/` React/TypeScript application, IndexedDB persistence, localization, backup validation, native WebView bridge, reminder plan/receiver, packaging helpers, and the documented capability boundaries. The original root Time Hub web/Windows application was preserved; it was not re-audited in this release.

## Executed checks

| Check | Result | What it establishes |
| --- | --- | --- |
| Domain tests | **18 passed** | Backup validation/compatibility, Unicode, unsafe links/media rejection, dates, habit streaks, interval merging and reminder planning |
| Browser flows | **11 passed** | CRUD/reload, 31-space navigation/search, all24 theme selections, four persisted locales, habits/checklists/tools, invalid import preservation, responsive widths, reduced motion, saved daily schedules, back navigation and reminder editing |
| JVM time cases | **6 passed** | Vietnam time-zone conversion, invalid dates/times and daylight-saving gaps/overlaps; not Android alarm delivery |
| Production web build | **Passed** | Strict TypeScript check and Vite production compilation |
| Dependency audit | **0 reported vulnerabilities** | Registry audit at review time, not a full supply-chain audit |
| APK | **Compiled and signed; verified** | Java/DEX/resources compile, alignment, APK v2/v3 signature validation |
| Bundled assets | **All bundled files matched the production build byte-for-byte** | The APK contains the current offline web build |
| Screenshots | **Desktop and mobile captured and inspected** | Actual English application render, including menu, spaces, themes and night calendar |

Browser checks use Chromium at360,390,768 and1440px. Their results do not prove physical touch, Android permission dialogs or hardware behavior. No separate ESLint pipeline is configured; the project uses strict TypeScript and Prettier checks.

## Findings addressed before publication

- Saved daily busy periods as ordinary IndexedDB records instead of transient screen state. They now survive navigation/reload and are included in backups.
- Preserved optional reminder times in old-compatible backups and rejected invalid/nonexistent local date/time values before native registration.
- Limited ordered native registrations to256 upcoming unfinished records; native code validates incoming fields and handles Java date conversion exceptions.
- Used immutable, explicitly targeted pending intents and private notification visibility. The native shell has no arbitrary command execution or general filesystem bridge.
- Added opt-in notification permission handling and receiver re-registration after reboot, package updates and time-zone/clock changes.
- Corrected Android back behavior and gave the reminder input a concise accessible label with separately described help text.
- Kept legacy app/package files separate to avoid replacing the existing Time Hub and Windows deliverables.

## Remaining risks and manual acceptance

1. **Android delivery and permissions:** no physical device or running emulator was available for this release. Verify notification opt-in, a near-future reminder while the app is closed, tapping the notification, disabling reminders, reboot re-registration, camera, microphone and document export on a real phone.
2. **Timing:** reminders use inexact alarms. Battery restrictions, force-stop and permission changes can delay or suppress delivery. They are not exact alarms; the focus timer has no background alarm.
3. **Privacy:** app data and JSON backups are not encrypted by this app. Future-letter visibility is a UI rule, not a security boundary. Keep backups private.
4. **Feature boundaries:** no connected AI/OCR, transcription, cloud sync, semantic document processing, online recommendations, desktop command execution or destructive file organization.
5. **Lunar calendar:** platform Chinese-calendar formatting is not independently validated as a full Vietnamese astronomical calendar.
6. **Compatibility:** physical OEM behavior, Safari/iPhone and Firefox were not tested. Personal and the older Time Hub package do not automatically share or migrate storage.

## Reproduce

Run the commands in the [developer guide](../README.md). Browser tests require the development server at port4317. `scripts/verify-extra.mjs` additionally requires production preview port4318 and covers synthetic-media restoration and offline reload. Keep generated `qa/` outputs local; they may contain machine paths and temporary captures.
