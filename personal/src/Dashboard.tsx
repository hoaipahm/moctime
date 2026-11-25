import { useState } from "react";
import { type Entry, type Preferences, dayKey, streak } from "./domain";
import { t, dateFormat, intlLocales, type Locale } from "./i18n";
import { Icon, TimeDigits, useNow } from "./ui";
import { modules, moduleName } from "./modules";
export function lunarDate(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocales[locale] + "-u-ca-chinese", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}
export function nextHoliday(now: Date) {
  const year = now.getFullYear();
  return [
    { key: "holidayNewYear", month: 1, day: 1 },
    { key: "holidayWomen", month: 3, day: 8 },
    { key: "holidayTeachers", month: 11, day: 20 },
    { key: "holidayChristmas", month: 12, day: 25 },
  ]
    .map((h) => {
      let date = new Date(year, h.month - 1, h.day);
      if (date.getTime() < new Date(dayKey(now) + "T00:00:00").getTime())
        date = new Date(year + 1, h.month - 1, h.day);
      return { ...h, date };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];
}
export function WorldClocks({
  locale,
  large = false,
}: {
  locale: Locale;
  large?: boolean;
}) {
  const now = useNow();
  return (
    <section className={"panel blue world-panel " + (large ? "full" : "")}>
      <div className="section-heading">
        <h3>
          <Icon name="Globe" />
          {t(locale, "worldclock")}
        </h3>
        <span className="live-dot" />
      </div>
      <div className="world-clocks">
        {[
          { city: "Hồ Chí Minh", zone: "Asia/Ho_Chi_Minh" },
          { city: "Paris", zone: "Europe/Paris" },
          { city: "New York", zone: "America/New_York" },
          { city: "Tokyo", zone: "Asia/Tokyo" },
        ].map((city) => (
          <div key={city.zone}>
            <span>{city.city}</span>
            <strong>
              {new Intl.DateTimeFormat(intlLocales[locale], {
                timeZone: city.zone,
                hour: "2-digit",
                minute: "2-digit",
                hourCycle: "h23",
              }).format(now)}
            </strong>
            <small>
              {new Intl.DateTimeFormat(intlLocales[locale], {
                timeZone: city.zone,
                weekday: "short",
                day: "numeric",
                month: "short",
              }).format(now)}
            </small>
          </div>
        ))}
      </div>
    </section>
  );
}
export function Dashboard({
  preferences: p,
  entries,
  navigate,
  add,
  onToggle,
}: {
  preferences: Preferences;
  entries: Entry[];
  navigate: (route: string) => void;
  add: (module: string) => void;
  onToggle: (entry: Entry) => void;
}) {
  const locale = p.locale;
  const now = useNow();
  const [note, setNote] = useState("");
  const holiday = nextHoliday(now);
  const countdown = entries
    .filter((e) => e.module === "countdown" && e.date && e.date >= dayKey())
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const remaining = countdown
    ? Math.max(
        0,
        Math.floor(
          (new Date(countdown.date + "T00:00:00").getTime() - now.getTime()) /
            1000,
        ),
      )
    : 0;
  const todayHabits = entries
    .filter((e) => e.module === "habits" && !e.done)
    .slice(0, 4);
  const recent = [...entries]
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 4);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {t(locale, "today")}
            <span className="heading-dot" />
          </h1>
          <p>{t(locale, "yourDay")}</p>
        </div>
        <button className="button" onClick={() => add("notes")}>
          <Icon name="Plus" />
          {t(locale, "quickAdd")}
        </button>
      </div>
      <section className="panel profile-card">
        <button
          className="avatar"
          onClick={() => navigate("profile")}
          aria-label={t(locale, "profile")}
        >
          {p.name ? (
            p.name.slice(0, 2).toUpperCase()
          ) : (
            <Icon name="User" size={34} />
          )}
        </button>
        <div className="profile-copy">
          <div className="profile-title">
            <h2>{p.name || t(locale, "yourspace")}</h2>
            <span className="badge teal">{t(locale, "local")}</span>
          </div>
          <p>{p.bio || t(locale, "tagline")}</p>
          <div className="profile-meta">
            <Icon name="MapPin" size={14} />
            <span>{p.zone.replaceAll("_", " ")}</span>
            <span className="meta-divider">/</span>
            <span>
              {entries.length} {t(locale, "records")}
            </span>
          </div>
        </div>
        <button
          className="icon-button"
          aria-label={t(locale, "edit")}
          onClick={() => navigate("profile")}
        >
          <Icon name="ArrowUpRight" />
        </button>
      </section>
      <div className="dashboard-grid">
        <section className="panel amber clock-panel">
          <div className="clock-label">
            <span className="live-dot" />
            {t(locale, "greet")}
            {p.name ? ", " + p.name : ""}
            <Icon name="Sun" size={22} />
          </div>
          <div className="big-clock">
            {new Intl.DateTimeFormat("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hourCycle: "h23",
              timeZone: p.zone,
            }).format(now)}
          </div>
          <h2>
            {dateFormat(locale, now, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
              timeZone: p.zone,
            })}
          </h2>
          <div className="lunar-line">
            <Icon name="Moon" size={16} />
            {t(locale, "lunar")} · {lunarDate(now, locale)}
          </div>
        </section>
        <section className="panel daily-panel">
          <div className="section-heading">
            <h3>
              <Icon name="Sparkles" />
              {t(locale, "todayPlan")}
            </h3>
            <span className="badge">
              {entries.filter((e) => e.done).length} {t(locale, "doneCount")}
            </span>
          </div>
          {todayHabits.length ? (
            todayHabits.map((entry) => (
              <button
                key={entry.id}
                className={
                  "habit-row " +
                  (entry.checks.includes(dayKey()) ? "is-done" : "")
                }
                onClick={() => onToggle(entry)}
              >
                <span className="check-box">
                  {entry.checks.includes(dayKey()) && (
                    <Icon name="Check" size={14} />
                  )}
                </span>
                <span>{entry.title}</span>
                <small>{streak(entry.checks)}d</small>
              </button>
            ))
          ) : (
            <div className="daily-empty">
              <p>{t(locale, "smallSteps")}</p>
              <button className="text-button" onClick={() => add("habits")}>
                <Icon name="Plus" size={17} />
                {t(locale, "habits")}
              </button>
            </div>
          )}
          <button
            className="text-button daily-link"
            onClick={() => navigate("timer")}
          >
            {t(locale, "timeForYou")}
            <Icon name="ArrowRight" size={17} />
          </button>
        </section>
        <section className="panel coral holiday-panel">
          <div className="section-heading">
            <h3>{t(locale, "upcoming")}</h3>
            <Icon name="CalendarDays" />
          </div>
          <h2>{t(locale, holiday.key as "holidayNewYear")}</h2>
          <p>
            {dateFormat(locale, holiday.date, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <div className="countdown-digits">
            {String(
              Math.ceil(
                (holiday.date.getTime() -
                  new Date(dayKey() + "T00:00:00").getTime()) /
                  86400000,
              ),
            ).padStart(2, "0")}
            <span>{t(locale, "days")}</span>
            <Icon name="Flag" size={28} />
          </div>
        </section>
        <section className="panel teal countdown-panel">
          <div className="section-heading">
            <h3>{t(locale, "nextDate")}</h3>
            <Icon name="Hourglass" />
          </div>
          <h2>{countdown?.title || t(locale, "nothingPinned")}</h2>
          {countdown ? (
            <>
              <div className="countdown-time">
                <strong>{Math.floor(remaining / 86400)}</strong>{" "}
                {t(locale, "days")} <TimeDigits seconds={remaining % 86400} />
              </div>
              <button className="chip" onClick={() => navigate("countdown")}>
                {t(locale, "countdown")}
                <Icon name="ArrowRight" size={14} />
              </button>
            </>
          ) : (
            <button
              className="button small amber"
              onClick={() => add("countdown")}
            >
              <Icon name="Plus" size={16} />
              {t(locale, "addDate")}
            </button>
          )}
        </section>
        <WorldClocks locale={locale} />
        <section className="panel note-panel">
          <h3>
            <Icon name="NotebookPen" />
            {t(locale, "quickNote")}
          </h3>
          <textarea
            aria-label={t(locale, "quickNote")}
            placeholder={t(locale, "emptyHint")}
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            className="text-button"
            onClick={() => {
              sessionStorage.setItem("moc-note-draft", note);
              add("notes");
            }}
          >
            {t(locale, "save")}
            <Icon name="ArrowUpRight" size={17} />
          </button>
        </section>
      </div>
      <div className="section-heading space-heading">
        <h2>{t(locale, "favorites")}</h2>
        <button className="text-button" onClick={() => navigate("library")}>
          {t(locale, "explore")}
          <Icon name="ArrowRight" size={17} />
        </button>
      </div>
      <div className="shortcut-grid">
        {p.favorites
          .map((id) => modules.find((m) => m.id === id))
          .filter((m) => m !== undefined)
          .map((module) => (
            <button
              key={module.id}
              className="shortcut"
              onClick={() => navigate(module.id)}
            >
              <span className={"shortcut-icon " + module.color}>
                <Icon name={module.icon} size={23} />
              </span>
              <span>{moduleName(module, locale)}</span>
              <Icon name="ArrowUpRight" size={16} />
            </button>
          ))}
      </div>
      {recent.length > 0 && (
        <>
          <div className="section-heading space-heading">
            <h2>{t(locale, "recent")}</h2>
          </div>
          <div className="recent-list">
            {recent.map((entry) => (
              <button key={entry.id} onClick={() => navigate(entry.module)}>
                <span className="recent-date">
                  {dateFormat(locale, entry.updated, {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <strong>{entry.title}</strong>
                <Icon name="ArrowUpRight" size={18} />
              </button>
            ))}
          </div>
        </>
      )}
      <footer className="page-footer">
        <span className="brand-small">
          mốc<span>®</span>
        </span>
        {t(locale, "privacy")}
      </footer>
    </>
  );
}
