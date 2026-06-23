import './style.css';
import { loadBible } from './data';
import { getSettings, applySettings } from './store';
import { initRouter, navigate, type Route } from './router';
import { renderIndexView }     from './views/index-view';
import { renderReaderView }    from './views/reader-view';
import { renderSettingsView }  from './views/settings-view';
import { renderBookmarksView } from './views/bookmarks-view';

const app = document.getElementById('app')!;

app.innerHTML = `
  <div id="main-content"></div>
  <nav class="bottom-nav" id="bottom-nav">
    <button class="nav-btn" data-route="/" aria-label="Índice">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
      </svg>
      <span>Índice</span>
    </button>
    <button class="nav-btn" data-route="/bookmarks" aria-label="Marcadores">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
      </svg>
      <span>Marcadores</span>
    </button>
    <button class="nav-btn" data-route="/settings" aria-label="Ajustes">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.1 7.1 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.63-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
      </svg>
      <span>Ajustes</span>
    </button>
  </nav>
`;

const mainContent = document.getElementById('main-content')!;
const bottomNav   = document.getElementById('bottom-nav')!;

bottomNav.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.route ?? '/'));
});

applySettings(getSettings());

let viewAbort = new AbortController();

loadBible().then(() => {
  initRouter((route: Route) => {
    viewAbort.abort();
    viewAbort = new AbortController();
    const { signal } = viewAbort;

    updateNavActive(route);
    document.documentElement.scrollTop = 0;

    if (route.name === 'index') {
      bottomNav.style.display = '';
      renderIndexView(mainContent);
    } else if (route.name === 'read') {
      bottomNav.style.display = '';
      renderReaderView(mainContent, route.id, route.bookmarkId, signal);
    } else if (route.name === 'bookmarks') {
      bottomNav.style.display = '';
      renderBookmarksView(mainContent);
    } else if (route.name === 'settings') {
      bottomNav.style.display = '';
      renderSettingsView(mainContent);
    }
  });
}).catch((err: Error) => {
  mainContent.innerHTML = `<div class="error">Error cargando la Biblia: ${err.message}</div>`;
});

function updateNavActive(route: Route): void {
  bottomNav.querySelectorAll<HTMLButtonElement>('.nav-btn').forEach(btn => {
    btn.classList.toggle('active',
      (route.name === 'index'     && btn.dataset.route === '/') ||
      (route.name === 'bookmarks' && btn.dataset.route === '/bookmarks') ||
      (route.name === 'settings'  && btn.dataset.route === '/settings'),
    );
  });
}
