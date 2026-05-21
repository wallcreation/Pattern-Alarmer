// Initialisation des patterns et du mode audio par défaut à l'installation
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[background.js] Extension installée ou mise à jour");

  const data = await chrome.storage.local.get(["patterns", "audioMode"]);

  // Si aucun pattern n'est encore enregistré, on met les valeurs par défaut
  if (!data.patterns || data.patterns.length === 0) {
    const defaultPatterns = [
      "textspins.com/*/gestopt-gesprek/*",
      "textspins.com/*gesprek/*",
      "textspins.com/fr/conversations",
    ];

    await chrome.storage.local.set({ patterns: defaultPatterns });
    console.log(
      "[background.js] Patterns par défaut initialisés :",
      defaultPatterns,
    );
  }

  // Si aucun mode audio n'est défini, on met "soft" par défaut
  if (!data.audioMode) {
    await chrome.storage.local.set({ audioMode: "soft" });
    console.log("[background.js] Mode audio par défaut initialisé: soft");
  }
});

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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.command === "found") {
    console.log("[background.js] Pattern trouvé, URL:", message.page_url);

    // Récupération du mode audio sélectionné
    const data = await chrome.storage.local.get(["audioMode"]);
    const audioMode = data.audioMode || "soft";
    const audioFile = audioMode === "hard" ? "audios/hard.wav" : "audios/soft.mp3";
    console.log("[background.js] Fichier audio sélectionné:", audioFile);

    // Déclenchement direct du document offscreen
    setupOffscreenDocument("offscreen.html")
      .then(() => {
        chrome.runtime.sendMessage({
          command: "play_audio",
          audioFile: audioFile,
        });
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
