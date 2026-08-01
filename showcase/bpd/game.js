import { LEVELS, TILE } from "./levels.js";

const boardElement = document.querySelector("#board");
const roomNumberElement = document.querySelector("#room-number");
const roomDotsElement = document.querySelector("#room-dots");
const roomNameElement = document.querySelector("#room-name");
const movesElement = document.querySelector("#moves");
const doorStatusElement = document.querySelector("#door-status");
const sigilStatusElement = document.querySelector("#sigil-status");
const keyIconElement = document.querySelector("#key-icon");
const keyStatusElement = document.querySelector("#key-status");
const objectiveElement = document.querySelector("#objective-text");
const resetButton = document.querySelector("#reset-button");
const undoButton = document.querySelector("#undo-button");
const completionModal = document.querySelector("#completion-modal");
const playAgainButton = document.querySelector("#play-again-button");
const announcementElement = document.querySelector("#announcement");

const DIRECTIONS = Object.freeze({
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
});

const SPRITES = Object.freeze({
  player: "./assets/sprites/explorer.webp",
  block: "./assets/sprites/block.webp",
  sigil: "./assets/sprites/sigil.webp",
  key: "./assets/sprites/key.webp",
  trap: "./assets/sprites/trap.webp",
  closedDoor: "./assets/sprites/door-closed.webp",
  openDoor: "./assets/sprites/door-open.webp",
  resetStone: "./assets/sprites/reset-stone.webp",
});

let roomIndex = 0;
let state;
let history = [];
let transitionTimer;
let isTransitioning = false;
let pointerStart;

function positionKey(x, y) {
  return `${x},${y}`;
}

function makeState(level) {
  const nextState = {
    rows: level.map.length,
    columns: level.map[0].length,
    walls: new Set(),
    sigils: new Set(),
    traps: new Set(),
    resetStones: new Set(),
    blocks: new Set(),
    player: null,
    playerStart: null,
    keyPosition: null,
    door: null,
    hasKey: false,
    keyRequired: false,
    moves: 0,
    facing: "down",
  };

  level.map.forEach((row, y) => {
    [...row].forEach((tile, x) => {
      const key = positionKey(x, y);

      if (tile === TILE.WALL) nextState.walls.add(key);
      if (tile === TILE.SIGIL) nextState.sigils.add(key);
      if (tile === TILE.TRAP) nextState.traps.add(key);
      if (tile === TILE.RESET) nextState.resetStones.add(key);
      if (tile === TILE.BLOCK) nextState.blocks.add(key);
      if (tile === TILE.DOOR) nextState.door = { x, y };
      if (tile === TILE.KEY) {
        nextState.keyPosition = { x, y };
        nextState.keyRequired = true;
      }
      if (tile === TILE.PLAYER) {
        nextState.player = { x, y };
        nextState.playerStart = { x, y };
      }
    });
  });

  return nextState;
}

function cloneState(source) {
  return {
    ...source,
    walls: new Set(source.walls),
    sigils: new Set(source.sigils),
    traps: new Set(source.traps),
    resetStones: new Set(source.resetStones),
    blocks: new Set(source.blocks),
    player: { ...source.player },
    playerStart: { ...source.playerStart },
    keyPosition: source.keyPosition ? { ...source.keyPosition } : null,
    door: { ...source.door },
  };
}

function isDoorOpen(candidate = state) {
  const everySigilAwake = [...candidate.sigils].every((key) => candidate.blocks.has(key));
  return everySigilAwake && (!candidate.keyRequired || candidate.hasKey);
}

function createSprite(type, extraClass = "") {
  const image = document.createElement("img");
  image.className = `game-sprite ${type} ${extraClass}`.trim();
  image.src = SPRITES[type];
  image.alt = "";
  image.draggable = false;
  return image;
}

function tileLabel(x, y) {
  const key = positionKey(x, y);
  const labels = [];

  if (state.walls.has(key)) return "Stone wall";
  if (state.sigils.has(key)) labels.push("magic sigil");
  if (state.traps.has(key)) labels.push("spike trap");
  if (state.resetStones.has(key)) labels.push("recall stone");
  if (state.keyPosition?.x === x && state.keyPosition?.y === y) labels.push("brass key");
  if (state.door.x === x && state.door.y === y) labels.push(isDoorOpen() ? "open door" : "sealed door");
  if (state.blocks.has(key)) labels.push(state.sigils.has(key) ? "block on sigil" : "stone block");
  if (state.player.x === x && state.player.y === y) labels.push("player");

  return labels.length ? labels.join(", ") : "Stone floor";
}

function renderBoard() {
  const fragment = document.createDocumentFragment();
  boardElement.style.setProperty("--columns", state.columns);
  boardElement.style.setProperty("--rows", state.rows);
  boardElement.setAttribute("aria-rowcount", String(state.rows));
  boardElement.setAttribute("aria-colcount", String(state.columns));

  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.columns; x += 1) {
      const key = positionKey(x, y);
      const tile = document.createElement("div");
      tile.className = state.walls.has(key) ? "tile wall" : "tile floor";
      tile.setAttribute("role", "gridcell");
      tile.setAttribute("aria-label", tileLabel(x, y));
      tile.style.setProperty("--tile-x", x);
      tile.style.setProperty("--tile-y", y);

      if (!state.walls.has(key)) {
        if (state.sigils.has(key)) tile.append(createSprite("sigil", "floor-object"));
        if (state.traps.has(key)) tile.append(createSprite("trap", "floor-object"));
        if (state.resetStones.has(key)) {
          const recallButton = document.createElement("button");
          recallButton.type = "button";
          recallButton.className = "recall-button";
          recallButton.setAttribute("aria-label", "Reset this room with the recall stone");
          recallButton.append(createSprite("resetStone", "floor-object"));
          recallButton.addEventListener("click", () => resetRoom("The recall stone restores the room."));
          tile.append(recallButton);
        }
        if (state.keyPosition?.x === x && state.keyPosition?.y === y) {
          tile.append(createSprite("key", "collectible"));
        }
        if (state.door.x === x && state.door.y === y) {
          tile.classList.add("door-tile", isDoorOpen() ? "door-open" : "door-closed");
          tile.append(createSprite(isDoorOpen() ? "openDoor" : "closedDoor", "door-sprite"));
        }
        if (state.blocks.has(key)) {
          tile.append(createSprite("block", state.sigils.has(key) ? "block-on-sigil" : ""));
        }
        if (state.player.x === x && state.player.y === y) {
          tile.append(createSprite("player", `facing-${state.facing}`));
        }
      }

      fragment.append(tile);
    }
  }

  boardElement.replaceChildren(fragment);
}

function renderProgress() {
  roomNumberElement.textContent = String(roomIndex + 1);
  roomNameElement.textContent = LEVELS[roomIndex].name;
  roomDotsElement.replaceChildren();

  LEVELS.forEach((_, index) => {
    const item = document.createElement("li");
    item.textContent = String(index + 1);
    if (index < roomIndex) item.className = "complete";
    if (index === roomIndex) item.className = "current";
    item.setAttribute("aria-label", `Room ${index + 1}${index < roomIndex ? ", complete" : index === roomIndex ? ", current" : ""}`);
    roomDotsElement.append(item);
  });
}

function renderHud() {
  const awakeSigils = [...state.sigils].filter((key) => state.blocks.has(key)).length;
  const open = isDoorOpen();

  movesElement.textContent = String(state.moves).padStart(3, "0");
  sigilStatusElement.textContent = `${awakeSigils} / ${state.sigils.size} SIGILS`;
  doorStatusElement.textContent = open ? "DOOR OPEN" : "DOOR SEALED";
  doorStatusElement.classList.toggle("is-open", open);

  if (!state.keyRequired) {
    keyStatusElement.textContent = "NO KEY REQUIRED";
    keyIconElement.classList.add("not-required");
  } else if (state.hasKey) {
    keyStatusElement.textContent = "KEY ACQUIRED";
    keyIconElement.classList.remove("not-required");
  } else {
    keyStatusElement.textContent = "FIND THE KEY";
    keyIconElement.classList.remove("not-required");
  }

  objectiveElement.textContent = open ? "Enter the awakened door" : "Awaken every sigil";
  undoButton.disabled = history.length === 0 || isTransitioning;
}

function render() {
  renderBoard();
  renderProgress();
  renderHud();
}

function announce(message) {
  announcementElement.textContent = "";
  window.requestAnimationFrame(() => {
    announcementElement.textContent = message;
  });
}

function flashBoard(className) {
  boardElement.classList.remove(className);
  window.requestAnimationFrame(() => {
    boardElement.classList.add(className);
    window.setTimeout(() => boardElement.classList.remove(className), 360);
  });
}

function isBlockedForPlayer(x, y) {
  if (x < 0 || y < 0 || x >= state.columns || y >= state.rows) return true;
  const key = positionKey(x, y);
  if (state.walls.has(key)) return true;
  return state.door.x === x && state.door.y === y && !isDoorOpen();
}

function isBlockedForBlock(x, y) {
  if (x < 0 || y < 0 || x >= state.columns || y >= state.rows) return true;
  const key = positionKey(x, y);
  return (
    state.walls.has(key) ||
    state.blocks.has(key) ||
    state.traps.has(key) ||
    state.resetStones.has(key) ||
    (state.door.x === x && state.door.y === y)
  );
}

function completeRoom() {
  isTransitioning = true;
  announce(roomIndex === LEVELS.length - 1 ? "All five rooms are complete." : `Room ${roomIndex + 1} complete.`);
  boardElement.classList.add("room-complete");

  transitionTimer = window.setTimeout(() => {
    if (roomIndex === LEVELS.length - 1) {
      completionModal.hidden = false;
      playAgainButton.focus();
      isTransitioning = false;
      return;
    }

    roomIndex += 1;
    loadRoom(roomIndex);
    boardElement.focus({ preventScroll: true });
  }, 650);
}

function move(directionName) {
  if (isTransitioning || completionModal.hidden === false) return false;

  const direction = DIRECTIONS[directionName];
  if (!direction) return false;
  state.facing = directionName;

  const target = {
    x: state.player.x + direction.x,
    y: state.player.y + direction.y,
  };
  const targetKey = positionKey(target.x, target.y);

  if (isBlockedForPlayer(target.x, target.y)) {
    flashBoard("bump");
    renderBoard();
    return false;
  }

  const snapshot = cloneState(state);
  const blockAtTarget = state.blocks.has(targetKey);

  if (blockAtTarget) {
    const beyond = {
      x: target.x + direction.x,
      y: target.y + direction.y,
    };

    if (isBlockedForBlock(beyond.x, beyond.y)) {
      flashBoard("bump");
      renderBoard();
      return false;
    }

    state.blocks.delete(targetKey);
    state.blocks.add(positionKey(beyond.x, beyond.y));
  }

  history.push(snapshot);
  state.player = target;
  state.moves += 1;

  if (state.keyPosition?.x === target.x && state.keyPosition?.y === target.y) {
    state.keyPosition = null;
    state.hasKey = true;
    announce("Brass key acquired.");
  }

  render();

  if (state.traps.has(targetKey)) {
    isTransitioning = true;
    flashBoard("trap-triggered");
    announce("The spike trap recalls you to the room entrance.");
    transitionTimer = window.setTimeout(() => resetRoom("The room has been restored."), 520);
    return true;
  }

  if (state.resetStones.has(targetKey)) {
    isTransitioning = true;
    announce("The recall stone restores the room.");
    transitionTimer = window.setTimeout(() => resetRoom("The room has been restored."), 420);
    return true;
  }

  if (state.door.x === target.x && state.door.y === target.y && isDoorOpen()) {
    completeRoom();
  }

  return true;
}

function resetRoom(message = "Room reset.") {
  window.clearTimeout(transitionTimer);
  isTransitioning = false;
  state = makeState(LEVELS[roomIndex]);
  history = [];
  boardElement.classList.remove("room-complete", "trap-triggered", "bump");
  render();
  announce(message);
}

function undo() {
  if (isTransitioning || history.length === 0) return;
  window.clearTimeout(transitionTimer);
  state = history.pop();
  render();
  announce("Last move undone.");
}

function loadRoom(index) {
  window.clearTimeout(transitionTimer);
  roomIndex = index;
  state = makeState(LEVELS[roomIndex]);
  history = [];
  isTransitioning = false;
  boardElement.classList.remove("room-complete", "trap-triggered", "bump");
  render();
  announce(`${LEVELS[roomIndex].name}. ${LEVELS[roomIndex].hint}`);
}

function handleKeyboard(event) {
  const directionByKey = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (directionByKey[event.key]) {
    event.preventDefault();
    move(directionByKey[event.key]);
  }

  if (event.key === "r" || event.key === "R") {
    event.preventDefault();
    resetRoom();
  }

  if ((event.key === "z" || event.key === "Z") && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    undo();
  }
}

document.addEventListener("keydown", handleKeyboard);
document.querySelectorAll("[data-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    move(button.dataset.direction);
    boardElement.focus({ preventScroll: true });
  });
});

resetButton.addEventListener("click", () => {
  resetRoom();
  boardElement.focus({ preventScroll: true });
});

undoButton.addEventListener("click", () => {
  undo();
  boardElement.focus({ preventScroll: true });
});

playAgainButton.addEventListener("click", () => {
  completionModal.hidden = true;
  loadRoom(0);
  boardElement.focus({ preventScroll: true });
});

boardElement.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY };
});

boardElement.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const deltaX = event.clientX - pointerStart.x;
  const deltaY = event.clientY - pointerStart.y;
  pointerStart = null;

  if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
  move(Math.abs(deltaX) > Math.abs(deltaY) ? (deltaX > 0 ? "right" : "left") : deltaY > 0 ? "down" : "up");
});

window.SigilKeep = Object.freeze({
  move,
  resetRoom,
  undo,
  getState: () => ({ roomIndex, isDoorOpen: isDoorOpen(), state: cloneState(state) }),
});

loadRoom(0);
