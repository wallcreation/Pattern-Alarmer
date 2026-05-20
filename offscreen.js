let audioPlayer = null;

console.log("[offscreen.js] Script chargé");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[offscreen.js] Message reçu :", message);

  if (message.command === "play_audio") {
    console.log("[offscreen.js] Commande play_audio reçue");

    // Récupération directe du fichier local à la racine de l'extension
    const audioSrc = chrome.runtime.getURL("audio.mp3");

    if (!audioPlayer) {
      console.log("[offscreen.js] Création du player avec audio.mp3");
      audioPlayer = new Audio(audioSrc);
      audioPlayer.loop = true;
    }

    audioPlayer
      .play()
      .then(() => console.log("[offscreen.js] Lecture de audio.mp3 démarrée"))
      .catch((e) =>
        console.error("[offscreen.js] Erreur de lecture audio :", e),
      );
  }
});
