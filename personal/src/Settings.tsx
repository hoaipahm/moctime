import { useRef, useState, type FormEvent } from "react";
import {
  type Entry,
  type Preferences,
  type Snapshot,
  parseBackup,
  dayKey,
} from "./domain";
import { themes } from "./themes";
import { locales, localeNames, t, type CopyKey } from "./i18n";
import { downloadText } from "./media";
import { Icon, Sheet } from "./ui";
import { ReminderSettings } from "./ReminderSettings";
export function Settings({
  preferences: p,
  entries,
  update,
  restore,
  notify,
}: {
  preferences: Preferences;
  entries: Entry[];
  update: (p: Preferences) => Promise<boolean>;
  restore: (data: Snapshot) => Promise<void>;
  notify: (key: CopyKey) => void;
}) {
  const locale = p.locale;
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Snapshot | null>(null);
  const [working, setWorking] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t(locale, "settings")}</h1>
          <p>{t(locale, "yourspace")}</p>
        </div>
        <span className="badge teal">{t(locale, "offline")}</span>
      </div>
      <section className="panel settings-section">
        <h2>
          <Icon name="Globe" />
          {t(locale, "language")}
        </h2>
        <div className="language-options">
          {locales.map((lang) => (
            <button
              key={lang}
              className={"button " + (lang === locale ? "amber" : "")}
              aria-pressed={lang === locale}
              onClick={() => void update({ ...p, locale: lang })}
            >
              {localeNames[lang]}
              {lang === locale && <Icon name="Check" size={16} />}
            </button>
          ))}
        </div>
      </section>
      <section className="panel settings-section">
        <div className="section-heading">
          <h2>
            <Icon name="Palette" />
            {t(locale, "appearance")}
          </h2>
          <span className="badge">24</span>
        </div>
        <p>{t(locale, "themes")}</p>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button
              key={theme[0]}
              className={"theme-tile " + (theme[0] === p.theme ? "active" : "")}
              aria-label={theme[1]}
              aria-pressed={theme[0] === p.theme}
              onClick={() => void update({ ...p, theme: theme[0] })}
            >
              <span
                className="theme-mini"
                style={{ background: theme[2], color: theme[8] }}
              >
                <span
                  className="theme-mini-sidebar"
                  style={{ background: theme[3], borderColor: theme[8] }}
                />
                <span className="theme-mini-main">
                  <span
                    style={{ background: theme[4], borderColor: theme[8] }}
                  />
                  <span>
                    <i
                      style={{ background: theme[5], borderColor: theme[8] }}
                    />
                    <i
                      style={{ background: theme[6], borderColor: theme[8] }}
                    />
                  </span>
                </span>
                {theme[0] === p.theme && (
                  <span className="theme-check">
                    <Icon name="Check" size={14} />
                  </span>
                )}
              </span>
              <strong>{theme[1]}</strong>
            </button>
          ))}
        </div>
      </section>
      <section className="panel settings-section">
        <h2>
          <Icon name="Download" />
          {t(locale, "backup")}
        </h2>
        <p>{t(locale, "backupHint")}</p>
        <div className="backup-actions">
          <button
            className="button amber"
            onClick={() =>
              downloadText(
                "moc-backup-" + dayKey() + ".json",
                JSON.stringify({ version: 1, preferences: p, entries }),
              )
            }
          >
            <Icon name="Download" />
            {t(locale, "backup")}
          </button>
          <button className="button" onClick={() => input.current?.click()}>
            <Icon name="Upload" />
            {t(locale, "restore")}
          </button>
          <input
            ref={input}
            className="visually-hidden"
            aria-label={t(locale, "restore")}
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (file.size > 80_000_000) {
                notify("badBackup");
                return;
              }
              void file
                .text()
                .then((text) => setPending(parseBackup(text)))
                .catch(() => notify("badBackup"));
            }}
          />
        </div>
        <p className="notice">{t(locale, "securityHint")}</p>
      </section>
      <ReminderSettings locale={locale} />
      <section className="panel settings-section">
        <h2>
          <Icon name="House" />
          {t(locale, "install")}
        </h2>
        <p>{t(locale, "installHint")}</p>
        <small>{t(locale, "version")}</small>
      </section>
      {pending && (
        <Sheet
          locale={locale}
          title={t(locale, "restore")}
          onClose={() => setPending(null)}
        >
          <p>{t(locale, "restoreConfirm")}</p>
          <p>
            {pending.entries.length} {t(locale, "records")}
          </p>
          <div className="form-actions">
            <button className="button" onClick={() => setPending(null)}>
              {t(locale, "cancel")}
            </button>
            <button
              className="button amber"
              disabled={working}
              onClick={() => {
                setWorking(true);
                void restore(pending)
                  .then(() => {
                    setPending(null);
                    notify("restored");
                  })
                  .catch(() => notify("dataError"))
                  .finally(() => setWorking(false));
              }}
            >
              {t(locale, "restore")}
            </button>
          </div>
        </Sheet>
      )}
    </>
  );
}
export function Profile({
  preferences: p,
  update,
}: {
  preferences: Preferences;
  update: (p: Preferences) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(p);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const success = await update({
        ...p,
        name: draft.name,
        bio: draft.bio,
        zone: draft.zone,
      });
      setSaved(success);
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <h1>{t(p.locale, "profile")}</h1>
      </div>
      <section className="panel profile-editor">
        <div className="profile-preview">
          <div className="avatar">
            {draft.name ? (
              draft.name.slice(0, 2).toUpperCase()
            ) : (
              <Icon name="User" size={36} />
            )}
          </div>
          <h2>{draft.name || t(p.locale, "yourspace")}</h2>
          <p>{t(p.locale, "firstUse")}</p>
        </div>
        <form onSubmit={(e) => void submit(e)}>
          <label>
            {t(p.locale, "name")}
            <input
              maxLength={80}
              value={draft.name}
              onChange={(e) => {
                setSaved(false);
                setDraft({ ...draft, name: e.target.value });
              }}
            />
          </label>
          <label>
            {t(p.locale, "bio")}
            <textarea
              maxLength={500}
              rows={3}
              value={draft.bio}
              onChange={(e) => {
                setSaved(false);
                setDraft({ ...draft, bio: e.target.value });
              }}
            />
          </label>
          <label>
            {t(p.locale, "timezone")}
            <select
              value={draft.zone}
              onChange={(e) => {
                setSaved(false);
                setDraft({ ...draft, zone: e.target.value });
              }}
            >
              {[
                "Asia/Ho_Chi_Minh",
                "Asia/Shanghai",
                "Asia/Tokyo",
                "Europe/Paris",
                "Europe/London",
                "America/New_York",
                "America/Los_Angeles",
                "Australia/Sydney",
              ].map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </label>
          <button className="button amber" disabled={saving}>
            <Icon name="Check" />
            {t(p.locale, saved ? "saved" : "save")}
          </button>
        </form>
      </section>
    </>
  );
}
