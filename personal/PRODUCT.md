# Mốc

## Platform
Web UI designed for Android phones and desktop; offline Android APK wrapper requested explicitly. Personal, single-user app.

## Stack
Implementation choice: React + TypeScript + Vite, IndexedDB persistence, native Android WebView wrapper. No backend or account required. Chosen for one shared offline application across APK and browser. User confirmed Android APK; framework is an implementation assumption.

## Users and purpose
The user wants all previously discussed personal-life ideas and tools combined into one usable app. One searchable library groups life, creativity, productivity and utilities. Modules must offer actual actions rather than promotional cards.

## Requirements
At least 20 selectable color themes; Vietnamese, English, French and Chinese, sharing one persisted locale. Screenshot is visual authority: peach cream surfaces, thick dark outlines, hard offset shadows, amber clock, coral/teal cards, desktop sidebar, mobile header/bottom navigation and slide-up menu with soundscape.

## Data and constraints
Local records, photos, voice recordings and daily busy periods; backup and restore. Version1.1 adds opt-in native inexact reminders, with optional local reminder times preserved in backups and native registrations restored after reboot or time changes. Notification permission and opt-in are device-specific. Never present simulated AI/OCR, operating-system file manipulation, desktop command execution, online place recommendations or secure time-locking as implemented. Those ideas receive honest manual workflows or explicit capability boundaries. Personal APK is for sideloading, not an assertion of Play Store readiness. Actual phone testing remains required.

## Open decisions
Brand name Mốc is a working implementation choice. No cloud provider, AI credentials, paid services or store publication requested.
