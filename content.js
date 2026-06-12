console.log("[content.js] Script content chargé");

async function matchesCurrentPage() {
  try {
    const data = await chrome.storage.local.get(["patterns"]);
    const patterns = data.patterns || [];

    if (patterns.length === 0) return false;

    // 1. On récupère l'URL et on retire le protocole et les "www."
    let cleanUrl = window.location.href
      .replace(/^(https?:\/\/)?(www\.)?/, "") // Enleve https://, http://, et www.
      .toLowerCase();

    console.log("[content.js] URL nettoyée pour comparaison :", cleanUrl);

    return patterns.some((p) => {
      // 2. On nettoie aussi le pattern au cas où l'utilisateur a écrit "https://..."
      let cleanPattern = p.replace(/^(https?:\/\/)?(www\.)?/, "").toLowerCase();

      // 3. Échappement simple pour la Regex (on protège les caractères spéciaux de base)
      let regStr = cleanPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");

      // 4. On transforme l'astérisque * en joker universel (.*)
      regStr = regStr.replace(/\*/g, ".*");

      // 5. Comparaison
      const re = new RegExp(`^${regStr}$`);
      const isMatch = re.test(cleanUrl);

      console.log(`[content.js] Test "${cleanPattern}" -> Match: ${isMatch}`);
      return isMatch;
    });
  } catch (e) {
    console.error("Erreur lecture patterns :", e);
    return false;
  }
}
function handleMatches() {
  console.log("[content.js] Début vérification matching");
  matchesCurrentPage().then((ok) => {
    if (ok) {
      console.log("[content.js] Pattern trouvé, envoi message au background");
      chrome.runtime
        .sendMessage({
          command: "found",
          value: ok,
          page_url: window.location.href,
        })
        .catch(() =>
          console.error("[content.js] Erreur envoi message background"),
        );
    } else {
      console.log("[content.js] Aucun pattern correspondant arrêt de sonnerie");
      chrome.runtime.sendMessage({ command: "stop_alarm" });
    }
  });
}

// Lancement
handleMatches();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[content.js] Message reçu:", message);
  if (message.command === "show_stop_button") {
    console.log("[content.js] Affichage bouton stop");
    showStopButton();
  }
});

function showStopButton() {
  console.log("[content.js] Création bouton stop");
  if (document.getElementById("ext-stop-btn")) {
    console.log("[content.js] Bouton stop déjà existant");
    return;
  }

  const btn = document.createElement("button");
  btn.id = "ext-stop-btn";
  btn.innerText = "Arrêter la sonnerie";

  btn.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    z-index: 2147483647; background-color: #00bcd4; color: #121212;
    border: none; padding: 12px 24px; font-size: 16px; font-weight: bold;
    font-family: system-ui, sans-serif; border-radius: 6px; cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 188, 212, 0.3); transition: background-color 0.5s, transform 0.5s;
  `;

  btn.onmouseover = () => (btn.style.backgroundColor = "#0097a7");
  btn.onmouseout = () => (btn.style.backgroundColor = "#00bcd4");
  btn.onmousedown = () =>
    (btn.style.transform = "translateX(-50%) scale(0.95)");
  btn.onmouseup = () => (btn.style.transform = "translateX(-50%) scale(1)");

  btn.onclick = () => {
    console.log("[content.js] Clic bouton stop, envoi commande stop_alarm");
    chrome.runtime.sendMessage({ command: "stop_alarm" });
    btn.remove();
  };

  document.body.appendChild(btn);
  console.log("[content.js] Bouton stop ajouté au DOM");
}
