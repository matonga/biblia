import { getBibleData, normalizeStr, type BibleEntry } from '../data';

const ARROW_SVG = `<svg class="summary-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`;

let searchTerm = '';

export function renderIndexView(container: HTMLElement): void {
  const { children } = getBibleData();

  container.innerHTML = `
    <div class="view view-index">
      <div class="search-wrap">
        <input type="search" id="toc-search" class="search-input"
               placeholder="Buscar en la Biblia…"
               value="${escAttr(searchTerm)}"
               autocomplete="off" spellcheck="false">
      </div>
      <h1 class="toc-title">El libro del pueblo de Dios</h1>
      <div id="toc-body"></div>
    </div>
  `;

  const input  = container.querySelector<HTMLInputElement>('#toc-search')!;
  const body   = container.querySelector<HTMLElement>('#toc-body')!;

  renderBody(body, children);

  input.addEventListener('input', () => {
    searchTerm = input.value;
    renderBody(body, children);
  });

  // Handle clicks on non-leaf search results (expand their node in the tree)
  body.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLAnchorElement>('.search-result');
    if (!target || target.dataset.leaf === 'true') return;

    const id = parseInt(target.dataset.id ?? '', 10);
    if (isNaN(id)) return;
    e.preventDefault();

    const { entries } = getBibleData();
    const entry = entries.get(id);
    if (!entry) return;

    searchTerm = '';
    renderBody(body, children);
    input.value = '';

    requestAnimationFrame(() => {
      const parentEntry = entry.parent !== undefined ? entries.get(entry.parent) : undefined;
      openInTree(id, parentEntry?.id);
    });
  });
}

function renderBody(
  body: HTMLElement,
  children: Map<number | undefined, BibleEntry[]>,
): void {
  if (searchTerm.trim().length > 0) {
    renderSearch(body, children);
  } else {
    renderTree(body, children);
  }
}

function renderTree(
  body: HTMLElement,
  children: Map<number | undefined, BibleEntry[]>,
): void {
  const roots = children.get(undefined) ?? [];
  body.innerHTML = roots.map(root => buildRoot(root, children)).join('');
}

function buildRoot(
  root: BibleEntry,
  children: Map<number | undefined, BibleEntry[]>,
): string {
  const books = children.get(root.id) ?? [];
  return `
    <details class="toc-root" data-root-id="${root.id}">
      <summary>${escHtml(root.title)}${ARROW_SVG}</summary>
      ${books.map(book => buildBook(book, children)).join('')}
    </details>
  `;
}

function buildBook(
  book: BibleEntry,
  children: Map<number | undefined, BibleEntry[]>,
): string {
  const chapters = children.get(book.id) ?? [];
  return `
    <details class="toc-book" data-book-id="${book.id}">
      <summary>${escHtml(book.title)}${ARROW_SVG}</summary>
      <div class="toc-chapters">
        ${chapters.map(ch =>
          `<a href="#/read/${ch.id}" class="toc-chapter">${escHtml(ch.title)}</a>`
        ).join('')}
      </div>
    </details>
  `;
}

function renderSearch(
  body: HTMLElement,
  children: Map<number | undefined, BibleEntry[]>,
): void {
  const { entries } = getBibleData();
  const needle = normalizeStr(searchTerm.trim());
  const results: BibleEntry[] = [];

  for (const entry of entries.values()) {
    if (normalizeStr(entry.title).includes(needle)) results.push(entry);
    if (results.length >= 80) break;
  }

  if (results.length === 0) {
    body.innerHTML = `<p class="search-empty">Sin resultados para "${escHtml(searchTerm)}"</p>`;
    return;
  }

  body.innerHTML = `<div class="search-results">${results.map(e => buildResult(e, children)).join('')}</div>`;
}

function buildResult(
  entry: BibleEntry,
  children: Map<number | undefined, BibleEntry[]>,
): string {
  const { entries } = getBibleData();
  const isLeaf = entry.content !== undefined;
  const breadcrumbParts: string[] = [];
  let cur: BibleEntry | undefined = entry;
  while (cur?.parent !== undefined) {
    const p = entries.get(cur.parent);
    if (!p) break;
    breadcrumbParts.unshift(p.title);
    cur = p;
  }
  const breadcrumb = breadcrumbParts.join(' › ');
  const childCount = !isLeaf ? (children.get(entry.id)?.length ?? 0) : 0;

  const href = isLeaf ? `#/read/${entry.id}` : '#/';
  const badge = isLeaf ? '' : `<span class="result-type-badge">${childCount} capítulos</span>`;

  return `
    <a class="search-result" href="${href}" data-id="${entry.id}" data-leaf="${isLeaf}">
      <span class="result-title">${highlight(entry.title, searchTerm)}</span>
      ${breadcrumb ? `<span class="result-breadcrumb">${escHtml(breadcrumb)}</span>` : ''}
      ${badge}
    </a>
  `;
}

function highlight(text: string, term: string): string {
  if (!term) return escHtml(text);
  const normText = normalizeStr(text);
  const normTerm = normalizeStr(term.trim());
  const idx = normText.indexOf(normTerm);
  if (idx < 0) return escHtml(text);
  return (
    escHtml(text.slice(0, idx)) +
    `<mark>${escHtml(text.slice(idx, idx + term.trim().length))}</mark>` +
    escHtml(text.slice(idx + term.trim().length))
  );
}


function openInTree(bookId: number, rootId: number | undefined): void {
  if (rootId !== undefined) {
    const rootDetails = document.querySelector<HTMLDetailsElement>(
      `.toc-root[data-root-id="${rootId}"]`,
    );
    if (rootDetails) rootDetails.open = true;
  }

  const bookDetails = document.querySelector<HTMLDetailsElement>(
    `.toc-book[data-book-id="${bookId}"]`,
  );
  if (bookDetails) {
    bookDetails.open = true;
    bookDetails.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(s: string): string {
  return s.replace(/"/g, '&quot;');
}
