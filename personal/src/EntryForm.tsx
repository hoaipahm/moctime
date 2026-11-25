import { useEffect, useRef, useState, type FormEvent } from "react";
import { type Entry, dayKey, safeUrl, validReminderAt } from "./domain";
import { type Module, moduleName } from "./modules";
import { t, type Locale, type CopyKey } from "./i18n";
import { asDataUrl, readPhoto } from "./media";
import { Icon, Sheet } from "./ui";
export function EntryForm({
  module,
  entry,
  locale,
  onSave,
  onClose,
}: {
  module: Module;
  entry: Entry;
  locale: Locale;
  onSave: (entry: Entry) => Promise<void>;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(entry);
  const [error, setError] = useState<CopyKey | null>(null);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const live = useRef(true);
  const [processing, setProcessing] = useState(false);
  useEffect(
    () => () => {
      live.current = false;
      if (timeout.current) clearTimeout(timeout.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  const set = (key: keyof Entry, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));
  async function audio() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("noAudio");
      return;
    }
    setError(null);
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (!live.current) {
        stream.current.getTracks().forEach((track) => track.stop());
        return;
      }
      const rec = new MediaRecorder(stream.current);
      recorder.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        stream.current?.getTracks().forEach((track) => track.stop());
        if (timeout.current) clearTimeout(timeout.current);
        if (!live.current) return;
        setRecording(false);
        setProcessing(true);
        const blob = new Blob(chunks, { type: rec.mimeType });
        if (blob.size > 8 * 1024 * 1024) {
          setError("mediaLimit");
          setProcessing(false);
          return;
        }
        void asDataUrl(blob)
          .then((value) => {
            if (live.current) setDraft((old) => ({ ...old, audio: value }));
          })
          .catch(() => setError("mediaError"))
          .finally(() => {
            if (live.current) setProcessing(false);
          });
      };
      rec.start();
      setRecording(true);
      timeout.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 120000);
    } catch {
      setError("mediaError");
      stream.current?.getTracks().forEach((track) => track.stop());
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setError("required");
      return;
    }
    if (draft.url && !safeUrl(draft.url)) {
      setError("invalidUrl");
      return;
    }
    if (draft.reminderAt && !validReminderAt(draft.reminderAt)) {
      setError("invalidReminder");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...draft,
        title: draft.title.trim(),
        updated: new Date().toISOString(),
      });
      onClose();
    } catch {
      setError("dataError");
      setSaving(false);
    }
  }
  return (
    <Sheet
      locale={locale}
      title={moduleName(module, locale)}
      onClose={onClose}
      className="editor"
    >
      <form onSubmit={(event) => void submit(event)}>
        <label>
          {t(locale, "title")}
          <input
            autoFocus
            required
            maxLength={200}
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        {module.hint && <p className="notice">{t(locale, module.hint)}</p>}
        {module.fields.map((field) => {
          if (field === "photo")
            return (
              <div className="field" key={field}>
                <span>{t(locale, "photo")}</span>
                <label className="upload-control">
                  <Icon name="Image" />
                  {t(locale, "attach")}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setProcessing(true);
                      void readPhoto(file)
                        .then((value) => set("photo", value))
                        .catch((err) =>
                          setError(
                            err instanceof Error && err.message === "mediaLimit"
                              ? "mediaLimit"
                              : "mediaError",
                          ),
                        )
                        .finally(() => setProcessing(false));
                    }}
                  />
                </label>
                {draft.photo && (
                  <div className="media-preview">
                    <img
                      src={draft.photo}
                      alt={draft.title || t(locale, "photo")}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={t(locale, "delete")}
                      onClick={() => set("photo", "")}
                    >
                      <Icon name="X" />
                    </button>
                  </div>
                )}
              </div>
            );
          if (field === "record")
            return (
              <div className="field" key={field}>
                <span>{t(locale, "record")}</span>
                <button
                  type="button"
                  className={"button " + (recording ? "coral" : "")}
                  onClick={() => void audio()}
                  disabled={processing}
                >
                  <Icon name={recording ? "Square" : "Mic"} />
                  {t(locale, recording ? "stop" : "record")}
                  {recording && <span className="record-indicator" />}
                </button>
                {draft.audio && <audio controls src={draft.audio} />}
                <small>120 s · 8 MB</small>
              </div>
            );
          if (field === "body")
            return (
              <label key={field}>
                {t(locale, module.id === "screenshot" ? "taskLines" : "body")}
                <textarea
                  rows={5}
                  maxLength={20000}
                  value={draft.body}
                  onChange={(e) => set("body", e.target.value)}
                />
              </label>
            );
          return (
            <label key={field}>
              {t(locale, field)}
              <input
                type={
                  field === "date"
                    ? "date"
                    : field === "amount" || field === "progress"
                      ? "number"
                      : field === "url"
                        ? "url"
                        : "text"
                }
                min={field === "progress" ? 0 : undefined}
                max={
                  field === "progress"
                    ? 100
                    : field === "amount"
                      ? 1e15
                      : undefined
                }
                step={field === "amount" ? "0.01" : undefined}
                maxLength={2000}
                value={draft[field]}
                onChange={(e) => set(field, e.target.value)}
                required={
                  field === "date" &&
                  ["letters", "deadlines", "countdown"].includes(module.id)
                }
                placeholder={field === "date" ? dayKey() : undefined}
              />
            </label>
          );
        })}
        {module.fields.includes("date") && (
          <label>
            {t(locale, "reminderAt")}
            <input
              type="datetime-local"
              aria-label={t(locale, "reminderAt")}
              aria-describedby="reminder-help"
              value={draft.reminderAt ?? ""}
              onChange={(event) => set("reminderAt", event.target.value)}
            />
            <small id="reminder-help">{t(locale, "reminderHint")}</small>
          </label>
        )}
        {error && (
          <p className="error" role="alert">
            {t(locale, error)}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="button" onClick={onClose}>
            {t(locale, "cancel")}
          </button>
          <button
            type="submit"
            className="button amber"
            disabled={saving || recording || processing}
          >
            <Icon name="Check" />
            {saving ? "…" : t(locale, "save")}
          </button>
        </div>
      </form>
    </Sheet>
  );
}
