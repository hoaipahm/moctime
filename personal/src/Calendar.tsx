import { useState } from "react";
import { dayKey, type Entry } from "./domain";
import { t, dateFormat, intlLocales, type Locale } from "./i18n";
import { Icon } from "./ui";
import { lunarDate } from "./Dashboard";
export function Calendar({
  locale,
  entries,
  add,
  open,
}: {
  locale: Locale;
  entries: Entry[];
  add: (date: string) => void;
  open: (entry: Entry) => void;
}) {
  const [month, setMonth] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selected, setSelected] = useState(dayKey());
  const offset = (month.getDay() + 6) % 7;
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const selectedEntries = entries.filter(
    (e) => (e.date || dayKey(new Date(e.created))) === selected,
  );
  function step(amount: number) {
    setMonth(new Date(month.getFullYear(), month.getMonth() + amount, 1));
  }
  return (
    <>
      <div className="page-heading">
        <h1>{t(locale, "calendar")}</h1>
        <button className="button amber" onClick={() => add(selected)}>
          <Icon name="Plus" />
          {t(locale, "add")}
        </button>
      </div>
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <div className="calendar-switch">
            <button
              className="icon-button"
              onClick={() => step(-1)}
              aria-label={t(locale, "previous")}
            >
              <Icon name="ChevronLeft" />
            </button>
            <h2>
              {dateFormat(locale, month, { month: "long", year: "numeric" })}
            </h2>
            <button
              className="icon-button"
              onClick={() => step(1)}
              aria-label={t(locale, "following")}
            >
              <Icon name="ChevronRight" />
            </button>
          </div>
          <button
            className="chip amber"
            onClick={() => {
              const now = new Date();
              setMonth(new Date(now.getFullYear(), now.getMonth(), 1));
              setSelected(dayKey());
            }}
          >
            {t(locale, "today")}
          </button>
        </div>
        <div className="calendar-grid">
          {Array.from({ length: 7 }, (_, i) => (
            <div className="weekday" key={"w" + i}>
              {dateFormat(locale, new Date(2026, 10, 23 + i), {
                weekday: "short",
              })}
            </div>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <div key={"e" + i} className="calendar-blank" />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const date = new Date(month.getFullYear(), month.getMonth(), i + 1);
            const key = dayKey(date);
            const has = entries.some(
              (e) => (e.date || dayKey(new Date(e.created))) === key,
            );
            return (
              <button
                key={key}
                className={
                  "calendar-day " +
                  (key === dayKey() ? "current " : "") +
                  (key === selected ? "selected" : "")
                }
                onClick={() => setSelected(key)}
                aria-label={dateFormat(locale, date, { dateStyle: "full" })}
                aria-pressed={key === selected}
              >
                <strong>{i + 1}</strong>
                <small>
                  {
                    new Intl.DateTimeFormat(
                      intlLocales[locale] + "-u-ca-chinese",
                      { day: "numeric" },
                    )
                      .formatToParts(date)
                      .find((part) => part.type === "day")?.value
                  }
                </small>
                {has && <span className="calendar-dot" />}
              </button>
            );
          })}
        </div>
      </section>
      <section className="panel blue selected-date">
        <h2>
          {dateFormat(locale, selected, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </h2>
        <p>
          {t(locale, "lunar")} ·{" "}
          {lunarDate(new Date(selected + "T12:00:00"), locale)}
        </p>
        {selectedEntries.length ? (
          selectedEntries.map((entry) => (
            <button
              className="calendar-entry"
              key={entry.id}
              onClick={() => open(entry)}
            >
              <Icon name="NotebookPen" />
              <span>{entry.title}</span>
              <Icon name="ArrowUpRight" />
            </button>
          ))
        ) : (
          <p>{t(locale, "emptyCalendar")}</p>
        )}
      </section>
    </>
  );
}
