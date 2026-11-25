export async function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
export async function readPhoto(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 8 * 1024 * 1024
  )
    throw new Error("mediaLimit");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("mediaError");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
declare global {
  interface Window {
    MocNative?: {
      saveText: (name: string, content: string, mime: string) => void;
      vibrate: () => void;
      syncReminders?: (json: string) => boolean;
      reminderStatus?: () => string;
      setRemindersEnabled?: (enabled: boolean) => void;
      testReminder?: () => void;
      setBackCanExit?: (canExit: boolean) => void;
      notificationTarget?: () => string;
    };
  }
}
export function downloadText(
  name: string,
  content: string,
  mime = "application/json",
) {
  if (window.MocNative) {
    window.MocNative.saveText(name, content, mime);
    return;
  }
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export async function copyText(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value);
    return;
  }
  throw new Error("clipboard");
}
let audio: AudioContext | undefined;
let ambientNodes: AudioNode[] = [];
let sequence: ReturnType<typeof setInterval> | undefined;
let ambientGain: GainNode | undefined;
function context() {
  audio ??= new AudioContext();
  if (audio.state === "suspended") void audio.resume();
  return audio;
}
export function chime() {
  const ctx = context();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.65);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
export function tapSound() {
  const ctx = context();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 440;
  gain.gain.setValueAtTime(0.025, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.035);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.04);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
}
export function stopAmbient() {
  if (sequence) clearInterval(sequence);
  sequence = undefined;
  for (const node of ambientNodes) {
    if (node instanceof AudioBufferSourceNode) node.stop();
    node.disconnect();
  }
  ambientNodes = [];
  ambientGain = undefined;
}
export function setAmbientVolume(value: number) {
  if (ambientGain && audio)
    ambientGain.gain.setTargetAtTime(value * 0.35, audio.currentTime, 0.1);
}
export function playAmbient(mode: "rain" | "piano" | "night", volume: number) {
  stopAmbient();
  const ctx = context();
  const master = ctx.createGain();
  master.gain.value = volume * 0.35;
  master.connect(ctx.destination);
  ambientGain = master;
  ambientNodes.push(master);
  if (mode === "piano") {
    const notes = [261.63, 329.63, 392, 523.25, 392, 329.63];
    let i = 0;
    const play = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = notes[i++ % notes.length];
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.6);
      osc.connect(gain).connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 2.7);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    };
    play();
    sequence = setInterval(play, 1000);
    return;
  }
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const values = buffer.getChannelData(0);
  let previous = 0;
  for (let i = 0; i < values.length; i++) {
    const white = Math.random() * 2 - 1;
    previous = (previous + 0.02 * white) / 1.02;
    values[i] = mode === "night" ? previous * 4 : white * 0.35;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = mode === "rain" ? 1800 : 420;
  source.connect(filter).connect(master);
  source.start();
  ambientNodes.push(source, filter);
}
