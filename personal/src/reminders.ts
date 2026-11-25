import { validReminderAt, type Entry } from "./domain.ts";
import { moduleName, modules } from "./modules.ts";
import type { Locale } from "./i18n.ts";
export interface Reminder {
  id: string;
  title: string;
  body: string;
  local: string;
  when: number;
}
export function reminderPlan(
  entries: Entry[],
  locale: Locale,
  now = Date.now(),
): Reminder[] {
  return entries
    .filter(
      (entry) =>
        !entry.done &&
        entry.reminderAt &&
        validReminderAt(entry.reminderAt) &&
        new Date(entry.reminderAt).getTime() > now,
    )
    .map((entry) => ({
      id: entry.id,
      title: entry.title.slice(0, 200),
      body: moduleName(
        modules.find((module) => module.id === entry.module) ?? modules[0],
        locale,
      ),
      local: entry.reminderAt ?? "",
      when: new Date(entry.reminderAt ?? "").getTime(),
    }))
    .sort((a, b) => a.when - b.when || a.id.localeCompare(b.id))
    .slice(0, 256);
}
export interface ReminderStatus {
  supported: boolean;
  enabled: boolean;
  allowed: boolean;
  count: number;
}
export function reminderStatus(): ReminderStatus {
  try {
    const bridge = window.MocNative;
    if (!bridge?.reminderStatus)
      return { supported: false, enabled: false, allowed: false, count: 0 };
    const value: unknown = JSON.parse(bridge.reminderStatus());
    if (
      value &&
      typeof value === "object" &&
      "enabled" in value &&
      "allowed" in value &&
      "count" in value &&
      typeof value.enabled === "boolean" &&
      typeof value.allowed === "boolean" &&
      typeof value.count === "number"
    )
      return {
        supported: true,
        enabled: value.enabled,
        allowed: value.allowed,
        count: value.count,
      };
  } catch {
    /* UI remains available if a legacy APK lacks the bridge. */
  }
  return { supported: false, enabled: false, allowed: false, count: 0 };
}
