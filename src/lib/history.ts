export type ActivityKind = "email" | "tasks" | "chat";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  /** Full user prompt (untruncated) */
  prompt?: string;
  /** Full AI output (untruncated) */
  output?: string;
  at: number;
};


const KEY = "wai.history";
const LIMIT = 60;

export function readHistory(): ActivityItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ActivityItem[]) : [];
  } catch {
    return [];
  }
}

export function writeHistory(items: ActivityItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, LIMIT)));
    window.dispatchEvent(new Event("wai:history"));
  } catch {
    /* ignore */
  }
}

export function logActivity(kind: ActivityKind, title: string, detail: string) {
  const item: ActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    title,
    detail: detail.length > 180 ? `${detail.slice(0, 180)}…` : detail,
    at: Date.now(),
  };
  writeHistory([item, ...readHistory()]);
}
