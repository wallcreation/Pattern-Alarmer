chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

let creatingOffscreen;

async function setupOffscreenDocument(path) {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
  } else {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: path,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Joue une alerte sonore",
    });
    await creatingOffscreen;
    creatingOffscreen = null;
  }
}

async function closeOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL("offscreen.html");
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

// Gestionnaire de messages nettoyé de tout stockage
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "found") {
    console.log("[background.js] Pattern trouvé, URL:", message.page_url);

    // Déclenchement direct du document offscreen
    setupOffscreenDocument("offscreen.html")
      .then(() => {
        chrome.runtime.sendMessage({ command: "play_audio" });
      })
      .catch((err) => console.error("[background.js] Erreur offscreen:", err));

    if (sender.tab && sender.tab.id) {
      chrome.tabs
        .sendMessage(sender.tab.id, { command: "show_stop_button" })
        .catch(() => {});
    }
  } else if (message.command === "stop_alarm") {
    console.log("[background.js] Commande stop_alarm reçue");
    closeOffscreenDocument();
  }
});
