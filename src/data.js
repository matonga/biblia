let bibleData = null;
export async function loadBible() {
    if (bibleData)
        return bibleData;
    const res = await fetch('/book.json');
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    const entries = new Map();
    const children = new Map();
    const leaves = [];
    for (const entry of raw) {
        entries.set(entry.id, entry);
        const key = entry.parent;
        if (!children.has(key))
            children.set(key, []);
        children.get(key).push(entry);
        if (entry.content !== undefined)
            leaves.push(entry);
    }
    bibleData = { entries, children, leaves, all: raw };
    return bibleData;
}
export function getBibleData() {
    if (!bibleData)
        throw new Error('Bible not loaded');
    return bibleData;
}
export function getBreadcrumb(entry, entries) {
    const parts = [];
    let cur = entry;
    while (cur?.parent !== undefined) {
        const p = entries.get(cur.parent);
        if (!p)
            break;
        parts.unshift(p.title);
        cur = p;
    }
    return parts.join(' › ');
}
export function parseContent(raw) {
    const text = raw.replace(/^﻿/, '');
    const blocks = text.split(/\r\n\r\n|\n\n/);
    const html = [];
    for (let i = 1; i < blocks.length; i++) {
        const block = blocks[i].trim();
        if (!block)
            continue;
        const m = block.match(/^(\d+)\.\s+([\s\S]+)$/);
        if (m) {
            const body = escHtml(m[2].replace(/\r\n|\r|\n/g, ' '));
            html.push(`<p class="verse"><sup class="verse-num">${m[1]}</sup>${body}</p>`);
        }
        else {
            html.push(`<p>${escHtml(block.replace(/\r\n|\r|\n/g, '<br>'))}</p>`);
        }
    }
    return html.join('');
}
function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function normalizeStr(s) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
