document.addEventListener("DOMContentLoaded", async () => {
  console.log("[options.js] DOM chargé");

  const patternList = document.getElementById("pattern-list");
  const newPatternInput = document.getElementById("new-pattern");
  const addPatternBtn = document.getElementById("add-pattern");
  const audioUpload = document.getElementById("audio-upload");
  const clearAudioBtn = document.getElementById("clear-audio");
  const audioPreview = document.getElementById("audio-preview");

  // Migration vers async/await
  const data = await chrome.storage.local.get(["patterns", "ringtone"]);
  console.log("[options.js] Données chargées:", data);

  const patterns = data.patterns || [];
  console.log("[options.js] Patterns chargés:", patterns);
  renderPatterns(patterns);

  if (data.ringtone) {
    console.log("[options.js] Ringtone personnalisé trouvé");
    audioPreview.src = data.ringtone;
    audioPreview.style.display = "block";
  }

  function renderPatterns(patterns) {
    console.log("[options.js] Rendu des patterns:", patterns);
    patternList.innerHTML = "";
    patterns.forEach((pattern, index) => {
      const li = document.createElement("li");
      li.className = "pattern-item";
      li.innerHTML = `
        <span>${pattern}</span>
        <button class="btn-danger delete-btn" data-index="${index}">Supprimer</button>
      `;
      patternList.appendChild(li);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const index = e.target.getAttribute("data-index");
        console.log("[options.js] Suppression pattern index:", index);
        patterns.splice(index, 1);
        await chrome.storage.local.set({ patterns });
        console.log("[options.js] Patterns mis à jour après suppression");
        renderPatterns(patterns);
      });
    });
  }

  addPatternBtn.addEventListener("click", async () => {
    const val = newPatternInput.value.trim();
    console.log("[options.js] Ajout pattern:", val);

    if (val) {
      const data = await chrome.storage.local.get(["patterns"]);
      const patterns = data.patterns || [];

      if (!patterns.includes(val)) {
        console.log("[options.js] Pattern nouveau, ajout");
        patterns.push(val);
        await chrome.storage.local.set({ patterns });
        console.log("[options.js] Pattern ajouté avec succès");
        renderPatterns(patterns);
        newPatternInput.value = "";
      } else {
        console.log("[options.js] Pattern déjà existant");
      }
    }
  });

  audioUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    console.log(
      "[options.js] Upload audio:",
      file ? file.name : "aucun fichier",
    );

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Audio = event.target.result;
        console.log(
          "[options.js] Audio converti en base64, taille:",
          base64Audio.length,
        );
        chrome.storage.local.set({ ringtone: base64Audio });
        audioPreview.src = base64Audio;
        audioPreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  clearAudioBtn.addEventListener("click", async () => {
    console.log("[options.js] Réinitialisation ringtone");
    await chrome.storage.local.remove("ringtone");
    audioPreview.src = "";
    audioPreview.style.display = "none";
    audioUpload.value = "";
  });
});
