import type { Locale, CopyKey } from "./i18n.ts";
import { locales } from "./i18n.ts";
export type Category = "life" | "creative" | "work" | "utilities";
export type Field =
  | "body"
  | "place"
  | "url"
  | "date"
  | "amount"
  | "progress"
  | "tag"
  | "next"
  | "photo"
  | "record";
export interface Module {
  id: string;
  names: readonly [string, string, string, string];
  icon: string;
  category: Category;
  color: string;
  fields: Field[];
  hint?: CopyKey;
}
export const modules: Module[] = [
  {
    id: "universe",
    names: ["Vũ trụ riêng", "My universe", "Mon univers", "我的宇宙"],
    icon: "Orbit",
    category: "creative",
    color: "blue",
    fields: ["body", "progress", "tag", "photo"],
  },
  {
    id: "experiments",
    names: [
      "Thử nghiệm bản thân",
      "Self experiments",
      "Expériences personnelles",
      "自我实验",
    ],
    icon: "FlaskConical",
    category: "life",
    color: "teal",
    fields: ["body", "date", "progress", "next", "tag"],
  },
  {
    id: "ideas",
    names: ["Vườn ý tưởng", "Idea garden", "Jardin d’idées", "创意花园"],
    icon: "Sprout",
    category: "creative",
    color: "teal",
    fields: ["body", "next", "tag", "photo"],
  },
  {
    id: "letters",
    names: [
      "Thư tương lai",
      "Letters to future me",
      "Lettres au futur",
      "未来的信",
    ],
    icon: "Mail",
    category: "life",
    color: "coral",
    fields: ["body", "date", "photo"],
    hint: "lockHint",
  },
  {
    id: "firsts",
    names: [
      "Những lần đầu",
      "First-time moments",
      "Mes premières fois",
      "第一次的记忆",
    ],
    icon: "Flag",
    category: "life",
    color: "amber",
    fields: ["body", "date", "place", "photo"],
  },
  {
    id: "quests",
    names: [
      "Nhiệm vụ đời thường",
      "Everyday quests",
      "Quêtes quotidiennes",
      "日常任务",
    ],
    icon: "Swords",
    category: "life",
    color: "amber",
    fields: ["body", "date", "next"],
  },
  {
    id: "thoughts",
    names: ["Bản đồ suy nghĩ", "Thought map", "Carte des pensées", "思维地图"],
    icon: "Network",
    category: "creative",
    color: "blue",
    fields: ["body", "tag", "url"],
    hint: "thoughtHint",
  },
  {
    id: "projects",
    names: [
      "Xưởng dự án",
      "Project workshop",
      "Atelier de projets",
      "项目工坊",
    ],
    icon: "Hammer",
    category: "work",
    color: "blue",
    fields: ["body", "next", "progress", "url", "photo"],
  },
  {
    id: "museum",
    names: [
      "Bảo tàng của tôi",
      "My personal museum",
      "Mon musée",
      "我的博物馆",
    ],
    icon: "Landmark",
    category: "creative",
    color: "coral",
    fields: ["body", "photo", "date", "tag"],
  },
  {
    id: "screenshot",
    names: [
      "Ảnh thành checklist",
      "Screenshot checklist",
      "Capture en checklist",
      "截图清单",
    ],
    icon: "ScanLine",
    category: "work",
    color: "teal",
    fields: ["body", "photo"],
    hint: "screenshotHint",
  },
  {
    id: "toolbox",
    names: ["Hộp công cụ", "Little toolbox", "Boîte à outils", "工具箱"],
    icon: "Wrench",
    category: "utilities",
    color: "amber",
    fields: [],
  },
  {
    id: "launcher",
    names: [
      "Sổ chạy dự án",
      "Project launch book",
      "Carnet de lancement",
      "项目启动手册",
    ],
    icon: "Terminal",
    category: "work",
    color: "blue",
    fields: ["place", "body", "url", "next"],
    hint: "desktopOnly",
  },
  {
    id: "downloads",
    names: [
      "Phân loại file",
      "File organizer",
      "Classement de fichiers",
      "文件分类",
    ],
    icon: "FolderOpen",
    category: "utilities",
    color: "amber",
    fields: [],
  },
  {
    id: "design",
    names: ["Kho giao diện", "Design shelf", "Étagère de design", "设计收藏"],
    icon: "Palette",
    category: "creative",
    color: "coral",
    fields: ["body", "url", "photo", "tag"],
  },
  {
    id: "reports",
    names: [
      "Báo cáo cá nhân",
      "Personal reports",
      "Rapports personnels",
      "个人报告",
    ],
    icon: "FileText",
    category: "work",
    color: "teal",
    fields: ["body", "date"],
    hint: "reportHint",
  },
  {
    id: "diff",
    names: [
      "So sánh tài liệu",
      "Document comparison",
      "Comparaison de textes",
      "文档比较",
    ],
    icon: "GitCompareArrows",
    category: "utilities",
    color: "blue",
    fields: [],
  },
  {
    id: "demos",
    names: ["Demo dự án", "Project demos", "Démos de projets", "项目演示"],
    icon: "Presentation",
    category: "work",
    color: "coral",
    fields: ["body", "photo", "url", "next"],
  },
  {
    id: "links",
    names: [
      "Link có hành động",
      "Actionable links",
      "Liens à explorer",
      "行动链接",
    ],
    icon: "Link",
    category: "work",
    color: "teal",
    fields: ["url", "body", "next", "tag"],
  },
  {
    id: "scheduler",
    names: [
      "Tìm thời gian rảnh",
      "Find free time",
      "Trouver du temps libre",
      "寻找空闲时间",
    ],
    icon: "CalendarClock",
    category: "utilities",
    color: "blue",
    fields: [],
  },
  {
    id: "inventory",
    names: [
      "Đồ đâu rồi?",
      "Where is my stuff?",
      "Où sont mes affaires ?",
      "东西在哪？",
    ],
    icon: "PackageSearch",
    category: "life",
    color: "amber",
    fields: ["place", "body", "photo", "tag"],
  },
  {
    id: "voice",
    names: ["Nói là lưu", "Speak & save", "Dire et garder", "随说随存"],
    icon: "Mic",
    category: "creative",
    color: "coral",
    fields: ["record", "body", "tag"],
  },
  {
    id: "outings",
    names: [
      "Đi đâu hôm nay?",
      "Where to today?",
      "Où aller aujourd’hui ?",
      "今天去哪？",
    ],
    icon: "MapPin",
    category: "life",
    color: "teal",
    fields: ["place", "body", "amount", "url", "photo"],
    hint: "outingsHint",
  },
  {
    id: "wardrobe",
    names: ["Mặc gì đây?", "What to wear?", "Que porter ?", "今天穿什么？"],
    icon: "Shirt",
    category: "life",
    color: "coral",
    fields: ["photo", "body", "tag", "date"],
  },
  {
    id: "deadlines",
    names: [
      "Hạn chót bỏ túi",
      "Pocket deadlines",
      "Échéances de poche",
      "口袋截止日",
    ],
    icon: "Receipt",
    category: "life",
    color: "amber",
    fields: ["date", "body", "photo", "amount"],
    hint: "noBackground",
  },
  {
    id: "pantry",
    names: [
      "Tủ lạnh còn gì?",
      "What’s in the fridge?",
      "Dans mon frigo",
      "冰箱里有什么？",
    ],
    icon: "Refrigerator",
    category: "life",
    color: "teal",
    fields: ["date", "body", "photo", "tag"],
    hint: "pantryHint",
  },
  {
    id: "selfdates",
    names: [
      "Hẹn với bản thân",
      "A date with myself",
      "Rendez-vous avec moi",
      "与自己约会",
    ],
    icon: "Heart",
    category: "life",
    color: "coral",
    fields: ["date", "place", "body", "photo"],
  },
  {
    id: "postcards",
    names: [
      "Bưu thiếp âm thanh",
      "Sound postcards",
      "Cartes postales sonores",
      "声音明信片",
    ],
    icon: "AudioLines",
    category: "creative",
    color: "blue",
    fields: ["photo", "record", "place", "body", "date"],
  },
  {
    id: "notes",
    names: ["Ghi chép", "Notes", "Notes", "笔记"],
    icon: "NotebookPen",
    category: "work",
    color: "amber",
    fields: ["body", "tag", "photo"],
  },
  {
    id: "habits",
    names: ["Thói quen", "Habits", "Habitudes", "习惯"],
    icon: "ListChecks",
    category: "life",
    color: "teal",
    fields: ["body", "tag"],
  },
  {
    id: "countdown",
    names: ["Đếm ngược", "Countdowns", "Comptes à rebours", "倒计时"],
    icon: "Hourglass",
    category: "life",
    color: "coral",
    fields: ["date", "body"],
  },
  {
    id: "finance",
    names: ["Sổ thu chi", "Money journal", "Carnet de dépenses", "收支账本"],
    icon: "Wallet",
    category: "life",
    color: "teal",
    fields: ["amount", "date", "body", "tag"],
  },
];
export function moduleName(module: Module, locale: Locale) {
  return module.names[locales.indexOf(locale)];
}
export const moduleIds = modules.map((module) => module.id);
