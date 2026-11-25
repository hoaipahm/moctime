import { useEffect, useRef, useState, type CSSProperties } from "react";
import { t, locales, intlLocales, type CopyKey } from "./i18n";
import { getTheme } from "./themes";
import { modules, moduleName, type Category } from "./modules";
import {
  type Entry,
  type Preferences,
  type Snapshot,
  defaultPreferences,
  makeEntry,
  dayKey,
} from "./domain";
import {
  loadData,
  putEntry,
  removeEntry,
  putPreferences,
  replaceData,
} from "./storage";
import { Dashboard, WorldClocks } from "./Dashboard";
import { Calendar } from "./Calendar";
import { Focus } from "./Focus";
import { ModuleView } from "./ModuleView";
import { EntryForm } from "./EntryForm";
import { Settings, Profile } from "./Settings";
import { Icon, Sheet } from "./ui";
import { playAmbient, stopAmbient, setAmbientVolume, tapSound } from "./media";
import { reminderPlan } from "./reminders";
const navItems: [string, string, CopyKey][] = [
  ["today", "House", "today"],
  ["library", "LayoutGrid", "library"],
  ["profile", "User", "profile"],
  ["worldclock", "Globe", "worldclock"],
  ["calendar", "CalendarDays", "calendar"],
  ["countdown", "Hourglass", "countdown"],
  ["timer", "Clock", "timer"],
  ["notes", "NotebookPen", "notes"],
  ["habits", "ListChecks", "habits"],
  ["toolbox", "Wrench", "tools"],
];
export function App() {
  const [p, setP] = useState<Preferences>(defaultPreferences);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState(false);
  const [route, setRoute] = useState("today");
  const history = useRef<string[]>([]);
  const [menu, setMenu] = useState(false);
  const [editor, setEditor] = useState<Entry | null>(null);
  const [deleting, setDeleting] = useState<Entry | null>(null);
  const [toast, setToast] = useState<CopyKey | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sound, setSound] = useState<"rain" | "piano" | "night" | null>(null);
  const [volume, setVolume] = useState(0.35);
  const locale = p.locale;
  const theme = getTheme(p.theme);
  useEffect(() => {
    if (loading) return;
    try {
      if (
        window.MocNative?.syncReminders?.(
          JSON.stringify(reminderPlan(entries, locale)),
        ) === false
      )
        setToast("error");
    } catch {
      setToast("error");
    }
  }, [loading, entries, locale]);
  useEffect(() => {
    window.MocNative?.setBackCanExit?.(
      route === "today" && !editor && !deleting && !menu,
    );
  }, [route, editor, deleting, menu]);
  useEffect(() => {
    if (loading) return;
    const open = () => {
      const id = window.MocNative?.notificationTarget?.();
      const entry = entries.find((value) => value.id === id);
      if (entry) {
        history.current.push(route);
        setRoute(entry.module);
        setEditor(entry);
      }
    };
    open();
    window.addEventListener("moc-notification", open);
    return () => window.removeEventListener("moc-notification", open);
  }, [loading, entries, route]);
  useEffect(() => {
    void loadData()
      .then((data) => {
        setEntries(data.entries);
        setP(data.preferences);
      })
      .catch(() => setFatal(true))
      .finally(() => setLoading(false));
    return () => stopAmbient();
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = "Mốc · " + t(locale, "yourspace");
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme[2]);
  }, [locale, theme]);
  useEffect(() => {
    if (!toast) return;
    const handle = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(handle);
  }, [toast]);
  useEffect(() => {
    function press(event: PointerEvent) {
      if (
        !(event.target instanceof Element) ||
        !event.target.closest("button,a")
      )
        return;
      try {
        if (p.touch) tapSound();
        if (p.haptics) {
          if (window.MocNative) window.MocNative.vibrate();
          else navigator.vibrate?.(8);
        }
      } catch {
        /* Feedback is optional; actions remain available. */
      }
    }
    document.addEventListener("pointerdown", press);
    return () => document.removeEventListener("pointerdown", press);
  }, [p.touch, p.haptics]);
  useEffect(() => {
    function back() {
      if (editor) setEditor(null);
      else if (deleting) setDeleting(null);
      else if (menu) setMenu(false);
      else setRoute(history.current.pop() ?? "today");
    }
    window.addEventListener("moc-back", back);
    return () => window.removeEventListener("moc-back", back);
  }, [editor, deleting, menu]);
  const notify = (key: CopyKey) => setToast(key);
  function navigate(next: string) {
    if (next !== route) {
      history.current.push(route);
      if (history.current.length > 100) history.current.shift();
    }
    setRoute(next);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  async function updatePreferences(next: Preferences) {
    try {
      await putPreferences(next);
      setP(next);
      return true;
    } catch {
      notify("dataError");
      return false;
    }
  }
  async function updateEntry(entry: Entry) {
    const next = { ...entry, updated: new Date().toISOString() };
    try {
      await putEntry(next);
      setEntries((old) =>
        old.some((e) => e.id === next.id)
          ? old.map((e) => (e.id === next.id ? next : e))
          : [...old, next],
      );
    } catch {
      notify("dataError");
      throw new Error("save");
    }
  }
  function add(module: string, date?: string) {
    const draft = makeEntry(module);
    if (date) draft.date = date;
    if (module === "notes") {
      const note = sessionStorage.getItem("moc-note-draft");
      if (note) {
        draft.title = note;
        sessionStorage.removeItem("moc-note-draft");
      }
    }
    setEditor(draft);
  }
  function toggle(entry: Entry) {
    const checks = entry.checks.includes(dayKey())
      ? entry.checks.filter((d) => d !== dayKey())
      : [...entry.checks, dayKey()];
    void updateEntry({ ...entry, checks }).catch(() => undefined);
  }
  function ambient(mode: "rain" | "piano" | "night" | null) {
    try {
      if (!mode || sound === mode) {
        stopAmbient();
        setSound(null);
      } else {
        playAmbient(mode, volume);
        setSound(mode);
      }
    } catch {
      notify("error");
    }
  }
  const selectedModule = modules.find((m) => m.id === route);
  const currentTitle =
    route === "library"
      ? t(locale, "library")
      : route === "toolbox"
        ? t(locale, "tools")
        : selectedModule
          ? moduleName(selectedModule, locale)
          : t(
              locale,
              ([
                "today",
                "calendar",
                "settings",
                "profile",
                "worldclock",
                "timer",
              ].includes(route)
                ? route
                : "today") as CopyKey,
            );
  const filtered = modules.filter(
    (module) =>
      (category === "all" || module.category === category) &&
      [
        ...module.names,
        ...entries
          .filter((e) => e.module === module.id)
          .map((e) => [e.title, e.body, e.place, e.tag].join(" ")),
      ]
        .join(" ")
        .toLocaleLowerCase()
        .includes(search.toLocaleLowerCase()),
  );
  const vars = {
    "--bg": theme[2],
    "--paper": theme[3],
    "--amber": theme[4],
    "--coral": theme[5],
    "--teal": theme[6],
    "--blue": theme[7],
    "--ink": theme[8],
  } as CSSProperties;
  if (loading)
    return (
      <div className="boot">
        <span className="brand-logo">m</span>
        <p>{t(locale, "loading")}</p>
      </div>
    );
  if (fatal)
    return (
      <div className="boot">
        <Icon name="FolderOpen" size={40} />
        <p>{t(locale, "dataError")}</p>
        <button className="button amber" onClick={() => location.reload()}>
          {t(locale, "reset")}
        </button>
      </div>
    );
  return (
    <div className="app" style={vars}>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("today")}
          aria-label="Mốc"
        >
          <span className="brand-logo">
            <Icon name="Clock" size={23} />
          </span>
          <strong>
            Mốc<span className="brand-star">✳</span>
          </strong>
        </button>
        <p className="sidebar-caption">{t(locale, "yourspace")}</p>
        <nav aria-label={t(locale, "menu")}>
          {navItems.map(([id, icon, key]) => (
            <button
              key={id}
              className={route === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon name={icon} size={18} />
              <span>{t(locale, key)}</span>
              {route === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={
              route === "settings" ? "settings-link active" : "settings-link"
            }
            onClick={() => navigate("settings")}
          >
            <Icon name="Settings" size={18} />
            {t(locale, "settings")}
          </button>
          <div className="sidebar-sound">
            <button
              className={"chip " + (sound ? "amber" : "")}
              onClick={() => setMenu(true)}
            >
              <Icon name="Music" size={15} />
              {t(locale, "music")}
            </button>
            <button
              className="icon-button"
              aria-label={t(locale, "touch")}
              onClick={() => void updatePreferences({ ...p, touch: !p.touch })}
            >
              <Icon name="Volume2" size={17} />
            </button>
          </div>
          <div className="sidebar-languages">
            {locales.map((lang) => (
              <button
                key={lang}
                className={"chip " + (lang === locale ? "amber" : "")}
                onClick={() => void updatePreferences({ ...p, locale: lang })}
                aria-pressed={lang === locale}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <small>{t(locale, "version")}</small>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">
              <Icon name="Clock" size={20} />
            </span>
            <span className="desktop-breadcrumb">
              Mốc <span>/</span>
            </span>
            <strong>{currentTitle}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className={"button small sound-button " + (sound ? "amber" : "")}
              aria-label={t(locale, "music")}
              onClick={() => setMenu(true)}
            >
              <Icon name="Music" size={17} />
              <span>{t(locale, "music")}</span>
            </button>
            <button
              className="icon-button desktop-only"
              aria-label={t(locale, "settings")}
              onClick={() => navigate("settings")}
            >
              <Icon name="Palette" size={20} />
            </button>
            <button
              className="button small menu-button"
              onClick={() => setMenu(true)}
            >
              <Icon name="Menu" size={18} />
              {t(locale, "menu")}
            </button>
          </div>
        </header>
        <main id="main-content" key={route}>
          {route === "today" && (
            <Dashboard
              preferences={p}
              entries={entries}
              navigate={navigate}
              add={add}
              onToggle={toggle}
            />
          )}
          {route === "library" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>{t(locale, "spaces")}</h1>
                  <p>{t(locale, "tagline")}</p>
                </div>
                <span className="space-counter">
                  {modules.length}
                  <Icon name="LayoutGrid" size={22} />
                </span>
              </div>
              <div className="search-box">
                <Icon name="Search" />
                <input
                  aria-label={t(locale, "search")}
                  placeholder={t(locale, "search")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    className="icon-button"
                    aria-label={t(locale, "reset")}
                    onClick={() => setSearch("")}
                  >
                    <Icon name="X" size={16} />
                  </button>
                )}
              </div>
              <div className="tabs category-tabs" role="group">
                {(
                  ["all", "life", "creative", "work", "utilities"] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    className={"chip " + (cat === category ? "amber" : "")}
                    aria-pressed={cat === category}
                    onClick={() => setCategory(cat)}
                  >
                    {t(locale, cat)}
                  </button>
                ))}
              </div>
              <div className="module-grid">
                {filtered.map((module) => (
                  <button
                    className="module-tile"
                    key={module.id}
                    onClick={() => navigate(module.id)}
                  >
                    <span className={"module-symbol " + module.color}>
                      <Icon name={module.icon} size={29} />
                    </span>
                    <div>
                      <h2>{moduleName(module, locale)}</h2>
                      <span>
                        {t(locale, module.category)} ·{" "}
                        {entries.filter((e) => e.module === module.id).length}{" "}
                        {t(locale, "records")}
                      </span>
                    </div>
                    <Icon name="ArrowUpRight" size={20} />
                  </button>
                ))}
              </div>
              {filtered.length === 0 && <p>{t(locale, "noResults")}</p>}
            </>
          )}
          {route === "calendar" && (
            <Calendar
              locale={locale}
              entries={entries}
              add={(date) => add("notes", date)}
              open={setEditor}
            />
          )}
          {route === "worldclock" && (
            <>
              <div className="page-heading">
                <h1>{t(locale, "worldclock")}</h1>
              </div>
              <WorldClocks locale={locale} large />
            </>
          )}
          {route === "timer" && <Focus locale={locale} />}
          {route === "settings" && (
            <Settings
              preferences={p}
              entries={entries}
              update={updatePreferences}
              notify={notify}
              restore={async (snapshot) => {
                await replaceData(snapshot);
                setP(snapshot.preferences);
                setEntries(snapshot.entries);
              }}
            />
          )}
          {route === "profile" && (
            <Profile preferences={p} update={updatePreferences} />
          )}
          {selectedModule && (
            <ModuleView
              key={selectedModule.id}
              module={selectedModule}
              preferences={p}
              entries={entries}
              add={() => add(selectedModule.id)}
              edit={setEditor}
              remove={setDeleting}
              update={async (e) => {
                try {
                  await updateEntry(e);
                } catch {
                  /* The save error is displayed by updateEntry. */
                }
              }}
              toggle={toggle}
              favorite={() =>
                void updatePreferences({
                  ...p,
                  favorites: p.favorites.includes(selectedModule.id)
                    ? p.favorites.filter((id) => id !== selectedModule.id)
                    : [...p.favorites, selectedModule.id],
                })
              }
              notify={notify}
            />
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label={t(locale, "menu")}>
        {[
          ["today", "House", "today"],
          ["library", "LayoutGrid", "library"],
        ].map(([id, icon, key]) => (
          <button
            key={id}
            className={route === id ? "active" : ""}
            onClick={() => navigate(id)}
          >
            <Icon name={icon} size={22} />
            <span>{t(locale, key as CopyKey)}</span>
          </button>
        ))}
        <button
          className="bottom-add"
          aria-label={t(locale, "add")}
          onClick={() => add("notes")}
        >
          <Icon name="Plus" size={26} />
        </button>
        <button
          className={route === "calendar" ? "active" : ""}
          onClick={() => navigate("calendar")}
        >
          <Icon name="CalendarDays" size={22} />
          <span>{t(locale, "calendar")}</span>
        </button>
        <button className={menu ? "active" : ""} onClick={() => setMenu(true)}>
          <Icon name="Menu" size={22} />
          <span>{t(locale, "menu")}</span>
        </button>
      </nav>
      {menu && (
        <Sheet
          locale={locale}
          title={t(locale, "menu")}
          onClose={() => setMenu(false)}
          className="app-menu"
        >
          <div className="menu-languages">
            {locales.map((lang) => (
              <button
                key={lang}
                className={"chip " + (lang === locale ? "amber" : "")}
                onClick={() => void updatePreferences({ ...p, locale: lang })}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <section className="panel blue soundscape">
            <h3>
              <Icon name="Music" />
              {t(locale, "music")}
            </h3>
            <p>{t(locale, "soundHint")}</p>
            <div className="sound-options">
              {(["soundOff", "piano", "rain", "night"] as const).map((mode) => (
                <button
                  className={
                    "chip " +
                    ((mode === "soundOff" && !sound) || sound === mode
                      ? "amber"
                      : "")
                  }
                  key={mode}
                  onClick={() => ambient(mode === "soundOff" ? null : mode)}
                >
                  {t(locale, mode)}
                </button>
              ))}
            </div>
            <label className="volume-label">
              {t(locale, "volume")}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setVolume(value);
                  setAmbientVolume(value);
                }}
              />
            </label>
            <div className="sound-options">
              <button
                className={"chip " + (p.touch ? "amber" : "")}
                onClick={() =>
                  void updatePreferences({ ...p, touch: !p.touch })
                }
                aria-pressed={p.touch}
              >
                <Icon name="Volume2" size={16} />
                {t(locale, "touch")}
              </button>
              <button
                className={"chip " + (p.haptics ? "amber" : "")}
                onClick={() =>
                  void updatePreferences({ ...p, haptics: !p.haptics })
                }
                aria-pressed={p.haptics}
              >
                {t(locale, "haptics")}
              </button>
            </div>
          </section>
          <div className="menu-grid">
            {[
              ...navItems,
              ["settings", "Settings", "settings"] as [string, string, CopyKey],
            ].map(([id, icon, key]) => (
              <button key={id} onClick={() => navigate(id)}>
                <Icon name={icon} />
                {t(locale, key)}
                <Icon name="ChevronRight" size={17} />
              </button>
            ))}
          </div>
          <p className="menu-footer">
            {new Intl.NumberFormat(intlLocales[locale]).format(entries.length)}{" "}
            {t(locale, "records")} · {t(locale, "local")}
          </p>
        </Sheet>
      )}
      {editor && (
        <EntryForm
          key={editor.id}
          module={modules.find((m) => m.id === editor.module) ?? modules[0]}
          entry={editor}
          locale={locale}
          onClose={() => setEditor(null)}
          onSave={async (entry) => {
            await updateEntry(entry);
            notify("saved");
          }}
        />
      )}
      {deleting && (
        <Sheet
          locale={locale}
          title={t(locale, "confirmDelete")}
          onClose={() => setDeleting(null)}
        >
          <p>{deleting.title}</p>
          <div className="form-actions">
            <button className="button" onClick={() => setDeleting(null)}>
              {t(locale, "cancel")}
            </button>
            <button
              className="button coral"
              onClick={() => {
                const id = deleting.id;
                void removeEntry(id)
                  .then(() => {
                    setEntries((old) => old.filter((e) => e.id !== id));
                    setDeleting(null);
                    notify("deleted");
                  })
                  .catch(() => notify("dataError"));
              }}
            >
              <Icon name="Trash2" />
              {t(locale, "delete")}
            </button>
          </div>
        </Sheet>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon
            name={
              ["error", "dataError", "badBackup", "mediaError"].includes(toast)
                ? "Flag"
                : "Check"
            }
            size={18}
          />
          {t(locale, toast)}
        </div>
      )}
    </div>
  );
}
