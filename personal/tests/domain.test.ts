import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseBackup,
  defaultPreferences,
  makeEntry,
  freePeriods,
  daysBetween,
  streak,
  safeUrl,
  validDate,
} from "../src/domain.ts";
import { themes } from "../src/themes.ts";
import { translationCatalog, locales } from "../src/i18n.ts";
import { modules } from "../src/modules.ts";
function backup() {
  const entry = makeEntry("inventory");
  entry.title = "Hộ chiếu / 护照";
  entry.place = "Ngăn 2";
  return {
    version: 1,
    preferences: { ...defaultPreferences },
    entries: [entry],
  };
}
test("backup round trip preserves Unicode and local preferences", () => {
  const value = backup();
  value.preferences.locale = "fr";
  value.preferences.theme = "neon";
  assert.deepEqual(parseBackup(JSON.stringify(value)), value);
});
test("invalid schema is rejected", () => {
  for (const value of [null, {}, [], { version: 2, entries: [] }])
    assert.throws(() => parseBackup(JSON.stringify(value)));
});
test("duplicate entry IDs cannot replace records silently", () => {
  const value = backup();
  value.entries.push({ ...value.entries[0] });
  assert.throws(() => parseBackup(JSON.stringify(value)));
});
test("script URLs and unsafe SVG media are rejected", () => {
  const value = backup();
  value.entries[0].url = "javascript:alert(1)";
  assert.throws(() => parseBackup(JSON.stringify(value)));
  value.entries[0].url = "";
  value.entries[0].photo = "data:image/svg+xml;base64,PHN2Zz4=";
  assert.throws(() => parseBackup(JSON.stringify(value)));
});
test("missing fields and invalid preference flags are rejected", () => {
  const value = backup();
  const bad = {
    ...value,
    preferences: { ...value.preferences, touch: "true" },
  };
  assert.throws(() => parseBackup(JSON.stringify(bad)));
  assert.throws(() =>
    parseBackup(
      JSON.stringify({ ...value, entries: [{ id: "1", title: "bad" }] }),
    ),
  );
});
test("invalid dates and numeric values are rejected", () => {
  for (const change of [
    { date: "2026-02-30" },
    { progress: "101" },
    { amount: "NaN" },
    { amount: "1e20" },
    { created: "invalid" },
  ]) {
    const value = backup();
    Object.assign(value.entries[0], change);
    assert.throws(() => parseBackup(JSON.stringify(value)));
  }
});
test("invalid timezone and unknown module are rejected", () => {
  const value = backup();
  value.preferences.zone = "somewhere/no";
  assert.throws(() => parseBackup(JSON.stringify(value)));
  value.preferences.zone = "Asia/Ho_Chi_Minh";
  value.entries[0].module = "unregistered";
  assert.throws(() => parseBackup(JSON.stringify(value)));
});
test("free-time calculation merges overlapping periods", () =>
  assert.deepEqual(
    freePeriods(
      [
        { start: 540, end: 660 },
        { start: 600, end: 720 },
      ],
      480,
      780,
    ),
    [
      { start: 480, end: 540 },
      { start: 720, end: 780 },
    ],
  ));
test("free-time calculation clips outside day and handles full day", () => {
  assert.deepEqual(freePeriods([{ start: 0, end: 1440 }]), []);
  assert.deepEqual(freePeriods([]), [{ start: 480, end: 1320 }]);
});
test("date intervals are timezone-independent over leap days", () => {
  assert.equal(daysBetween("2024-02-28", "2024-03-01"), 2);
  assert.equal(daysBetween("2026-11-25", "2026-11-24"), -1);
  assert.equal(validDate("2026-02-29"), false);
});
test("habit streak permits today not yet checked", () => {
  assert.equal(streak(["2026-11-23", "2026-11-24"], "2026-11-25"), 2);
  assert.equal(streak(["2026-11-25"], "2026-11-25"), 1);
  assert.equal(streak(["2026-11-23"], "2026-11-25"), 0);
});
test("external links accept only HTTP and HTTPS", () => {
  assert.ok(safeUrl("https://example.com"));
  for (const url of [
    "data:text/html,x",
    "file:///x",
    "javascript:alert(1)",
    "not a URL",
  ])
    assert.equal(safeUrl(url), false);
});
test("24 themes have distinct IDs and complete palettes", () => {
  assert.equal(themes.length, 24);
  assert.equal(new Set(themes.map((t) => t[0])).size, 24);
  for (const theme of themes)
    for (const color of theme.slice(2)) assert.match(color, /^#[a-f0-9]{6}$/i);
});
test("all 4 languages cover every UI key and every module", () => {
  assert.equal(locales.length, 4);
  for (const translations of Object.values(translationCatalog)) {
    assert.equal(translations.length, 4);
    for (const value of translations) assert.ok(value.trim());
  }
  assert.equal(modules.length, 31);
  assert.equal(new Set(modules.map((m) => m.id)).size, 31);
  for (const module of modules) {
    assert.equal(module.names.length, 4);
    for (const label of module.names) assert.ok(label.trim());
  }
});
