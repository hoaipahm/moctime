import { useState } from "react";
import {
  type Entry,
  type Preferences,
  dayKey,
  daysBetween,
  streak,
} from "./domain";
import { t, dateFormat, intlLocales, type CopyKey } from "./i18n";
import { type Module, moduleName, modules } from "./modules";
import { Icon, Empty, Sheet } from "./ui";
import { Toolbox, FileOrganizer, Scheduler, exportReport } from "./Tools";
export function ModuleView({
  module,
  preferences: p,
  entries,
  add,
  edit,
  remove,
  update,
  toggle,
  favorite,
  notify,
}: {
  module: Module;
  preferences: Preferences;
  entries: Entry[];
  add: () => void;
  edit: (entry: Entry) => void;
  remove: (entry: Entry) => void;
  update: (entry: Entry) => Promise<void>;
  toggle: (entry: Entry) => void;
  favorite: () => void;
  notify: (key: CopyKey) => void;
}) {
  const locale = p.locale;
  const records = entries
    .filter((e) => e.module === module.id)
    .sort((a, b) => b.created.localeCompare(a.created));
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Entry | null>(null);
  const [demo, setDemo] = useState<number | null>(null);
  const visible = records.filter((e) =>
    [e.title, e.body, e.place, e.tag]
      .join(" ")
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  const canAdd = module.fields.length > 0;
  const isGallery = [
    "museum",
    "wardrobe",
    "design",
    "postcards",
    "firsts",
    "demos",
  ].includes(module.id);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            <span className={"title-icon " + module.color}>
              <Icon name={module.icon} size={26} />
            </span>
            {moduleName(module, locale)}
          </h1>
          <p>
            {t(locale, module.category)} · {records.length}{" "}
            {t(locale, "records")}
          </p>
        </div>
        <div className="heading-actions">
          <button
            className={
              "icon-button " + (p.favorites.includes(module.id) ? "amber" : "")
            }
            onClick={favorite}
            aria-label={t(
              locale,
              p.favorites.includes(module.id) ? "unpin" : "pin",
            )}
          >
            <Icon name="Pin" />
          </button>
          {canAdd && (
            <button className="button amber" onClick={add}>
              <Icon name="Plus" />
              {t(locale, "add")}
            </button>
          )}
        </div>
      </div>
      {module.hint && <p className="notice">{t(locale, module.hint)}</p>}
      {module.id === "toolbox" && (
        <Toolbox locale={locale} notify={notify} />
      )}{" "}
      {module.id === "diff" && (
        <Toolbox locale={locale} notify={notify} initial="diff" />
      )}
      {module.id === "downloads" && (
        <FileOrganizer locale={locale} notify={notify} />
      )}{" "}
      {module.id === "scheduler" && (
        <Scheduler
          locale={locale}
          entries={entries}
          update={update}
          remove={remove}
        />
      )}
      {module.id === "reports" && (
        <button
          className="button teal report-button"
          onClick={() => exportReport(entries, locale)}
        >
          <Icon name="Download" />
          {t(locale, "report")} · {entries.length}
        </button>
      )}
      {["outings", "quests", "wardrobe"].includes(module.id) &&
        records.length > 0 && (
          <div className="pick-bar">
            <button
              className="button teal"
              onClick={() =>
                setPicked(records[Math.floor(Math.random() * records.length)])
              }
            >
              <Icon name="Sparkles" />
              {t(locale, "choose")}
            </button>
            {picked && (
              <strong>
                {t(locale, "picked")}: {picked.title}
              </strong>
            )}
          </div>
        )}
      {module.id === "finance" && (
        <section className="panel teal total-panel">
          <span>{t(locale, "financeTotal")}</span>
          <strong>
            {new Intl.NumberFormat(intlLocales[locale], {
              style: "currency",
              currency: "VND",
            }).format(
              records.reduce((sum, e) => sum + Number(e.amount || 0), 0),
            )}
          </strong>
        </section>
      )}
      {module.id === "universe" && (
        <section className="universe panel">
          <svg
            viewBox="0 0 600 230"
            role="img"
            aria-label={moduleName(module, locale)}
          >
            <ellipse cx="300" cy="115" rx="90" ry="70" />
            <ellipse cx="300" cy="115" rx="170" ry="92" />
            <ellipse cx="300" cy="115" rx="260" ry="108" />
            <circle cx="300" cy="115" r="29" className="sun" />
            {records.slice(0, 9).map((e, i) => {
              const angle = i * 2.4;
              const radius = 80 + i * 20;
              const x = 300 + Math.cos(angle) * radius;
              const y = 115 + Math.sin(angle) * Math.min(90, radius / 2);
              return (
                <g
                  key={e.id}
                  tabIndex={0}
                  role="button"
                  aria-label={e.title}
                  onClick={() => edit(e)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") edit(e);
                  }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={12 + Number(e.progress || 0) / 10}
                    className={"planet p" + (i % 4)}
                  />
                  <text x={x} y={y + 35} textAnchor="middle">
                    {e.title.slice(0, 16)}
                  </text>
                </g>
              );
            })}
          </svg>
        </section>
      )}
      {module.id === "thoughts" && records.length > 0 && (
        <div className="panel thought-map">
          <h3>{t(locale, "drawing")}</h3>
          {Array.from(new Set(records.map((e) => e.tag).filter(Boolean))).map(
            (tag) => (
              <div className="thought-group" key={tag}>
                <span className="badge blue">{tag}</span>
                <span className="thought-connector" />
                {records
                  .filter((e) => e.tag === tag)
                  .map((e) => (
                    <button className="chip" key={e.id} onClick={() => edit(e)}>
                      {e.title}
                    </button>
                  ))}
              </div>
            ),
          )}
        </div>
      )}
      {module.id === "demos" && records.length > 0 && (
        <button
          className="button blue report-button"
          onClick={() => setDemo(0)}
        >
          <Icon name="Presentation" />
          {t(locale, "start")}
        </button>
      )}
      {canAdd && records.length > 0 && (
        <div className="search-box module-search">
          <Icon name="Search" size={19} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, "search")}
            aria-label={t(locale, "search")}
          />
          <span>{visible.length}</span>
        </div>
      )}
      {canAdd &&
        (records.length === 0 ? (
          <Empty locale={locale} onAdd={add} />
        ) : (
          <div className={"entries " + (isGallery ? "gallery" : "")}>
            {visible.map((entry) => {
              const locked = module.id === "letters" && entry.date > dayKey();
              const checked = entry.checks.includes(dayKey());
              return (
                <article
                  key={entry.id}
                  className={"panel entry " + (entry.done ? "entry-done" : "")}
                  data-entry={entry.id}
                >
                  {entry.photo && !locked && (
                    <img
                      className="entry-photo"
                      src={entry.photo}
                      alt={entry.title}
                      loading="lazy"
                    />
                  )}
                  <div className="entry-content">
                    <div className="entry-topline">
                      <span className={"badge " + module.color}>
                        {entry.tag ||
                          dateFormat(locale, entry.created, {
                            day: "numeric",
                            month: "short",
                          })}
                      </span>
                      {entry.done && (
                        <span className="done-badge">
                          <Icon name="CheckCheck" size={16} />
                          {t(locale, "completed")}
                        </span>
                      )}
                    </div>
                    <h2>{entry.title}</h2>
                    {locked ? (
                      <div className="letter-locked">
                        <Icon name="Mail" size={36} />
                        <strong>{t(locale, "locked")}</strong>
                        <span>
                          {dateFormat(locale, entry.date, {
                            dateStyle: "long",
                          })}
                        </span>
                      </div>
                    ) : (
                      <>
                        {entry.body && module.id === "screenshot" ? (
                          <div className="checklist">
                            {entry.body
                              .split("\n")
                              .filter(Boolean)
                              .map((line, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    const lines = entry.body.split("\n");
                                    const index = lines
                                      .map((v, j) => ({ v, j }))
                                      .filter((v) => v.v)[i].j;
                                    lines[index] = line.startsWith("[x] ")
                                      ? line.slice(4)
                                      : "[x] " + line.replace(/^\[ \] /, "");
                                    void update({
                                      ...entry,
                                      body: lines.join("\n"),
                                    });
                                  }}
                                >
                                  <span className="check-box">
                                    {line.startsWith("[x] ") && (
                                      <Icon name="Check" size={14} />
                                    )}
                                  </span>
                                  <span>{line.replace(/^\[[x ]\] /, "")}</span>
                                </button>
                              ))}
                          </div>
                        ) : (
                          entry.body && (
                            <p className="entry-body">{entry.body}</p>
                          )
                        )}
                        {entry.audio && (
                          <audio controls preload="none" src={entry.audio} />
                        )}
                      </>
                    )}
                    {entry.place && (
                      <p className="entry-detail">
                        <Icon name="MapPin" size={16} />
                        {entry.place}
                      </p>
                    )}
                    {entry.reminderAt && (
                      <p className="entry-detail">
                        <Icon name="Clock" size={16} />
                        {t(locale, "reminderAt")}:{" "}
                        {dateFormat(locale, entry.reminderAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    )}
                    {entry.date && (
                      <p className="entry-detail">
                        <Icon name="CalendarDays" size={16} />
                        {dateFormat(locale, entry.date, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {["countdown", "deadlines", "pantry"].includes(
                          module.id,
                        ) && (
                          <span
                            className={
                              "badge " +
                              (entry.date < dayKey() ? "coral" : "teal")
                            }
                          >
                            {daysBetween(dayKey(), entry.date)}{" "}
                            {t(locale, "days")}
                          </span>
                        )}
                      </p>
                    )}
                    {entry.next && (
                      <p className="next-step">
                        <Icon name="ArrowRight" size={16} />
                        {entry.next}
                      </p>
                    )}
                    {entry.progress && (
                      <div
                        className="progress-bar"
                        aria-label={
                          t(locale, "progress") + " " + entry.progress + "%"
                        }
                      >
                        <span style={{ width: entry.progress + "%" }} />
                        <small>{entry.progress}%</small>
                      </div>
                    )}
                    {entry.amount && (
                      <strong className="entry-amount">
                        {new Intl.NumberFormat(intlLocales[locale], {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(entry.amount))}
                      </strong>
                    )}
                    {entry.url && (
                      <a
                        href={entry.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-button"
                      >
                        {t(locale, "linkOpen")}
                        <Icon name="ArrowUpRight" size={16} />
                      </a>
                    )}
                    {module.id === "habits" && (
                      <div className="habit-controls">
                        <button
                          className={"button " + (checked ? "teal" : "amber")}
                          onClick={() => toggle(entry)}
                        >
                          <Icon name="Check" />
                          {t(locale, checked ? "checked" : "checkIn")}
                        </button>
                        <small>
                          {streak(entry.checks)} {t(locale, "streak")}
                        </small>
                      </div>
                    )}
                    <div className="entry-actions">
                      <button
                        className="text-button"
                        onClick={() => edit(entry)}
                      >
                        <Icon name="NotebookPen" size={16} />
                        {t(locale, "edit")}
                      </button>
                      <button
                        className="icon-button"
                        aria-label={t(locale, entry.done ? "reopen" : "finish")}
                        onClick={() =>
                          void update({ ...entry, done: !entry.done })
                        }
                      >
                        <Icon name="Check" size={17} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={t(locale, "delete")}
                        onClick={() => remove(entry)}
                      >
                        <Icon name="Trash2" size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
            {visible.length === 0 && <p>{t(locale, "noResults")}</p>}
          </div>
        ))}
      {demo !== null && records[demo] && (
        <Sheet
          locale={locale}
          title={`${demo + 1} / ${records.length}`}
          onClose={() => setDemo(null)}
          className="demo-sheet"
        >
          <h2>{records[demo].title}</h2>
          {records[demo].photo && (
            <img src={records[demo].photo} alt={records[demo].title} />
          )}
          <p className="entry-body">{records[demo].body}</p>
          <div className="form-actions">
            <button
              className="button"
              onClick={() => setDemo(Math.max(0, demo - 1))}
              disabled={demo === 0}
            >
              {t(locale, "previous")}
            </button>
            <button
              className="button amber"
              onClick={() => setDemo(Math.min(records.length - 1, demo + 1))}
              disabled={demo === records.length - 1}
            >
              {t(locale, "following")}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
