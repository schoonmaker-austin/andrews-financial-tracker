(function () {
  "use strict";

  let installPrompt = null;
  const $ = selector => document.querySelector(selector);

  function standalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function appleMobile() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  }

  function updateInstallUI() {
    const card = $("#installCard");
    const button = $("#installButton");
    if (!card || !button) return;
    card.hidden = standalone();
    button.hidden = standalone();
    if (appleMobile()) {
      $("#installTitle").textContent = "Put this on Andrew's Home Screen";
      $("#installCopy").textContent = "In Safari, tap Share, choose Add to Home Screen, turn on Open as Web App, then tap Add.";
      button.textContent = "Show iPhone / iPad steps";
    } else if (installPrompt) {
      $("#installTitle").textContent = "Install Andrew's tracker";
      $("#installCopy").textContent = "Open it from the Chromebook launcher like any other app.";
      button.textContent = "Install this app";
    } else {
      $("#installTitle").textContent = "Keep Andrew's tracker handy";
      $("#installCopy").textContent = "Use your browser menu and choose Install page as app or Add to Home Screen.";
      button.textContent = "How to install";
    }
  }

  async function requestInstall() {
    if (installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      installPrompt = null;
      updateInstallUI();
      return;
    }
    const dialog = $("#installDialog");
    $("#installDeviceSteps").innerHTML = appleMobile()
      ? "<strong>On iPhone or iPad</strong><ol><li>Open this page in Safari.</li><li>Tap the Share button.</li><li>Choose Add to Home Screen.</li><li>Turn on Open as Web App, then tap Add.</li></ol>"
      : "<strong>On Chromebook</strong><ol><li>Open this page in Chrome.</li><li>Open the three-dot menu.</li><li>Choose Cast, save and share.</li><li>Choose Install page as app.</li></ol>";
    dialog.showModal();
  }

  function initialize() {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname))) {
      navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" }).catch(() => {
        const status = $("#saveStatus");
        if (status) status.title = "Offline app files could not be prepared on this visit.";
      });
    }
    window.addEventListener("beforeinstallprompt", event => {
      event.preventDefault();
      installPrompt = event;
      updateInstallUI();
    });
    window.addEventListener("appinstalled", updateInstallUI);
    $("#installButton")?.addEventListener("click", requestInstall);
    $("#closeInstallDialog")?.addEventListener("click", () => $("#installDialog").close());
    updateInstallUI();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})();
