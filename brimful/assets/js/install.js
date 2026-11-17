// "Get the app": installs Brimful to the home screen as a web app (PWA).
// Chrome, Edge, Samsung Internet and other Chromium browsers can show their own install prompt.
// Safari (iPhone/iPad, Mac) and Firefox can't be prompted from a page, so we show the steps instead.
// Nothing is downloaded from an app store and no data is sent anywhere: the app keeps living in this browser's storage.
let deferred = null;

const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const ua = navigator.userAgent;
const isIOS = () => /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isSafariMac = () => /Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua);
const isFirefox = () => /Firefox|FxiOS/.test(ua);

// CSS hides every [data-install] element while html has .is-app, including ones rendered later.
function sync() { document.documentElement.classList.toggle("is-app", standalone()); }

export function setupInstall(app) {
  addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; sync(); });
  addEventListener("appinstalled", () => { deferred = null; sync(); app.toast("Brimful is on your home screen."); });
  matchMedia("(display-mode: standalone)").addEventListener?.("change", sync);
  sync();
  return {
    install: async () => {
      if (standalone()) { app.toast("You're already using the Brimful app."); return; }
      if (deferred) {
        const p = deferred; deferred = null;
        p.prompt();
        const { outcome } = await p.userChoice.catch(() => ({ outcome: "dismissed" }));
        if (outcome !== "accepted") app.toast("No problem. You can add Brimful any time from here.");
        return;
      }
      app.sheet(steps());
    },
  };
}

function steps() {
  const shareIcon = `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" style="display:inline;vertical-align:-4px;fill:none;stroke:currentColor;stroke-width:2"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
  let list;
  if (isIOS()) list = `<li>Open this page in <strong>Safari</strong> (other iPhone browsers may not offer it).</li>
      <li>Tap the <strong>Share</strong> button ${shareIcon} at the bottom or top of the screen.</li>
      <li>Scroll down and tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>`;
  else if (isSafariMac()) list = `<li>In the menu bar, choose <strong>File</strong> then <strong>Add to Dock</strong>.</li><li>Click <strong>Add</strong>.</li>`;
  else if (isFirefox()) list = /Android/.test(ua)
      ? `<li>Tap the <strong>⋮</strong> menu.</li><li>Tap <strong>Add to Home screen</strong> (or <strong>Install</strong>).</li>`
      : `<li>Firefox on computers can't install web apps. Open this page in Chrome or Edge and use <strong>Get the app</strong> there, or bookmark it.</li>`;
  else list = `<li>Open your browser's <strong>⋮</strong> menu.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>If you don't see it, Brimful may already be installed. Check your home screen or app list.</li>`;
  return `<h2 id="dlg-title">Add Brimful to your home screen</h2>
    <p>Brimful opens like an app, full screen and offline. It's free, and it's the same Brimful as here.</p>
    <ol class="steps">${list}</ol>
    <p class="fine">Your jars stay in this browser's storage on this device. If you add the app from a different browser, start a backup first (Settings → Your data) so you can restore your jars there.</p>
    <div class="row"><button type="button" class="btn" data-close>Got it</button></div>`;
}
