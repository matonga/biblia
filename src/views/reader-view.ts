import { getBibleData, getBreadcrumb, parseContent } from '../data';
import {
  addBookmark,
  getBookmarks,
  getLastPosition,
  saveLastPosition,
} from '../store';
import { navigate } from '../router';

export function renderReaderView(
  container: HTMLElement,
  entryId: number,
  bookmarkId: string | undefined,
  signal: AbortSignal,
): void {
  const { entries, leaves } = getBibleData();
  const entry = entries.get(entryId);

  if (!entry?.content) {
    container.innerHTML = '<div class="error">Capítulo no encontrado.</div>';
    return;
  }

  const leafIdx  = leaves.findIndex(l => l.id === entryId);
  const prev     = leafIdx > 0 ? leaves[leafIdx - 1] : null;
  const next     = leafIdx < leaves.length - 1 ? leaves[leafIdx + 1] : null;
  const breadcrumb = getBreadcrumb(entry, entries);
  const html     = parseContent(entry.content);

  container.innerHTML = `
    <div class="view view-reader">
      <header class="reader-header">
        <button class="back-btn" id="back-btn" aria-label="Volver">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
        </button>
        <div class="reader-title-wrap">
          <span class="reader-breadcrumb">${esc(breadcrumb)}</span>
          <h1>${esc(entry.title)}</h1>
        </div>
      </header>

      <div class="reader-content">${html}</div>

      <footer class="reader-footer">
        <button class="nav-chapter-btn" id="prev-btn"
                ${prev ? '' : 'disabled'}
                title="${prev ? esc(prev.title) : ''}">
          ${prev ? `← ${esc(prev.title)}` : ''}
        </button>
        <button class="nav-chapter-btn" id="next-btn"
                ${next ? '' : 'disabled'}
                title="${next ? esc(next.title) : ''}">
          ${next ? `${esc(next.title)} →` : ''}
        </button>
      </footer>

      <button class="fab" id="bookmark-fab" aria-label="Agregar marcador">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
      </button>
    </div>

    <div class="modal-overlay" id="bm-modal" hidden aria-modal="true" role="dialog">
      <div class="modal">
        <h2>Agregar marcador</h2>
        <p class="modal-entry-title">${esc(entry.title)}</p>
        <textarea class="modal-note" id="bm-note"
                  placeholder="Nota (opcional)…" rows="4"
                  aria-label="Nota del marcador"></textarea>
        <div class="modal-actions">
          <button class="btn" id="bm-cancel">Cancelar</button>
          <button class="btn btn-primary" id="bm-save">Guardar</button>
        </div>
      </div>
    </div>
  `;

  const backBtn    = container.querySelector<HTMLButtonElement>('#back-btn')!;
  const prevBtn    = container.querySelector<HTMLButtonElement>('#prev-btn')!;
  const nextBtn    = container.querySelector<HTMLButtonElement>('#next-btn')!;
  const fab        = container.querySelector<HTMLButtonElement>('#bookmark-fab')!;
  const modal      = container.querySelector<HTMLElement>('#bm-modal')!;
  const bmNote     = container.querySelector<HTMLTextAreaElement>('#bm-note')!;
  const bmCancel   = container.querySelector<HTMLButtonElement>('#bm-cancel')!;
  const bmSave     = container.querySelector<HTMLButtonElement>('#bm-save')!;

  backBtn.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else navigate('/');
  }, { signal });

  if (prev) prevBtn.addEventListener('click', () => navigate(`/read/${prev.id}`), { signal });
  if (next) nextBtn.addEventListener('click', () => navigate(`/read/${next.id}`), { signal });

  fab.addEventListener('click', () => {
    modal.removeAttribute('hidden');
    bmNote.focus();
  }, { signal });

  bmCancel.addEventListener('click', closeModal, { signal });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  }, { signal });

  bmSave.addEventListener('click', () => {
    const bm = {
      id:            genId(),
      entryId:       entry.id,
      scrollPercent: getScrollPercent(),
      note:          bmNote.value.trim(),
      createdAt:     Date.now(),
      title:         entry.title,
      breadcrumb,
    };
    addBookmark(bm);
    closeModal();
    showToast('Marcador guardado', true);
  }, { signal });

  function closeModal() {
    modal.setAttribute('hidden', '');
    bmNote.value = '';
  }

  // Restore scroll position after layout
  setTimeout(() => {
    if (signal.aborted) return;
    if (bookmarkId) {
      const bm = getBookmarks().find(b => b.id === bookmarkId);
      if (bm) { restoreScrollPercent(bm.scrollPercent); return; }
    }
    const last = getLastPosition();
    if (last?.entryId === entryId) restoreScrollPercent(last.scrollPercent);
  }, 80);

  // Auto-save scroll position (debounced)
  let scrollTimer = 0;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      if (!signal.aborted) saveLastPosition(entryId, getScrollPercent());
    }, 400);
  }, { passive: true, signal });
}

function getScrollPercent(): number {
  const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
  const max = scrollHeight - clientHeight;
  return max > 0 ? (scrollTop / max) * 100 : 0;
}

function restoreScrollPercent(pct: number): void {
  const { scrollHeight, clientHeight } = document.documentElement;
  const max = scrollHeight - clientHeight;
  document.documentElement.scrollTop = (pct / 100) * max;
}

function showToast(msg: string, inReader = false): void {
  const toast = document.createElement('div');
  toast.className = `toast${inReader ? ' reader-toast' : ''}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('toast-show'));
  });
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
