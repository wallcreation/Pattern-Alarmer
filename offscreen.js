let audioPlayer = null;
let currentAudioSrc = null;

console.log("[offscreen.js] Script chargé");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[offscreen.js] Message reçu :", message);

  if (message.command === "play_audio") {
    console.log("[offscreen.js] Commande play_audio reçue");

    // Récupération du fichier audio à jouer
    const audioFile = message.audioFile || "audios/soft.mp3";
    const audioSrc = chrome.runtime.getURL(audioFile);
    console.log("[offscreen.js] Fichier audio reçu:", audioFile, "URL:", audioSrc);

    // Si le fichier audio a changé, on crée un nouveau player
    if (currentAudioSrc !== audioSrc) {
      if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer = null;
      }
      currentAudioSrc = audioSrc;
      console.log("[offscreen.js] Création du player avec", audioFile);
      audioPlayer = new Audio(audioSrc);
      audioPlayer.loop = true;
    }

    audioPlayer
      .play()
      .then(() => console.log("[offscreen.js] Lecture de", audioFile, "démarrée"))
      .catch((e) =>
        console.error("[offscreen.js] Erreur de lecture audio :", e),
      );
  }
});
