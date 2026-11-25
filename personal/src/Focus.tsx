import { useEffect, useRef, useState } from "react";
import { t, type Locale } from "./i18n";
import { Icon, TimeDigits } from "./ui";
import { chime } from "./media";
function readTimer(): {
  minutes: number;
  seconds: number;
  deadline: number | null;
} {
  try {
    const value = JSON.parse(localStorage.getItem("moc-timer") || "null");
    if (
      value &&
      [5, 15, 25, 45, 60].includes(value.minutes) &&
      Number.isInteger(value.seconds) &&
      value.seconds >= 0 &&
      value.seconds <= 3600 &&
      (value.deadline === null || Number.isFinite(value.deadline))
    )
      return value;
  } catch {
    /* A damaged timer draft must not prevent opening the app. */
  }
  return { minutes: 25, seconds: 1500, deadline: null };
}
export function Focus({ locale }: { locale: Locale }) {
  const [initial] = useState(readTimer);
  const [minutes, setMinutes] = useState(initial.minutes);
  const [seconds, setSeconds] = useState(initial.seconds);
  const [deadline, setDeadline] = useState<number | null>(initial.deadline);
  const [finished, setFinished] = useState(false);
  const end = useRef<number | null>(null);
  useEffect(() => {
    try {
      localStorage.setItem(
        "moc-timer",
        JSON.stringify({ minutes, seconds, deadline }),
      );
    } catch {
      /* Core records are stored independently in IndexedDB. */
    }
  }, [minutes, seconds, deadline]);
  useEffect(() => {
    end.current = deadline;
    if (!deadline) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0 && end.current) {
        end.current = null;
        setDeadline(null);
        setFinished(true);
        try {
          chime();
        } catch {
          /* Timer remains usable without audio hardware. */
        }
      }
    };
    tick();
    const handle = setInterval(tick, 250);
    return () => clearInterval(handle);
  }, [deadline]);
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{t(locale, "timer")}</h1>
          <p>{t(locale, "timeForYou")}</p>
        </div>
      </div>
      <section className="panel focus-panel amber">
        <span className="focus-icon">
          <Icon name="Sun" size={52} />
        </span>
        <div className="focus-clock" aria-live={finished ? "polite" : "off"}>
          <TimeDigits seconds={seconds} />
        </div>
        <p>{finished ? t(locale, "focusDone") : t(locale, "smallSteps")}</p>
        <div className="focus-presets">
          {[5, 15, 25, 45, 60].map((n) => (
            <button
              className={"chip " + (minutes === n ? "selected" : "")}
              key={n}
              disabled={deadline !== null}
              onClick={() => {
                setMinutes(n);
                setSeconds(n * 60);
                setFinished(false);
              }}
            >
              {n}′
            </button>
          ))}
        </div>
        <div className="focus-actions">
          <button
            className="button"
            onClick={() => {
              setDeadline(null);
              setSeconds(minutes * 60);
              setFinished(false);
            }}
            aria-label={t(locale, "reset")}
          >
            <Icon name="RotateCcw" />
          </button>
          <button
            className="button primary"
            onClick={() => {
              setFinished(false);
              setDeadline(
                deadline ? null : Date.now() + Math.max(1, seconds) * 1000,
              );
            }}
          >
            <Icon name={deadline ? "Pause" : "Play"} />
            {t(locale, deadline ? "pause" : "start")}
          </button>
        </div>
      </section>
      <p className="notice">{t(locale, "timerHint")}</p>
    </>
  );
}
