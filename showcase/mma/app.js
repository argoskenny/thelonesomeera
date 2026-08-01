const CREATURES = [
  { id: "moon-moth", name: "Moon Moth", column: 0, row: 0 },
  { id: "baby-dragon", name: "Baby Dragon", column: 1, row: 0 },
  { id: "fox-spirit", name: "Fox Spirit", column: 2, row: 0 },
  { id: "mushroom-familiar", name: "Mushroom Familiar", column: 3, row: 0 },
  { id: "cloud-whale", name: "Cloud Whale", column: 0, row: 1 },
  { id: "crystal-stag", name: "Crystal Stag", column: 1, row: 1 },
  { id: "owl-gryphon", name: "Owl Gryphon", column: 2, row: 1 },
  { id: "sea-serpent", name: "Sea Serpent", column: 3, row: 1 },
];

const IMAGE_ASSETS = ["assets/observatory-bg.png", "assets/magical-creatures.png"];

const DIFFICULTIES = {
  easy: { label: "Easy", pairs: 4, columns: 4, multiplier: 1 },
  mystic: { label: "Mystic", pairs: 6, columns: 4, multiplier: 1.35 },
  mythic: { label: "Mythic", pairs: 8, columns: 4, multiplier: 1.75 },
};

const board = document.querySelector("#game-board");
const cardTemplate = document.querySelector("#card-template");
const timerElement = document.querySelector("#timer");
const comboElement = document.querySelector("#combo");
const scoreElement = document.querySelector("#score");
const comboBurst = document.querySelector("#combo-burst");
const comboBurstValue = document.querySelector("#combo-burst-value");
const comboBurstPoints = document.querySelector("#combo-burst-points");
const difficultyNote = document.querySelector("#difficulty-note");
const soundToggle = document.querySelector("#sound-toggle");
const resultModal = document.querySelector("#result-modal");
const appShell = document.querySelector("#app-shell");
const assetLoader = document.querySelector("#asset-loader");
const assetLoaderStatus = document.querySelector("#asset-loader-status");
const assetRetry = document.querySelector("#asset-retry");

let difficulty = "mystic";
let flippedCards = [];
let matchedPairs = 0;
let combo = 0;
let bestCombo = 0;
let score = 0;
let elapsedSeconds = 0;
let timerId = null;
let timerStarted = false;
let boardLocked = false;
let soundEnabled = true;
let audioContext = null;
let lastFocusedCard = null;

function shuffle(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatScore(value) {
  return Math.round(value).toLocaleString("en-US");
}

function startTimer() {
  if (timerStarted) return;

  timerStarted = true;
  timerId = window.setInterval(() => {
    elapsedSeconds += 1;
    timerElement.textContent = formatTime(elapsedSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerId) window.clearInterval(timerId);
  timerId = null;
}

function updateHud() {
  comboElement.textContent = `×${combo}`;
  scoreElement.textContent = formatScore(score);
}

function createCard(creature, instance) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const image = card.querySelector(".creature-image");

  card.dataset.creature = creature.id;
  card.dataset.instance = instance;
  card.setAttribute("aria-label", "Hidden magical creature card");
  image.src = "assets/magical-creatures.png";
  image.style.setProperty("--sprite-row", creature.row);
  image.style.setProperty("--sprite-x", `${-(creature.column + 0.5) * 25}%`);
  card.querySelector(".creature-name").textContent = creature.name;
  card.addEventListener("click", () => revealCard(card, creature));

  return card;
}

function buildDeck() {
  const config = DIFFICULTIES[difficulty];
  const selectedCreatures = shuffle(CREATURES).slice(0, config.pairs);
  const deck = shuffle(
    selectedCreatures.flatMap((creature) => [
      { creature, instance: `${creature.id}-a` },
      { creature, instance: `${creature.id}-b` },
    ]),
  );

  board.replaceChildren(...deck.map(({ creature, instance }) => createCard(creature, instance)));
  board.style.setProperty("--columns", config.columns);
  board.dataset.columns = config.columns;
  board.setAttribute("aria-label", `${config.label} board with ${deck.length} cards`);
  difficultyNote.textContent = `${config.label} · ${config.pairs} pairs`;
}

function resetGame({ focusBoard = false } = {}) {
  stopTimer();
  flippedCards = [];
  matchedPairs = 0;
  combo = 0;
  bestCombo = 0;
  score = 0;
  elapsedSeconds = 0;
  timerStarted = false;
  boardLocked = false;
  timerElement.textContent = "00:00";
  comboBurst.classList.remove("is-visible");
  resultModal.hidden = true;
  updateHud();
  buildDeck();

  if (focusBoard) board.querySelector(".memory-card")?.focus();
}

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  return audioContext;
}

function playTone(frequency, duration = 0.1, delay = 0) {
  if (!soundEnabled) return;

  const context = getAudioContext();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const startAt = context.currentTime + delay;
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.08, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function announceCombo(points) {
  if (combo < 2) return;

  comboBurstValue.textContent = `${combo} combo`;
  comboBurstPoints.textContent = `+${formatScore(points)}`;
  comboBurst.classList.remove("is-visible");
  void comboBurst.offsetWidth;
  comboBurst.classList.add("is-visible");
}

function revealCard(card, creature) {
  if (boardLocked || card.classList.contains("is-flipped") || card.classList.contains("is-matched")) return;

  startTimer();
  playTone(330, 0.07);
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", `${creature.name}, revealed`);
  flippedCards.push(card);

  if (flippedCards.length === 2) checkPair();
}

function checkPair() {
  boardLocked = true;
  const [firstCard, secondCard] = flippedCards;
  const isMatch = firstCard.dataset.creature === secondCard.dataset.creature;

  if (isMatch) {
    window.setTimeout(() => resolveMatch(firstCard, secondCard), 360);
  } else {
    window.setTimeout(() => resolveMismatch(firstCard, secondCard), 760);
  }
}

function resolveMatch(firstCard, secondCard) {
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  matchedPairs += 1;

  const config = DIFFICULTIES[difficulty];
  const basePoints = 100 * config.multiplier;
  const comboReward = Math.max(0, combo - 1) * 50 * config.multiplier;
  const points = Math.round(basePoints + comboReward);
  score += points;

  [firstCard, secondCard].forEach((card) => {
    card.classList.add("is-matched");
    card.disabled = true;
    card.setAttribute("aria-label", `${card.querySelector(".creature-name").textContent}, matched`);
  });

  playTone(523.25, 0.14);
  playTone(659.25, 0.16, 0.08);
  announceCombo(points);
  flippedCards = [];
  boardLocked = false;
  updateHud();

  if (matchedPairs === config.pairs) finishGame();
}

function resolveMismatch(firstCard, secondCard) {
  combo = 0;
  [firstCard, secondCard].forEach((card) => {
    card.classList.remove("is-flipped");
    card.setAttribute("aria-label", "Hidden magical creature card");
  });

  playTone(196, 0.12);
  flippedCards = [];
  boardLocked = false;
  updateHud();
}

function finishGame() {
  stopTimer();

  const config = DIFFICULTIES[difficulty];
  const timeBonus = Math.max(0, 300 - elapsedSeconds * 4) * config.multiplier;
  score += Math.round(timeBonus);
  updateHud();

  const bestScoreKey = `mythic-match-best-${difficulty}`;
  const previousBest = Number(window.localStorage.getItem(bestScoreKey) || 0);
  const isPersonalBest = score > previousBest;
  if (isPersonalBest) window.localStorage.setItem(bestScoreKey, String(score));

  document.querySelector("#final-score").textContent = formatScore(score);
  document.querySelector("#final-combo").textContent = `×${bestCombo}`;
  document.querySelector("#final-time").textContent = formatTime(elapsedSeconds);
  document.querySelector("#final-difficulty").textContent = config.label;
  document.querySelector("#personal-best").hidden = !isPersonalBest;

  playTone(523.25, 0.18);
  playTone(659.25, 0.2, 0.12);
  playTone(783.99, 0.28, 0.24);

  window.setTimeout(() => {
    lastFocusedCard = document.activeElement;
    resultModal.hidden = false;
    document.querySelector("#play-again").focus();
  }, 520);
}

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => {
    difficulty = button.dataset.difficulty;
    document.querySelectorAll("[data-difficulty]").forEach((candidate) => {
      const selected = candidate === button;
      candidate.classList.toggle("is-selected", selected);
      candidate.setAttribute("aria-pressed", String(selected));
    });
    resetGame({ focusBoard: true });
    playTone(440, 0.09);
  });
});

document.querySelector("#restart-button").addEventListener("click", () => {
  resetGame({ focusBoard: true });
  playTone(392, 0.09);
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Turn sound on");
  if (soundEnabled) playTone(523.25, 0.08);
});

document.querySelector("#play-again").addEventListener("click", () => resetGame({ focusBoard: true }));

document.querySelector("#change-difficulty").addEventListener("click", () => {
  resultModal.hidden = true;
  document.querySelector("[data-difficulty].is-selected")?.focus();
});

document.querySelector("#result-close").addEventListener("click", () => {
  resultModal.hidden = true;
  lastFocusedCard?.focus();
});

resultModal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    resultModal.hidden = true;
    lastFocusedCard?.focus();
  }
});

document.querySelector("[data-difficulty='mystic']").setAttribute("aria-pressed", "true");
document.querySelector("[data-difficulty='easy']").setAttribute("aria-pressed", "false");
document.querySelector("[data-difficulty='mythic']").setAttribute("aria-pressed", "false");

function preloadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = async () => {
      try {
        await image.decode();
        resolve(source);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error(`Could not load ${source}`));
    image.src = source;
  });
}

async function initializeGame() {
  let loadedCount = 0;

  try {
    await Promise.all(
      IMAGE_ASSETS.map(async (source) => {
        await preloadImage(source);
        loadedCount += 1;
        assetLoaderStatus.textContent = `Loaded ${loadedCount} of ${IMAGE_ASSETS.length} illustrations`;
      }),
    );

    resetGame();
    appShell.inert = false;
    appShell.removeAttribute("inert");
    appShell.removeAttribute("aria-hidden");
    document.body.classList.remove("is-loading");
    assetLoader.hidden = true;
  } catch (error) {
    console.error("Mythic Match assets failed to load", error);
    assetLoaderStatus.textContent = "The bestiary could not be opened.";
    assetRetry.hidden = false;
  }
}

assetRetry.addEventListener("click", () => window.location.reload());

initializeGame();
