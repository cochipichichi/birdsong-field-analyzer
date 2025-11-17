// Controles inclusivos + idioma

let currentLang = "es";
let baseFontSize = 16;

function setLanguage(lang) {
  currentLang = lang;

  document
    .querySelectorAll(".reel-caption")
    .forEach((el) => el.classList.add("hidden"));
  document
    .querySelector(`.reel-caption[data-lang="${lang}"]`)
    ?.classList.remove("hidden");

  document.getElementById("title-es")?.classList.toggle("hidden", lang !== "es");
  document.getElementById("title-en")?.classList.toggle("hidden", lang !== "en");
  document.getElementById("lead-es")?.classList.toggle("hidden", lang !== "es");
  document.getElementById("lead-en")?.classList.toggle("hidden", lang !== "en");

  document
    .getElementById("hint-es")
    ?.classList.toggle("hidden", lang !== "es");
  document
    .getElementById("hint-en")
    ?.classList.toggle("hidden", lang !== "en");

  document
    .getElementById("species-title-es")
    ?.classList.toggle("hidden", lang !== "es");
  document
    .getElementById("species-title-en")
    ?.classList.toggle("hidden", lang !== "en");

  document
    .getElementById("species-intro-es")
    ?.classList.toggle("hidden", lang !== "es");
  document
    .getElementById("species-intro-en")
    ?.classList.toggle("hidden", lang !== "en");
}

function toggleTheme() {
  document.body.classList.toggle("theme-light");
}

function changeFont(delta) {
  baseFontSize = Math.min(22, Math.max(14, baseFontSize + delta));
  document.body.style.fontSize = baseFontSize + "px";
}

function toggleFocusMode() {
  document.body.classList.toggle("focus-mode");
}

function speakCaption() {
  if (!("speechSynthesis" in window)) return;
  const activeCaption = document.querySelector(
    `.reel-caption[data-lang="${currentLang}"]`
  );
  if (!activeCaption) return;

  const text = activeCaption.innerText;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLang === "en" ? "en-US" : "es-ES";
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

function handleSearch() {
  const query = prompt(
    currentLang === "en" ? "Search in the text:" : "Buscar en el texto:"
  );
  if (!query) return;
  const bodyText = document.body.innerText.toLowerCase();
  const found = bodyText.includes(query.toLowerCase());
  alert(
    found
      ? currentLang === "en"
        ? `“${query}” found in the page.`
        : `“${query}” se encuentra en la página.`
      : currentLang === "en"
      ? `“${query}” not found.`
      : `“${query}” no se encontró.`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-theme")?.addEventListener("click", toggleTheme);
  document
    .getElementById("btn-font-plus")
    ?.addEventListener("click", () => changeFont(1));
  document
    .getElementById("btn-font-minus")
    ?.addEventListener("click", () => changeFont(-1));
  document
    .getElementById("btn-focus")
    ?.addEventListener("click", toggleFocusMode);
  document
    .getElementById("btn-tts")
    ?.addEventListener("click", speakCaption);
  document
    .getElementById("btn-search")
    ?.addEventListener("click", handleSearch);
  document.getElementById("btn-lang")?.addEventListener("click", () => {
    setLanguage(currentLang === "en" ? "es" : "en");
  });

  setLanguage("es");
});
