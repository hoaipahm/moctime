import { moduleIds } from "./modules.ts";
import { locales, type Locale } from "./i18n.ts";
import { getTheme } from "./themes.ts";
export interface Entry {
  id: string;
  module: string;
  title: string;
  body: string;
  place: string;
  url: string;
  date: string;
  amount: string;
  progress: string;
  tag: string;
  next: string;
  photo: string;
  audio: string;
  done: boolean;
  checks: string[];
  created: string;
  updated: string;
  reminderAt?: string;
}
export interface Preferences {
  locale: Locale;
  theme: string;
  name: string;
  bio: string;
  zone: string;
  favorites: string[];
  touch: boolean;
  haptics: boolean;
}
export interface Snapshot {
  version: 1;
  entries: Entry[];
  preferences: Preferences;
}
export const defaultPreferences: Preferences = {
  locale: "vi",
  theme: "coral",
  name: "",
  bio: "",
  zone: "Asia/Ho_Chi_Minh",
  favorites: ["notes", "habits", "inventory", "ideas", "projects", "toolbox"],
  touch: false,
  haptics: true,
};
export function dayKey(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
export function makeEntry(module: string): Entry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    module,
    title: "",
    body: "",
    place: "",
    url: "",
    date: "",
    amount: "",
    progress: "",
    tag: "",
    next: "",
    photo: "",
    audio: "",
    done: false,
    checks: [],
    created: now,
    updated: now,
  };
}
export function safeUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value + "T12:00:00");
  return !Number.isNaN(d.getTime()) && dayKey(d) === value;
}
export function validReminderAt(value: string): boolean {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ||
    !validDate(value.slice(0, 10))
  )
    return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) &&
    dayKey(date) === value.slice(0, 10) &&
    String(date.getHours()).padStart(2, "0") === value.slice(11, 13) &&
    String(date.getMinutes()).padStart(2, "0") === value.slice(14, 16)
  );
}
export function parseBackup(text: string): Snapshot {
  if (text.length > 80_000_000) throw new Error("size");
  const data: unknown = JSON.parse(text);
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("entries" in data) ||
    !Array.isArray(data.entries) ||
    data.entries.length > 10000 ||
    !("preferences" in data)
  )
    throw new Error("schema");
  const ids = new Set<string>();
  const entries: Entry[] = [];
  for (const row of data.entries) {
    if (!row || typeof row !== "object") throw new Error("entry");
    const strings = [
      "id",
      "module",
      "title",
      "body",
      "place",
      "url",
      "date",
      "amount",
      "progress",
      "tag",
      "next",
      "photo",
      "audio",
      "created",
      "updated",
    ] as const;
    for (const key of strings) {
      if (
        typeof row[key] !== "string" ||
        row[key].length >
          (["photo", "audio"].includes(key) ? 12_000_000 : 30000)
      )
        throw new Error("field");
    }
    if (
      !row.id ||
      row.id.length > 200 ||
      ids.has(row.id) ||
      !moduleIds.includes(row.module) ||
      !row.title.trim() ||
      row.title.length > 200 ||
      typeof row.done !== "boolean" ||
      !Array.isArray(row.checks) ||
      row.checks.length > 10000 ||
      !row.checks.every(
        (v: unknown) => typeof v === "string" && validDate(v),
      ) ||
      (row.url && !safeUrl(row.url)) ||
      (row.date && !validDate(row.date)) ||
      Number.isNaN(Date.parse(row.created)) ||
      Number.isNaN(Date.parse(row.updated))
    )
      throw new Error("value");
    if (
      row.photo &&
      !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(row.photo)
    )
      throw new Error("photo");
    if (
      row.audio &&
      !/^data:(audio\/(webm|ogg|mp4|mpeg)|video\/webm)(;codecs=[a-zA-Z0-9,.-]+)?;base64,[A-Za-z0-9+/=]+$/.test(
        row.audio,
      )
    )
      throw new Error("audio");
    if (
      row.amount &&
      (!Number.isFinite(Number(row.amount)) ||
        Math.abs(Number(row.amount)) > 1e15)
    )
      throw new Error("amount");
    if (
      row.progress &&
      (!Number.isFinite(Number(row.progress)) ||
        Number(row.progress) < 0 ||
        Number(row.progress) > 100)
    )
      throw new Error("progress");
    ids.add(row.id);
    if (
      row.reminderAt !== undefined &&
      (typeof row.reminderAt !== "string" ||
        (row.reminderAt && !validReminderAt(row.reminderAt)))
    )
      throw new Error("reminder");
    entries.push(
      Object.fromEntries([
        ...strings.map((key) => [key, row[key]]),
        ["done", row.done],
        ["checks", [...row.checks]],
        ...(row.reminderAt !== undefined
          ? [["reminderAt", row.reminderAt]]
          : []),
      ]) as unknown as Entry,
    );
  }
  const prefs = data.preferences;
  if (!prefs || typeof prefs !== "object" || Array.isArray(prefs))
    throw new Error("preferences");
  const p: Record<string, unknown> = Object.fromEntries(Object.entries(prefs));
  if (
    !p ||
    typeof p !== "object" ||
    !("locale" in p) ||
    !locales.includes(p.locale as Locale) ||
    !("theme" in p) ||
    typeof p.theme !== "string" ||
    getTheme(p.theme)[0] !== p.theme
  )
    throw new Error("preferences");
  const preferences: Preferences = {
    ...defaultPreferences,
    locale: p.locale as Locale,
    theme: p.theme,
  };
  for (const key of ["name", "bio", "zone"] as const) {
    if (!(key in p) || typeof p[key] !== "string" || p[key].length > 2000)
      throw new Error("pref");
    preferences[key] = p[key];
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: preferences.zone });
  } catch {
    throw new Error("zone");
  }
  if (
    !("favorites" in p) ||
    !Array.isArray(p.favorites) ||
    !p.favorites.every((v) => typeof v === "string" && moduleIds.includes(v))
  )
    throw new Error("favorites");
  preferences.favorites = [...new Set(p.favorites)];
  for (const key of ["touch", "haptics"] as const) {
    if (!(key in p) || typeof p[key] !== "boolean") throw new Error("pref");
    preferences[key] = p[key];
  }
  return { version: 1, entries, preferences };
}
export function streak(checks: string[], today = dayKey()): number {
  const d = new Date(today + "T12:00:00");
  const set = new Set(checks);
  if (!set.has(dayKey(d))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (set.has(dayKey(d))) {
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}
export function daysBetween(a: string, b: string): number {
  if (!validDate(a) || !validDate(b)) throw new Error("date");
  return Math.round(
    (Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000,
  );
}
export interface Period {
  start: number;
  end: number;
}
export function freePeriods(
  busy: Period[],
  start = 8 * 60,
  end = 22 * 60,
): Period[] {
  const sorted = busy
    .map((p) => ({
      start: Math.max(start, p.start),
      end: Math.min(end, p.end),
    }))
    .filter((p) => p.end > p.start)
    .sort((a, b) => a.start - b.start);
  let cursor = start;
  const result: Period[] = [];
  for (const p of sorted) {
    if (p.start > cursor) result.push({ start: cursor, end: p.start });
    cursor = Math.max(cursor, p.end);
  }
  if (cursor < end) result.push({ start: cursor, end });
  return result;
}
