import { test } from "node:test";
import assert from "node:assert/strict";
import {
  makeEntry,
  parseBackup,
  defaultPreferences,
  validReminderAt,
} from "../src/domain.ts";
import { reminderPlan } from "../src/reminders.ts";
test("reminder dates reject normalized invalid calendar values", () => {
  for (const value of [
    "2027-02-29T09:00",
    "2026-11-25T24:00",
    "2026-11-25T09:60",
    "2026-11-25",
    "bad",
  ])
    assert.equal(validReminderAt(value), false);
  assert.ok(validReminderAt("2030-01-01T09:30"));
});
test("backups remain compatible with entries without reminders", () => {
  const entry = {
    ...makeEntry("deadlines"),
    title: "Warranty",
    date: "2030-01-01",
  };
  const snapshot = {
    version: 1,
    entries: [entry],
    preferences: defaultPreferences,
  };
  assert.deepEqual(parseBackup(JSON.stringify(snapshot)), snapshot);
  const updated = { ...entry, reminderAt: "2030-01-01T09:30" };
  assert.equal(
    parseBackup(JSON.stringify({ ...snapshot, entries: [updated] })).entries[0]
      .reminderAt,
    updated.reminderAt,
  );
  assert.throws(() =>
    parseBackup(
      JSON.stringify({
        ...snapshot,
        entries: [{ ...updated, reminderAt: "2030-02-30T09:30" }],
      }),
    ),
  );
});
test("reminders exclude completed, past and unset dates", () => {
  const future = {
    ...makeEntry("deadlines"),
    title: "Return item",
    reminderAt: "2030-01-01T09:30",
  };
  const past = { ...future, id: "past", reminderAt: "2020-01-01T09:30" };
  const completed = { ...future, id: "done", done: true };
  const unset = { ...future, id: "unset", reminderAt: "" };
  const actual = reminderPlan(
    [future, past, completed, unset],
    "en",
    new Date("2029-01-01T00:00").getTime(),
  );
  assert.equal(actual.length, 1);
  assert.equal(actual[0].body, "Pocket deadlines");
  assert.equal(actual[0].id, future.id);
});
test("reminder plan sorts and bounds native alarm registrations", () => {
  const rows = Array.from({ length: 300 }, (_, i) => ({
    ...makeEntry("notes"),
    id: String(i),
    title: "Item " + i,
    reminderAt: i % 2 ? "2030-01-02T09:30" : "2030-01-01T09:30",
  }));
  const plan = reminderPlan(rows, "fr", new Date("2029-01-01").getTime());
  assert.equal(plan.length, 256);
  assert.ok(plan.every((r, i) => !i || r.when >= plan[i - 1].when));
  assert.equal(plan[0].body, "Notes");
});
