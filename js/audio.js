// audio.js – captura de micrófono + análisis básico
// Importante: este módulo NO clasifica especies de verdad, sólo genera
// heurísticas simples y eventos para la red 3D y la UI.
// Para uso profesional, conecta sendToExternalAPI() a BirdNET u otro backend.

let audioContext;
let analyser;
let micSource;
let dataArray;
let rafId;
let listening = false;

const levelBar = document.getElementById("level-bar");
const audioStatus = document.getElementById("audio-status");
const sessionSummary = document.getElementById("session-summary");
const speciesCurrent = document.getElementById("species-current");
const speciesListEl = document.getElementById("species-list");

let sessionStartTime = null;
let syllableCount = 0;
let transitionCount = 0;

// Banco simple de especies demo (Chile)
const SPECIES_BANK = [
  { name: "Tenca (Mimus thenca)", band: "mid", emoji: "🎶" },
  { name: "Zorzal (Turdus falcklandii)", band: "low", emoji: "🕊️" },
  { name: "Chiuque / Rayadito (Aphrastura spinicauda)", band: "high", emoji: "🐦" },
  { name: "Diuca (Diuca diuca)", band: "mid", emoji: "🎼" },
  { name: "Loica (Leistes loyca)", band: "high", emoji: "🟥" }
];

function updateSummary() {
  const now = Date.now();
  const dur = sessionStartTime ? Math.round((now - sessionStartTime) / 1000) : 0;
  sessionSummary.textContent = `⏱️ Duración: ${dur} s · 🔹 Sílabas estimadas: ${syllableCount} · 🔗 Transiciones: ${transitionCount}`;
}

function startListening() {
  if (listening) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    audioStatus.textContent = "⚠️ Este navegador no permite acceder al micrófono.";
    return;
  }

  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      micSource = audioContext.createMediaStreamSource(stream);
      micSource.connect(analyser);

      listening = true;
      sessionStartTime = Date.now();
      audioStatus.textContent = "🎧 Escuchando... habla lo menos posible y deja que canten las aves.";
      loop();
    })
    .catch((err) => {
      console.error(err);
      audioStatus.textContent = "❌ No se pudo acceder al micrófono.";
    });
}

function stopListening() {
  listening = false;
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  cancelAnimationFrame(rafId);
  levelBar.style.width = "0%";
  audioStatus.textContent = "⏸️ Escucha detenida.";
}

function loop() {
  if (!listening || !analyser) return;

  analyser.getByteFrequencyData(dataArray);
  const energy = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  // Nivel visual
  const level = Math.min(100, (energy / 255) * 120);
  levelBar.style.width = level + "%";

  // División en bandas: low/mid/high
  const third = Math.floor(dataArray.length / 3);
  const low = avg(dataArray.slice(0, third));
  const mid = avg(dataArray.slice(third, 2 * third));
  const high = avg(dataArray.slice(2 * third));

  // Detección muy simple de "sílabas" (picos de energía)
  const threshold = 70; // umbral heurístico
  if (energy > threshold) {
    syllableCount++;
    transitionCount = Math.max(0, syllableCount - 1);

    // Enviar evento a la red 3D
    const band =
      high > mid && high > low ? "high" : mid > low ? "mid" : "low";
    const syllable = { band, energy, timestamp: Date.now() };
    window.dispatchEvent(
      new CustomEvent("birdsong-syllable", { detail: syllable })
    );

    // Actualizar especie sugerida
    updateSpeciesEstimate(low, mid, high);
  }

  updateSummary();
  rafId = requestAnimationFrame(loop);
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function updateSpeciesEstimate(low, mid, high) {
  const maxBand = Math.max(low, mid, high);
  const domBand =
    maxBand === high ? "high" : maxBand === mid ? "mid" : "low";

  // Seleccionar especie candidata por banda
  const candidates = SPECIES_BANK.filter((s) => s.band === domBand);
  const species =
    candidates[Math.floor(Math.random() * candidates.length)] ||
    SPECIES_BANK[0];

  const confidence =
    40 + Math.round(Math.random() * 40); // 40–80% como demo

  speciesCurrent.textContent = `${species.emoji} Sugerencia: ${species.name} · Confianza demo: ${confidence}%`;

  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString();
  li.innerHTML = `<span>${time} · ${species.emoji} ${species.name}</span><span class="tag">${confidence}%</span>`;
  speciesListEl.prepend(li);
}

// Exportar CSV de la sesión (simple)
function downloadCSV() {
  const rows = [
    ["timestamp_ms", "band", "energy", "note"],
  ];

  // Esta implementación es mínima: sólo marca que se exportó desde la interfaz.
  rows.push([Date.now(), "n/a", "n/a", "Export demo; implementar buffer de sílabas si se desea detalle."]);

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "birdsong_session_demo.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Hook para conectar BirdNET u otro backend
async function sendToExternalAPI(audioChunk) {
  // TODO: aquí iría el envío a un servidor tuyo que use BirdNET o modelo similar.
  // Por ejemplo:
  // const res = await fetch("https://tu-servidor/birdnet", { method: "POST", body: audioChunk });
  // const json = await res.json();
  // return json;
  return null;
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-start-audio")
    ?.addEventListener("click", startListening);
  document
    .getElementById("btn-stop-audio")
    ?.addEventListener("click", stopListening);
  document
    .getElementById("btn-reset-session")
    ?.addEventListener("click", () => {
      syllableCount = 0;
      transitionCount = 0;
      sessionStartTime = Date.now();
      speciesListEl.innerHTML = "";
      speciesCurrent.textContent = "🕊️ Esperando audio...";
      updateSummary();
    });
  document
    .getElementById("btn-download-csv")
    ?.addEventListener("click", downloadCSV);

  updateSummary();
});
