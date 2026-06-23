const KEYS = {
    settings: 'biblia:settings',
    bookmarks: 'biblia:bookmarks',
    lastPos: 'biblia:lastpos',
};
const DEFAULT_SETTINGS = {
    darkMode: false,
    fontSize: 16,
    lineHeight: 1.6,
};
function readJson(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
/* ── Settings ─────────────────────────────────────── */
export function getSettings() {
    const saved = readJson(KEYS.settings);
    return { ...DEFAULT_SETTINGS, ...saved };
}
export function saveSettings(s) {
    writeJson(KEYS.settings, s);
}
export function applySettings(s) {
    document.documentElement.style.setProperty('--font-size', `${s.fontSize}px`);
    document.documentElement.style.setProperty('--line-height', String(s.lineHeight));
    document.body.classList.toggle('dark', s.darkMode);
}
/* ── Bookmarks ────────────────────────────────────── */
export function getBookmarks() {
    return readJson(KEYS.bookmarks) ?? [];
}
export function saveBookmarks(list) {
    writeJson(KEYS.bookmarks, list);
}
export function addBookmark(bm) {
    saveBookmarks([...getBookmarks(), bm]);
}
export function deleteBookmark(id) {
    saveBookmarks(getBookmarks().filter(b => b.id !== id));
}
export function updateBookmarkNote(id, note) {
    saveBookmarks(getBookmarks().map(b => b.id === id ? { ...b, note } : b));
}
/* ── Last position ────────────────────────────────── */
export function getLastPosition() {
    return readJson(KEYS.lastPos);
}
export function saveLastPosition(entryId, scrollPercent) {
    writeJson(KEYS.lastPos, { entryId, scrollPercent });
}
