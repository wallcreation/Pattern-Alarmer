document.addEventListener("DOMContentLoaded", async () => {
  console.log("[options.js] DOM chargé");

  const patternList = document.getElementById("pattern-list");
  const newPatternInput = document.getElementById("new-pattern");
  const addPatternBtn = document.getElementById("add-pattern");

  // Chargement initial des patterns et du mode audio
  const data = await chrome.storage.local.get(["patterns", "audioMode"]);
  console.log("[options.js] Données chargées:", data);

  const patterns = data.patterns || [];
  const audioMode = data.audioMode || "soft";
  console.log("[options.js] Patterns chargés:", patterns);
  console.log("[options.js] Mode audio chargé:", audioMode);
  renderPatterns(patterns);

  // Chargement du mode audio sélectionné et ajout des event listeners
  const audioRadios = document.querySelectorAll('input[name="audio-mode"]');
  audioRadios.forEach((radio) => {
    if (radio.value === audioMode) {
      radio.checked = true;
    }
    radio.addEventListener('change', async (e) => {
      const mode = e.target.value;
      console.log('[options.js] Mode audio sélectionné:', mode);
      await chrome.storage.local.set({ audioMode: mode });
      console.log('[options.js] Mode audio sauvegardé');
    });
  });

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

  // Bouton arrêter la sonnerie
  const stopAlarmBtn = document.getElementById("stop-alarm-btn");
  stopAlarmBtn.addEventListener("click", () => {
    console.log("[options.js] Envoi du signal stop_alarm");
    chrome.runtime.sendMessage({ command: "stop_alarm" });
  });
});
