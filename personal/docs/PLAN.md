# Implementation plan

1. App shell matching supplied screenshot, shared locale and 24 themes.
2. IndexedDB records, settings, media, CRUD, search, backup validation.
3. Today dashboard, calendar, timer, habits, world clocks, soundscape.
4. Every discussed idea appears in a module with specific fields and workflow. Utilities receive dedicated implementations. Desktop/system/AI-dependent ideas expose their limits.
5. Android wrapper: offline assets, media/file permissions, document import/export, system back.
6. Type/build/unit/browser checks; screenshots on desktop and mobile; APK signature validation; handoff.

Acceptance: persisted theme/locale and records after restart; four complete locale catalogs; 24 palettes; no horizontal overflow at 360px; forms can add/edit/delete; import cannot overwrite on invalid data; APK loads bundled assets and does not require server.

## Personal1.1 preview delivery

- Persist daily schedule records and preserve optional reminder times in backups.
- Register opt-in native inexact reminders, handle Android13 notification permission, and restore alarms after reboot/update/time changes.
- Close editors before navigating backward; exit the Android activity from unobstructed Today.
- Review and verify the final build, preserve the original remote app, publish English docs/screenshots and a checksummed downloadable APK.
- Physical Android acceptance remains a separate manual check, explicitly recorded in REVIEW.md.
