export interface BibleEntry {
  id: number;
  parent?: number;
  title: string;
  content?: string;
}

interface BibleData {
  entries: Map<number, BibleEntry>;
  children: Map<number | undefined, BibleEntry[]>;
  leaves: BibleEntry[];
  all: BibleEntry[];
}

let bibleData: BibleData | null = null;

export async function loadBible(): Promise<BibleData> {
  if (bibleData) return bibleData;

  const res = await fetch(import.meta.env.BASE_URL + 'book.json');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const raw: BibleEntry[] = await res.json();

  const entries = new Map<number, BibleEntry>();
  const children = new Map<number | undefined, BibleEntry[]>();
  const leaves: BibleEntry[] = [];

  for (const entry of raw) {
    entries.set(entry.id, entry);

    const key = entry.parent;
    if (!children.has(key)) children.set(key, []);
    children.get(key)!.push(entry);

    if (entry.content !== undefined) leaves.push(entry);
  }

  bibleData = { entries, children, leaves, all: raw };
  return bibleData;
}

export function getBibleData(): BibleData {
  if (!bibleData) throw new Error('Bible not loaded');
  return bibleData;
}

export function getBreadcrumb(entry: BibleEntry, entries: Map<number, BibleEntry>): string {
  const parts: string[] = [];
  let cur: BibleEntry | undefined = entry;
  while (cur?.parent !== undefined) {
    const p = entries.get(cur.parent);
    if (!p) break;
    parts.unshift(p.title);
    cur = p;
  }
  return parts.join(' › ');
}

export function parseContent(raw: string): string {
  const text = raw.replace(/^﻿/, '');
  const blocks = text.split(/\r\n\r\n|\n\n/);
  const html: string[] = [];

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const m = block.match(/^(\d+)\.\s+([\s\S]+)$/);
    if (m) {
      const body = escHtml(m[2].replace(/\r\n|\r|\n/g, ' '));
      html.push(`<p class="verse"><sup class="verse-num">${m[1]}</sup>${body}</p>`);
    } else {
      html.push(`<p>${escHtml(block.replace(/\r\n|\r|\n/g, '<br>'))}</p>`);
    }
  }

  return html.join('');
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function normalizeStr(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}
