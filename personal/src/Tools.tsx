import { useState } from "react";
import { copyText, downloadText } from "./media";
import {
  dayKey,
  daysBetween,
  freePeriods,
  makeEntry,
  validDate,
  type Entry,
  type Period,
} from "./domain";
import { moduleName, modules } from "./modules";
import { t, type Locale, type CopyKey } from "./i18n";
import { Icon } from "./ui";
export function Toolbox({
  locale,
  notify,
  initial = "json",
}: {
  locale: Locale;
  notify: (key: CopyKey) => void;
  initial?: string;
}) {
  const [tool, setTool] = useState(initial);
  const [input, setInput] = useState("");
  const [right, setRight] = useState("");
  const [pattern, setPattern] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);
  const [from, setFrom] = useState(dayKey());
  const [to, setTo] = useState(dayKey());
  function run() {
    try {
      setError(false);
      if (tool === "json")
        setOutput(JSON.stringify(JSON.parse(input), null, 2));
      if (tool === "uuid")
        setOutput(
          Array.from({ length: 5 }, () => crypto.randomUUID()).join("\n"),
        );
      if (tool === "regex") {
        if (input.length > 20000 || pattern.length > 200)
          throw new Error("size");
        setOutput("");
        const worker = new Worker(
          new URL("./regex-worker.ts", import.meta.url),
          { type: "module" },
        );
        const kill = setTimeout(() => {
          worker.terminate();
          setError(true);
        }, 500);
        worker.onmessage = (e) => {
          clearTimeout(kill);
          worker.terminate();
          if (e.data.error) setError(true);
          else setOutput(e.data.result);
        };
        worker.onerror = () => {
          clearTimeout(kill);
          worker.terminate();
          setError(true);
        };
        worker.postMessage({ input, pattern });
      }
      if (tool === "dates") setOutput(String(daysBetween(from, to)));
      if (tool === "colors")
        setOutput(
          input
            .split(/[\s,;]+/)
            .filter((v) => /^#[a-f\d]{6}$/i.test(v))
            .join("\n"),
        );
      if (tool === "diff") {
        const a = input.split("\n");
        const b = right.split("\n");
        setOutput(
          Array.from({ length: Math.max(a.length, b.length) }, (_, i) =>
            a[i] === b[i]
              ? "  " + (a[i] ?? "")
              : (a[i] !== undefined ? "- " + a[i] + "\n" : "") +
                (b[i] !== undefined ? "+ " + b[i] : ""),
          ).join("\n"),
        );
      }
    } catch {
      setError(true);
    }
  }
  return (
    <section className="panel tool-panel">
      <div className="tabs" role="group">
        {(["json", "uuid", "regex", "diff", "dates", "colors"] as const).map(
          (key) => (
            <button
              key={key}
              className={"chip " + (tool === key ? "amber" : "")}
              onClick={() => {
                setTool(key);
                setOutput("");
                setError(false);
              }}
            >
              {t(locale, key)}
            </button>
          ),
        )}
      </div>
      <div className="tool-workspace">
        {tool === "dates" ? (
          <div className="split">
            <label>
              {t(locale, "from")}
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label>
              {t(locale, "to")}
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
          </div>
        ) : (
          tool !== "uuid" && (
            <label>
              {t(locale, tool === "diff" ? "left" : "input")}
              <textarea
                maxLength={20000}
                rows={8}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </label>
          )
        )}
        {tool === "regex" && (
          <label>
            {t(locale, "pattern")}
            <input
              value={pattern}
              maxLength={200}
              onChange={(e) => setPattern(e.target.value)}
            />
          </label>
        )}
        {tool === "diff" && (
          <label>
            {t(locale, "right")}
            <textarea
              maxLength={20000}
              rows={8}
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </label>
        )}
        <button className="button amber" onClick={run}>
          <Icon name="Play" />
          {t(locale, "run")}
        </button>
        {error && (
          <p role="alert" className="error">
            {t(locale, "invalidInput")}
          </p>
        )}
        {output && (
          <div className="tool-output">
            <div className="section-heading">
              <h3>{t(locale, "output")}</h3>
              <button
                className="chip"
                onClick={() =>
                  void copyText(output)
                    .then(() => notify("copied"))
                    .catch(() => notify("error"))
                }
              >
                {t(locale, "copy")}
              </button>
            </div>
            {tool === "colors" && (
              <div className="swatches">
                {output.split("\n").map((color, i) => (
                  <span key={i} style={{ background: color }} />
                ))}
              </div>
            )}
            <pre>{output}</pre>
          </div>
        )}
      </div>
    </section>
  );
}
export function FileOrganizer({
  locale,
  notify,
}: {
  locale: Locale;
  notify: (key: CopyKey) => void;
}) {
  const [files, setFiles] = useState<
    { name: string; size: number; group: string; hash: string }[]
  >([]);
  const [working, setWorking] = useState(false);
  async function read(list: FileList) {
    const chosen = Array.from(list);
    if (chosen.length > 200 || chosen.some((f) => f.size > 20 * 1024 * 1024)) {
      notify("mediaLimit");
      return;
    }
    setWorking(true);
    try {
      const result = [];
      for (const file of chosen) {
        const digest = await crypto.subtle.digest(
          "SHA-256",
          await file.arrayBuffer(),
        );
        result.push({
          name: file.name,
          size: file.size,
          group:
            file.type.split("/")[0] || file.name.split(".").pop() || "file",
          hash: Array.from(new Uint8Array(digest), (v) =>
            v.toString(16).padStart(2, "0"),
          ).join(""),
        });
      }
      setFiles(result);
    } catch {
      notify("error");
    } finally {
      setWorking(false);
    }
  }
  return (
    <section className="panel">
      <p className="notice">{t(locale, "organizeHint")}</p>
      <label className="upload-control">
        <Icon name="FolderOpen" />
        {working ? "…" : t(locale, "selectFiles")}
        <input
          type="file"
          multiple
          disabled={working}
          onChange={(e) => {
            if (e.target.files) void read(e.target.files);
          }}
        />
      </label>
      {files.length > 0 && (
        <>
          <div className="file-list">
            {files.map((f, i) => (
              <div key={i}>
                <span>
                  <strong>{f.name}</strong>
                  <small>
                    {f.group} · {Math.ceil(f.size / 1024)} KB
                  </small>
                </span>
                <code>
                  {f.hash.slice(0, 8)}
                  {files.findIndex((v) => v.hash === f.hash) !== i ? " =" : ""}
                </code>
              </div>
            ))}
          </div>
          <button
            className="button amber"
            onClick={() =>
              downloadText("moc-files.json", JSON.stringify(files, null, 2))
            }
          >
            <Icon name="Download" />
            {t(locale, "report")}
          </button>
        </>
      )}
    </section>
  );
}
function clock(minutes: number) {
  return (
    String(Math.floor(minutes / 60)).padStart(2, "0") +
    ":" +
    String(minutes % 60).padStart(2, "0")
  );
}
function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}
export function Scheduler({
  locale,
  entries,
  update,
  remove,
}: {
  locale: Locale;
  entries: Entry[];
  update: (entry: Entry) => Promise<void>;
  remove: (entry: Entry) => void;
}) {
  const [date, setDate] = useState(dayKey());
  const [saving, setSaving] = useState(false);
  const busy = entries
    .filter((entry) => entry.module === "scheduler" && entry.date === date)
    .flatMap((entry) => {
      try {
        const period: unknown = JSON.parse(entry.body);
        if (
          period &&
          typeof period === "object" &&
          "start" in period &&
          "end" in period &&
          Number.isInteger(period.start) &&
          Number.isInteger(period.end) &&
          typeof period.start === "number" &&
          typeof period.end === "number" &&
          period.start >= 0 &&
          period.end <= 1440 &&
          period.end > period.start
        )
          return [{ ...period, start: period.start, end: period.end, entry }];
      } catch {
        /* Ignore malformed imported schedule rows, preserving the original record. */
      }
      return [];
    })
    .sort((a, b) => a.start - b.start);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:00");
  const [error, setError] = useState(false);
  return (
    <section className="panel">
      <p>{t(locale, "scheduleHint")}</p>
      <p className="notice">{t(locale, "scheduleSaved")}</p>
      <label>
        {t(locale, "date")}
        <input
          type="date"
          required
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </label>
      <p>08:00 – 22:00</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const a = parseTime(start),
            b = parseTime(end);
          if (
            !Number.isInteger(a) ||
            !Number.isInteger(b) ||
            a < 0 ||
            b > 1440 ||
            b <= a
          ) {
            setError(true);
            return;
          }
          setError(false);
          if (!validDate(date)) {
            setError(true);
            return;
          }
          const entry = {
            ...makeEntry("scheduler"),
            title: clock(a) + " – " + clock(b),
            date,
            body: JSON.stringify({ start: a, end: b }),
          };
          setSaving(true);
          void update(entry).finally(() => setSaving(false));
        }}
      >
        <div className="split">
          <label>
            {t(locale, "from")}
            <input
              required
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </label>
          <label>
            {t(locale, "to")}
            <input
              required
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </label>
        </div>
        <button className="button amber" disabled={saving}>
          <Icon name="Plus" />
          {t(locale, "busy")}
        </button>
      </form>
      {error && (
        <p role="alert" className="error">
          {t(locale, "invalidInput")}
        </p>
      )}
      <div className="schedule-slots">
        {busy.map((p, i) => (
          <div className="schedule-busy" key={i}>
            <span>
              {clock(p.start)} – {clock(p.end)}
            </span>
            <button
              className="icon-button"
              aria-label={t(locale, "delete")}
              onClick={() => remove(p.entry)}
            >
              <Icon name="X" />
            </button>
          </div>
        ))}
      </div>
      <h3>{t(locale, "free")}</h3>
      <div className="schedule-slots">
        {freePeriods(busy).map((p) => (
          <div className="schedule-free" key={p.start}>
            {clock(p.start)} – {clock(p.end)}
            <span>
              {p.end - p.start} {t(locale, "minutes")}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
export function exportReport(entries: Entry[], locale: Locale) {
  const content = [
    `Mốc · ${t(locale, "report")}`,
    dayKey(),
    "",
    ...entries.flatMap((entry) => {
      const module = modules.find((m) => m.id === entry.module);
      return [
        `## ${entry.title}`,
        module ? moduleName(module, locale) : entry.module,
        ...(["date", "place", "body", "next", "amount", "url"] as const)
          .filter((k) => entry[k])
          .map((k) => `${t(locale, k)}: ${entry[k]}`),
        "",
      ];
    }),
  ].join("\n");
  downloadText("moc-report-" + dayKey() + ".txt", content, "text/plain");
}
