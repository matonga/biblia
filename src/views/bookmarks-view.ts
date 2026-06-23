import {
  getBookmarks,
  deleteBookmark,
  updateBookmarkNote,
  type Bookmark,
} from '../store';
import { navigate } from '../router';

export function renderBookmarksView(container: HTMLElement): void {
  container.innerHTML = `
    <div class="view view-bookmarks">
      <div class="view-header">
        <h1>Marcadores</h1>
      </div>
      <div id="bm-list" class="bookmark-list"></div>
    </div>
  `;
  renderList(container.querySelector<HTMLElement>('#bm-list')!);
}

function renderList(list: HTMLElement): void {
  const bookmarks = [...getBookmarks()].sort((a, b) => b.createdAt - a.createdAt);

  if (bookmarks.length === 0) {
    list.innerHTML = `
      <div class="bookmark-empty">
        No hay marcadores aún.<br>
        Mientras leés, presioná el botón<br>
        🔖 para guardar tu posición.
      </div>
    `;
    return;
  }

  list.innerHTML = bookmarks.map(bm => buildCard(bm)).join('');
  attachCardHandlers(list, () => renderList(list));
}

function buildCard(bm: Bookmark): string {
  const date = new Date(bm.createdAt).toLocaleDateString('es', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return `
    <div class="bookmark-card" data-bm-id="${bm.id}">
      <a class="bookmark-main" href="#/read/${bm.entryId}?bm=${bm.id}"
         aria-label="Ir a ${esc(bm.title)}">
        <span class="bookmark-title">${esc(bm.title)}</span>
        ${bm.breadcrumb
          ? `<span class="bookmark-breadcrumb">${esc(bm.breadcrumb)}</span>`
          : ''}
        <span class="bookmark-meta">
          <span class="bookmark-date">${date}</span>
        </span>
        ${bm.note
          ? `<span class="bookmark-note-preview">${esc(bm.note)}</span>`
          : ''}
      </a>

      <div class="bookmark-actions">
        <button class="bookmark-action-btn" data-action="open"
                title="Abrir">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Ir
        </button>
        <button class="bookmark-action-btn" data-action="edit"
                title="Editar nota">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Nota
        </button>
        <button class="bookmark-action-btn danger" data-action="delete"
                title="Eliminar marcador">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
          Borrar
        </button>
      </div>

      <div class="bookmark-edit-area" id="edit-${bm.id}">
        <textarea class="note-textarea" rows="3"
                  placeholder="Escribe una nota…"
                  aria-label="Nota">${esc(bm.note)}</textarea>
        <div class="bookmark-edit-actions">
          <button class="btn" data-action="edit-cancel">Cancelar</button>
          <button class="btn btn-primary" data-action="edit-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
}

function attachCardHandlers(list: HTMLElement, rerender: () => void): void {
  list.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-action]');
    if (!btn) return;

    const card  = btn.closest<HTMLElement>('.bookmark-card')!;
    const bmId  = card.dataset.bmId!;
    const action = btn.dataset.action!;

    if (action === 'open') {
      const bm = getBookmarks().find(b => b.id === bmId);
      if (bm) navigate(`/read/${bm.entryId}?bm=${bm.id}`);
      return;
    }

    if (action === 'delete') {
      deleteBookmark(bmId);
      rerender();
      return;
    }

    if (action === 'edit') {
      const editArea = card.querySelector<HTMLElement>(`#edit-${bmId}`)!;
      editArea.classList.toggle('open');
      if (editArea.classList.contains('open')) {
        editArea.querySelector('textarea')?.focus();
      }
      return;
    }

    if (action === 'edit-cancel') {
      const editArea = card.querySelector<HTMLElement>(`[id^="edit-"]`)!;
      editArea.classList.remove('open');
      const bm = getBookmarks().find(b => b.id === bmId);
      if (bm) {
        const ta = editArea.querySelector('textarea')!;
        ta.value = bm.note;
      }
      return;
    }

    if (action === 'edit-save') {
      const editArea = card.querySelector<HTMLElement>(`[id^="edit-"]`)!;
      const ta = editArea.querySelector<HTMLTextAreaElement>('textarea')!;
      updateBookmarkNote(bmId, ta.value.trim());
      editArea.classList.remove('open');

      const bm = getBookmarks().find(b => b.id === bmId);
      if (bm) {
        const preview = card.querySelector<HTMLElement>('.bookmark-note-preview');
        if (preview) {
          preview.textContent = bm.note;
        } else if (bm.note) {
          card.querySelector('.bookmark-meta')?.insertAdjacentHTML(
            'afterend',
            `<span class="bookmark-note-preview">${esc(bm.note)}</span>`,
          );
        }
      }
      return;
    }
  });
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
