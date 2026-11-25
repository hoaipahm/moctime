import { useEffect, useState } from "react";
import { reminderStatus } from "./reminders";
import { t, type Locale } from "./i18n";
import { Icon } from "./ui";
export function ReminderSettings({ locale }: { locale: Locale }) {
  const [status, setStatus] = useState(reminderStatus);
  useEffect(() => {
    const refresh = () => setStatus(reminderStatus());
    window.addEventListener("moc-reminders", refresh);
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 2000);
    return () => {
      window.removeEventListener("moc-reminders", refresh);
      window.removeEventListener("focus", refresh);
      clearInterval(interval);
    };
  }, []);
  return (
    <section className="panel settings-section">
      <h2>
        <Icon name="Clock" />
        {t(locale, "reminders")}
      </h2>
      {status.supported ? (
        <>
          <p role="status">
            {t(
              locale,
              !status.enabled
                ? "reminderOff"
                : status.allowed
                  ? "reminderAllowed"
                  : "reminderBlocked",
            )}
          </p>
          <p>
            <strong>{status.count}</strong> {t(locale, "reminderQueued")}
          </p>
          <div className="backup-actions">
            <button
              className={"button " + (status.enabled ? "" : "amber")}
              onClick={() =>
                window.MocNative?.setRemindersEnabled?.(!status.enabled)
              }
            >
              {t(
                locale,
                status.enabled ? "disableReminders" : "enableReminders",
              )}
            </button>
            <button
              className="button"
              disabled={!status.enabled || !status.allowed}
              onClick={() => window.MocNative?.testReminder?.()}
            >
              {t(locale, "testReminder")}
            </button>
          </div>
        </>
      ) : (
        <p>{t(locale, "reminderBrowser")}</p>
      )}
      <p className="notice">{t(locale, "reminderDelay")}</p>
    </section>
  );
}
