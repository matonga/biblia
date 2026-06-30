interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners: Array<() => void> = [];

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  listeners.forEach(cb => cb());
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

export function isInstallable(): boolean {
  return deferredPrompt !== null;
}

export function onInstallAvailable(cb: () => void): void {
  listeners.push(cb);
}

export async function promptInstall(): Promise<void> {
  if (!deferredPrompt) return;
  await deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
}
