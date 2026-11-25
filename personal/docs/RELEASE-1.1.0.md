# Mốc Personal 1.1.0 — preview

## Included

- A responsive personal workspace with 31 spaces and practical local record workflows.
- 24 complete color palettes and shared Vietnamese, English, French and Simplified Chinese localization.
- Offline Android assets, PWA caching, IndexedDB storage, media attachments and JSON backup/restore.
- Native opt-in Android reminders for dated records, including notification permission handling and re-registration after reboot, app updates and time changes.
- Daily busy periods that persist across navigation/restarts and are included in backups.
- Android back navigation that closes an editor first, then returns through app history; back from the unobstructed Today screen exits the activity.
- English repository documentation, actual desktop/mobile screenshots and a downloadable APK with checksum.

## Install and upgrade

Requires Android 8.0+ and an updated Android System WebView. Download `Moc-Personal-1.1.0.apk`, open it and permit installation from the selected source if Android asks. This is a development-signed preview, not a Play Store release.

The package is `vn.moc.personal`, separate from the repository's original `vn.moc.timehub` app. It can coexist with Time Hub. Personal 1.0.0 data is retained by an in-place update signed with the same development key. Do not uninstall first; export a backup before changing installation or storage settings.

To use reminders: open a dated record, set **Remind me at**, save, then open **Settings → Android reminders** and enable notifications. You can send a test notification there. Reminder delivery is inexact and may be delayed by battery policies; it is not an exact alarm. Notifications do not operate in the browser edition.

## Preview limitations

Physical Android notification delivery, camera/microphone, document picker, haptics and OEM power-management behavior still need device testing. JVM date tests validate time conversion, not Android alarm delivery. Browser captures and a verified APK signature do not replace physical-phone QA.

No connected AI/OCR, speech transcription, cloud synchronization, secure vault, background focus alarm, computer command execution or destructive filesystem automation is included.
