let currentHandler = null;
export function parseRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const [path, qs] = hash.split('?');
    const parts = path.split('/').filter(Boolean);
    if (parts[0] === 'read' && parts[1]) {
        const id = parseInt(parts[1], 10);
        if (!isNaN(id)) {
            const bookmarkId = new URLSearchParams(qs ?? '').get('bm') ?? undefined;
            return { name: 'read', id, bookmarkId };
        }
    }
    if (parts[0] === 'bookmarks')
        return { name: 'bookmarks' };
    if (parts[0] === 'settings')
        return { name: 'settings' };
    return { name: 'index' };
}
export function navigate(path) {
    window.location.hash = path;
}
export function initRouter(handler) {
    currentHandler = handler;
    window.addEventListener('hashchange', () => currentHandler?.(parseRoute()));
    currentHandler(parseRoute());
}
