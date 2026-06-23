export interface Settings {
  darkMode: boolean;
  fontSize: number;
  lineHeight: number;
}

export interface Bookmark {
  id: string;
  entryId: number;
  scrollPercent: number;
  note: string;
  createdAt: number;
  title: string;
  breadcrumb: string;
}

export interface LastPosition {
  entryId: number;
  scrollPercent: number;
}

const KEYS = {
  settings:    'biblia:settings',
  bookmarks:   'biblia:bookmarks',
  lastPos:     'biblia:lastpos',
} as const;

const DEFAULT_SETTINGS: Settings = {
  darkMode:   false,
  fontSize:   16,
  lineHeight: 1.6,
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ── Settings ─────────────────────────────────────── */

export function getSettings(): Settings {
  const saved = readJson<Partial<Settings>>(KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(s: Settings): void {
  writeJson(KEYS.settings, s);
}

export function applySettings(s: Settings): void {
  document.documentElement.style.setProperty('--font-size', `${s.fontSize}px`);
  document.documentElement.style.setProperty('--line-height', String(s.lineHeight));
  document.body.classList.toggle('dark', s.darkMode);
}

/* ── Bookmarks ────────────────────────────────────── */

export function getBookmarks(): Bookmark[] {
  return readJson<Bookmark[]>(KEYS.bookmarks) ?? [];
}

export function saveBookmarks(list: Bookmark[]): void {
  writeJson(KEYS.bookmarks, list);
}

export function addBookmark(bm: Bookmark): void {
  saveBookmarks([...getBookmarks(), bm]);
}

export function deleteBookmark(id: string): void {
  saveBookmarks(getBookmarks().filter(b => b.id !== id));
}

export function updateBookmarkNote(id: string, note: string): void {
  saveBookmarks(getBookmarks().map(b => b.id === id ? { ...b, note } : b));
}

/* ── Last position ────────────────────────────────── */

export function getLastPosition(): LastPosition | null {
  return readJson<LastPosition>(KEYS.lastPos);
}

export function saveLastPosition(entryId: number, scrollPercent: number): void {
  writeJson(KEYS.lastPos, { entryId, scrollPercent });
}
