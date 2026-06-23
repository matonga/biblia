import { getSettings, saveSettings, applySettings, type Settings } from '../store';

export function renderSettingsView(container: HTMLElement): void {
  const s = getSettings();

  container.innerHTML = `
    <div class="view view-settings">
      <div class="view-header">
        <h1>Ajustes</h1>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Apariencia</div>

        <div class="settings-row">
          <span class="settings-label">Modo oscuro</span>
          <label class="toggle" aria-label="Modo oscuro">
            <input type="checkbox" id="dark-toggle" ${s.darkMode ? 'checked' : ''}>
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Texto</div>

        <div class="settings-row">
          <span class="settings-label">Tamaño de fuente</span>
          <span class="settings-value" id="font-size-val">${s.fontSize}px</span>
        </div>
        <div class="settings-row">
          <span style="font-size:0.8rem;color:var(--text-muted)">A</span>
          <div class="range-wrap">
            <input type="range" class="range-input" id="font-size-range"
                   min="13" max="24" step="1" value="${s.fontSize}"
                   aria-label="Tamaño de fuente">
          </div>
          <span style="font-size:1.1rem;color:var(--text-muted)">A</span>
        </div>

        <div class="settings-row" style="margin-top:0.5rem">
          <span class="settings-label">Interlineado</span>
        </div>
        <div class="settings-row">
          <div class="segment-btns" id="lh-btns" role="group" aria-label="Interlineado">
            ${[1.4, 1.6, 1.8, 2.0].map(v => `
              <button class="segment-btn ${s.lineHeight === v ? 'active' : ''}"
                      data-lh="${v}">${v}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-section-title">Vista previa</div>
        <div class="settings-preview" id="settings-preview">
          <p class="verse"><sup class="verse-num">1</sup>Al principio Dios creó el cielo y la tierra.</p>
          <p class="verse"><sup class="verse-num">2</sup>La tierra era algo informe y vacío, las tinieblas cubrían el abismo, y el soplo de Dios aleteaba sobre las aguas.</p>
        </div>
      </div>
    </div>
  `;

  const darkToggle  = container.querySelector<HTMLInputElement>('#dark-toggle')!;
  const fontRange   = container.querySelector<HTMLInputElement>('#font-size-range')!;
  const fontVal     = container.querySelector<HTMLElement>('#font-size-val')!;
  const lhBtns      = container.querySelector<HTMLElement>('#lh-btns')!;

  darkToggle.addEventListener('change', () => {
    const updated = { ...getSettings(), darkMode: darkToggle.checked };
    saveSettings(updated);
    applySettings(updated);
  });

  fontRange.addEventListener('input', () => {
    const size = parseInt(fontRange.value, 10);
    fontVal.textContent = `${size}px`;
    const updated = { ...getSettings(), fontSize: size };
    saveSettings(updated);
    applySettings(updated);
  });

  lhBtns.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('.segment-btn');
    if (!btn) return;
    const lh = parseFloat(btn.dataset.lh ?? '1.6');
    lhBtns.querySelectorAll('.segment-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const updated: Settings = { ...getSettings(), lineHeight: lh };
    saveSettings(updated);
    applySettings(updated);
  });
}
