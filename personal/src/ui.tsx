import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flag,
  FlaskConical,
  FolderOpen,
  GitCompareArrows,
  Globe,
  Hammer,
  Heart,
  Hourglass,
  House,
  Image,
  Landmark,
  LayoutGrid,
  Link,
  ListChecks,
  Mail,
  MapPin,
  Menu,
  Mic,
  Moon,
  MoreHorizontal,
  Music,
  Network,
  NotebookPen,
  Orbit,
  PackageSearch,
  Palette,
  Pause,
  Pin,
  Play,
  Plus,
  Presentation,
  Receipt,
  Refrigerator,
  RotateCcw,
  ScanLine,
  Search,
  Settings,
  Shirt,
  Sparkles,
  Sprout,
  Square,
  Star,
  Sun,
  Swords,
  Terminal,
  Trash2,
  Upload,
  User,
  Volume2,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { t, type Locale } from "./i18n";
const icons: Record<string, LucideIcon> = {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flag,
  FlaskConical,
  FolderOpen,
  GitCompareArrows,
  Globe,
  Hammer,
  Heart,
  Hourglass,
  House,
  Image,
  Landmark,
  LayoutGrid,
  Link,
  ListChecks,
  Mail,
  MapPin,
  Menu,
  Mic,
  Moon,
  MoreHorizontal,
  Music,
  Network,
  NotebookPen,
  Orbit,
  PackageSearch,
  Palette,
  Pause,
  Pin,
  Play,
  Plus,
  Presentation,
  Receipt,
  Refrigerator,
  RotateCcw,
  ScanLine,
  Search,
  Settings,
  Shirt,
  Sparkles,
  Sprout,
  Square,
  Star,
  Sun,
  Swords,
  Terminal,
  Trash2,
  Upload,
  User,
  Volume2,
  Wallet,
  Wrench,
  X,
};
export function Icon({
  name,
  size = 20,
  ...props
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Component = icons[name] ?? LayoutGrid;
  return (
    <Component size={size} strokeWidth={2} aria-hidden="true" {...props} />
  );
}
export function Empty({
  locale,
  onAdd,
}: {
  locale: Locale;
  onAdd?: () => void;
}) {
  return (
    <div className="empty">
      <span className="empty-mark">
        <Icon name="Sprout" size={36} />
      </span>
      <h3>{t(locale, "empty")}</h3>
      <p>{t(locale, "emptyHint")}</p>
      {onAdd && (
        <button className="button amber" onClick={onAdd}>
          <Icon name="Plus" />
          {t(locale, "add")}
        </button>
      )}
    </div>
  );
}
export function Sheet({
  title,
  onClose,
  children,
  className = "",
  locale = "vi",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  locale?: Locale;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={"sheet " + className}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sheet-grip" />
      <header className="sheet-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label={t(locale, "close")}
          onClick={onClose}
        >
          <Icon name="X" />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function useNow() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const handle = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(handle);
  }, []);
  return now;
}
export function TimeDigits({ seconds }: { seconds: number }) {
  const value = Math.max(0, seconds);
  return (
    <>
      {String(Math.floor(value / 3600)).padStart(2, "0")}
      <span>:</span>
      {String(Math.floor(value / 60) % 60).padStart(2, "0")}
      <span>:</span>
      {String(value % 60).padStart(2, "0")}
    </>
  );
}
