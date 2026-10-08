import { toast } from "sonner";

export type MenuChild = { key: string; href: string; labelBn: string; labelEn: string; visible: boolean };
export type MenuItem = MenuChild & { locked?: boolean; children: MenuChild[] };
export type WhyItem = { titleBn: string; titleEn: string; bodyBn: string; bodyEn: string };
export type StatItem = { labelBn: string; labelEn: string; value: string };
export type TaskItem = { titleBn: string; titleEn: string; bodyBn: string; bodyEn: string };
export type DeskItem = {
  key: string;
  noteBn: string;
  noteEn: string;
  dutiesBn: string[];
  dutiesEn: string[];
  visitBn: string[];
  visitEn: string[];
};
export type PageBlock = {
  type: string;
  textBn?: string;
  textEn?: string;
  alt?: string;
  imageUrl?: string;
  itemsBn?: string[];
  itemsEn?: string[];
};
export type PageRow = {
  _id: string;
  slug: string;
  menuKey: string;
  titleBn: string;
  titleEn: string;
  summaryBn: string;
  summaryEn: string;
  seoDescriptionBn: string;
  seoDescriptionEn: string;
  status: string;
  blocks: PageBlock[];
};

export const BOARDS = [
  { key: "principal", bn: "অধ্যক্ষ", en: "Principal" },
  { key: "vice", bn: "সহকারী প্রধান শিক্ষক", en: "Vice principal" },
  { key: "admission", bn: "ভর্তি শাখা", en: "Admission office" },
  { key: "accounts", bn: "হিসাব শাখা", en: "Accounts" },
  { key: "librarian", bn: "গ্রন্থাগারিক", en: "Librarian" },
  { key: "exam", bn: "পরীক্ষা নিয়ন্ত্রক", en: "Exam controller" },
  { key: "clerk", bn: "অফিস সহকারী", en: "Office assistant" },
  { key: "governing", bn: "পরিচালনা পর্ষদ", en: "Governing body" },
  { key: "council", bn: "একাডেমিক কাউন্সিল", en: "Academic council" },
  { key: "syndicate", bn: "সিন্ডিকেট", en: "Syndicate" },
  { key: "pta", bn: "অভিভাবক কমিটি", en: "Parent committee" },
] as const;

export const PAGE_GROUPS = [
  { key: "about", bn: "আমাদের সম্পর্কে", en: "About" },
  { key: "admission", bn: "ভর্তি", en: "Admission" },
  { key: "academic", bn: "একাডেমিক", en: "Academic" },
  { key: "students", bn: "শিক্ষার্থী", en: "Students" },
] as const;

const CONFIG_KEYS = [
  "phone",
  "email",
  "officeHours",
  "mapEmbedUrl",
  "facebook",
  "youtube",
  "themePreset",
  "themePrimary",
  "heroTitleBn",
  "heroTitleEn",
  "heroSubtitleBn",
  "heroSubtitleEn",
  "heroImageUrl",
  "heroVideoUrl",
  "whyChooseUs",
  "stats",
  "principalName",
  "principalDesignation",
  "principalPhotoUrl",
  "principalQuoteBn",
  "principalQuoteEn",
  "homeIntroBn",
  "homeIntroEn",
  "tasks",
  "admitTitleBn",
  "admitTitleEn",
  "admitBodyBn",
  "admitBodyEn",
  "desks",
  "resultLookupEnabled",
  "meritListEnabled",
  "seoDescriptionBn",
  "seoDescriptionEn",
  "menus",
] as const;

export function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function lines(value: string): string[] {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function draftLines(value: string): string[] {
  const parts = value.replace(/\r/g, "").split("\n").map((line) => line.trim());
  if (value.endsWith("\n")) parts.push("");
  return parts.filter((line, index) => Boolean(line) || index === parts.length - 1);
}

export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
}

export async function readImage(file: File, tooBig: string): Promise<string | null> {
  if (file.size > 1_200_000) {
    toast.error(tooBig);
    return null;
  }
  return readFile(file);
}

export function asMenus(value: unknown): MenuItem[] {
  if (!Array.isArray(value)) return [];
  return value as MenuItem[];
}

export function asWhy(value: unknown): WhyItem[] {
  if (!Array.isArray(value)) return [];
  return value as WhyItem[];
}

export function asStats(value: unknown): StatItem[] {
  if (!Array.isArray(value)) return [];
  return value as StatItem[];
}

export function asTasks(value: unknown): TaskItem[] {
  const rows = Array.isArray(value) ? (value as TaskItem[]) : [];
  return [0, 1, 2].map((index) => rows[index] ?? { titleBn: "", titleEn: "", bodyBn: "", bodyEn: "" });
}

export function asDesks(value: unknown): DeskItem[] {
  const rows = Array.isArray(value) ? (value as DeskItem[]) : [];
  return BOARDS.map((board) => {
    const row = rows.find((item) => item.key === board.key);
    return {
      key: board.key,
      noteBn: row?.noteBn ?? "",
      noteEn: row?.noteEn ?? "",
      dutiesBn: row?.dutiesBn ?? [],
      dutiesEn: row?.dutiesEn ?? [],
      visitBn: row?.visitBn ?? [],
      visitEn: row?.visitEn ?? [],
    };
  });
}

export function configPayload(form: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const key of CONFIG_KEYS) payload[key] = form[key];
  payload.desks = asDesks(form.desks).map((desk) => ({
    ...desk,
    dutiesBn: desk.dutiesBn.map((line) => line.trim()).filter(Boolean),
    dutiesEn: desk.dutiesEn.map((line) => line.trim()).filter(Boolean),
    visitBn: desk.visitBn.map((line) => line.trim()).filter(Boolean),
    visitEn: desk.visitEn.map((line) => line.trim()).filter(Boolean),
  }));
  payload.menus = asMenus(form.menus).map((item) => ({
    key: item.key,
    href: item.href,
    labelBn: item.labelBn ?? "",
    labelEn: item.labelEn ?? "",
    visible: item.locked ? true : item.visible !== false,
    locked: Boolean(item.locked),
    children: (item.children ?? []).map((child) => ({
      key: child.key,
      href: child.href,
      labelBn: child.labelBn ?? "",
      labelEn: child.labelEn ?? "",
      visible: child.visible !== false,
    })),
  }));
  return payload;
}

const OFFICE_BOARDS = new Set(["principal", "vice", "admission", "accounts", "librarian", "exam", "clerk"]);

export function personPath(board: string): string {
  return OFFICE_BOARDS.has(board) ? `/office/${board}` : `/authorities/${board}`;
}

export function pagePath(page: { menuKey: string; slug: string }): string {
  if (page.slug === "gallery") return "/gallery";
  if (page.menuKey === page.slug) return `/${page.slug}`;
  return `/${page.menuKey}/${page.slug}`;
}

export function asPage(value: Record<string, unknown>): PageRow {
  const blocks = Array.isArray(value.blocks) ? (value.blocks as PageBlock[]) : [];
  return {
    _id: text(value._id),
    slug: text(value.slug),
    menuKey: text(value.menuKey),
    titleBn: text(value.titleBn),
    titleEn: text(value.titleEn),
    summaryBn: text(value.summaryBn),
    summaryEn: text(value.summaryEn),
    seoDescriptionBn: text(value.seoDescriptionBn),
    seoDescriptionEn: text(value.seoDescriptionEn),
    status: text(value.status) || "draft",
    blocks,
  };
}
