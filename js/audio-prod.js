// audio-prod.js – versión productiva 100% cliente
// - Captura audio del micrófono.
// - Analiza energía y bandas de frecuencia.
// - Genera eventos "birdsong-syllable" para la red 3D.
// - Estima especie de forma DETERMINISTA (sin random) basada en firma de bandas.
// - Exporta CSV con log de eventos.

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
let eventCount = 0;
let transitionCount = 0;

// Log de eventos para CSV
let eventLog = [];

// Firmas heurísticas para especies chilenas comunes
// vector firma = [low_rel, mid_rel, high_rel] normalizado a 1
const SPECIES_SIGNATURES = [
  {
    key: "tenca",
    emoji: "🎶",
    common_name_es: "Tenca",
    scientific_name: "Mimus thenca",
    signature: [0.25, 0.5, 0.25] // dominante medio
  },
  {
    key: "zorzal",
    emoji: "🕊️",
    common_name_es: "Zorzal",
    scientific_name: "Turdus falcklandii",
    signature: [0.5, 0.35, 0.15] // más peso en graves
  },
  {
    key: "rayadito",
    emoji: "🐦",
    common_name_es: "Rayadito",
    scientific_name: "Aphrastura spinicauda",
    signature: [0.15, 0.35, 0.5] // más agudos
  },
  {
    key: "diuca",
    emoji: "🎼",
    common_name_es: "Diuca",
    scientific_name: "Diuca diuca",
    signature: [0.3, 0.45, 0.25]
  },
  {
    key: "loica",
    emoji: "🟥",
    common_name_es: "Loica",
    scientific_name: "Leistes loyca",
    signature: [0.2, 0.4, 0.4]
  }
];

function updateSummary() {
  const now = Date.now();
  const dur = sessionStartTime ? Math.round((now - sessionStartTime) / 1000) : 0;
  sessionSummary.textContent = `⏱️ Duración: ${dur} s · 🔹 Eventos detectados: ${eventCount} · 🔗 Transiciones: ${transitionCount}`;
}

async function startListening() {
  if (listening) return;
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    audioStatus.textContent = "⚠️ Este navegador no permite acceder al micrófono.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false
      },
      video: false
    });

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    micSource = audioContext.createMediaStreamSource(stream);
    micSource.connect(analyser);

    listening = true;
    sessionStartTime = Date.now();
    audioStatus.textContent = "🎧 Escuchando... procesamiento local en el navegador.";

    loop();
  } catch (err) {
    console.error(err);
    audioStatus.textContent = "❌ No se pudo acceder al micrófono.";
  }
}

function stopListening() {
  listening = false;
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (micSource && micSource.mediaStream) {
    micSource.mediaStream.getTracks().forEach((t) => t.stop());
  }
  cancelAnimationFrame(rafId);
  levelBar.style.width = "0%";
  audioStatus.textContent = "⏸️ Escucha detenida.";
}

function loop() {
  if (!listening || !analyser) return;

  analyser.getByteFrequencyData(dataArray);
  const energy = avg(dataArray);

  // Nivel visual
  const level = Math.min(100, (energy / 255) * 120);
  levelBar.style.width = level + "%";

  // Bandas
  const third = Math.floor(dataArray.length / 3);
  const low = avg(dataArray.slice(0, third));
  const mid = avg(dataArray.slice(third, 2 * third));
  const high = avg(dataArray.slice(2 * third));

  const threshold = 70; // ajuste fino en terreno
  if (energy > threshold) {
    const timestamp = Date.now();
    eventCount++;
    transitionCount = Math.max(0, eventCount - 1);

    // Normalizar firma
    const sum = low + mid + high || 1;
    const lowRel = low / sum;
    const midRel = mid / sum;
    const highRel = high / sum;

    // Elegir species por distancia euclidiana mínima
    const species = selectSpecies([lowRel, midRel, highRel]);

    // Emitir evento para red 3D
    const band =
      highRel > midRel && highRel > lowRel
        ? "high"
        : midRel > lowRel
        ? "mid"
        : "low";

    const syllable = {
      band,
      energy,
      timestamp
    };

    window.dispatchEvent(
      new CustomEvent("birdsong-syllable", { detail: syllable })
    );

    // Actualizar UI y log
    updateSpeciesUI(species, { lowRel, midRel, highRel, energy, timestamp });
  }

  updateSummary();
  rafId = requestAnimationFrame(loop);
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function selectSpecies(vec) {
  let best = null;
  let bestDist = Infinity;

  SPECIES_SIGNATURES.forEach((s) => {
    const sig = s.signature;
    const dist = Math.sqrt(
      (vec[0] - sig[0]) ** 2 +
        (vec[1] - sig[1]) ** 2 +
        (vec[2] - sig[2]) ** 2
    );
    if (dist < bestDist) {
      bestDist = dist;
      best = s;
    }
  });

  // Confianza heurística inversa a la distancia
  const maxDist = Math.sqrt(3); // dist máx en espacio [0,1]^3
  const raw = Math.max(0, maxDist - bestDist) / maxDist;
  const confidence = Math.round(40 + raw * 60); // 40–100%

  return { ...best, confidence };
}

function updateSpeciesUI(species, info) {
  if (!species) return;
  const label = `${species.common_name_es} (${species.scientific_name})`;

  speciesCurrent.textContent = `${species.emoji} Estimación local: ${label} · Confianza: ${species.confidence}%`;

  const li = document.createElement("li");
  const time = new Date(info.timestamp).toLocaleTimeString();
  li.innerHTML = `<span>${time} · ${species.emoji} ${label}</span><span class="tag">${species.confidence}%</span>`;
  speciesListEl.prepend(li);

  eventLog.push({
    timestamp: info.timestamp,
    low_rel: info.lowRel,
    mid_rel: info.midRel,
    high_rel: info.highRel,
    energy: Math.round(info.energy),
    species_key: species.key,
    common_name_es: species.common_name_es,
    scientific_name: species.scientific_name,
    confidence: species.confidence
  });
}

// Exportar CSV
function downloadCSV() {
  const rows = [
    [
      "timestamp_ms",
      "datetime_local",
      "low_rel",
      "mid_rel",
      "high_rel",
      "energy",
      "species_key",
      "common_name_es",
      "scientific_name",
      "confidence"
    ]
  ];

  eventLog.forEach((e) => {
    rows.push([
      e.timestamp,
      new Date(e.timestamp).toLocaleString(),
      e.low_rel.toFixed(3),
      e.mid_rel.toFixed(3),
      e.high_rel.toFixed(3),
      e.energy,
      e.species_key,
      `"${e.common_name_es}"`,
      `"${e.scientific_name}"`,
      e.confidence
    ]);
  });

  const csvContent = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "birdsong_field_session.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// Hook para, a futuro, conectar BirdNET u otro backend
// Recibe un resumen de la ventana actual; se puede enviar a tu servidor.
async function sendSummaryToBackend(summary) {
  // Implementar si lo necesitas. Ejemplo:
  // await fetch("https://tu-servidor/summary", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(summary)
  // });
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
      eventCount = 0;
      transitionCount = 0;
      sessionStartTime = Date.now();
      speciesListEl.innerHTML = "";
      speciesCurrent.textContent = "🕊️ Esperando audio...";
      eventLog = [];
      updateSummary();
    });
  document
    .getElementById("btn-download-csv")
    ?.addEventListener("click", downloadCSV);

  updateSummary();
});
