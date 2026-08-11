export type AiHubDemo = {
  title: string;
  model: string;
  description: string;
  href: string;
};

export type AiHubCollection = {
  id: string;
  sequence: string;
  title: string;
  subtitle: string;
  description: string;
  prompt?: string;
  demos: AiHubDemo[];
};

const blackHolePrompt = `Create a single-page HTML that dynamically demonstrates, in 3D, the most common model of a black hole in outer space. Simulate the motion trajectories of other celestial bodies under its gravitational influence. Add a feature that allows the user to launch an object toward the black hole, showing how the object moves and is affected as it approaches. Simulate gravitational interactions and physical behavior between the black hole and celestial bodies so that users can intuitively observe the dynamic demonstration.

Please follow these principles:
- Begin with a concise checklist (3-7 bullets) of what you will do; only describe conceptual steps.
- After each major technical implementation or interaction design step, briefly verify the result and decide whether to self-correct.
- If you need to import external 3D rendering tools (such as three.js), first give a short explanation of their purpose and necessary parameters.
- If there are insurmountable technical limitations, clearly state them and suggest alternative approaches.`;

const cyberMessengerPrompt = `Use a design style with a strong cyberpunk tech aesthetic to create a front-end single-page HTML website that simulates the interface and functions of a communication app (such as a chat application). Only front-end display and interactions are required, no back-end support.

Before starting, provide a concise checklist (3-7 items) outlining the main subtasks to be completed, then proceed to actually design and implement the page. After completing each step, perform a self-check of the results; if there are issues, immediately fix them before continuing.`;

const fpsPrompt = [
  "You are a senior web game engineer. Build a playable First-Person Shooter (FPS) MVP using Three.js, inspired by the feel of modern military FPS games, but do not use any copyrighted names, characters, maps, or assets. Use only original/simple visuals (solid colors, primitives) and minimal placeholder audio.",
  "",
  "## Core Constraint",
  "",
  "* Deliver everything in ONE single HTML file (including all JavaScript and CSS inside the same file).",
  "* No external assets (no textures/models/sounds). If you need audio, generate simple tones via WebAudio.",
  "* You may load Three.js via CDN import (module) or include it inline if you prefer, but the final deliverable must still be a single HTML file.",
  "",
  "## MVP Goals (Must Be Playable)",
  "",
  "### 1) First-person controls",
  "",
  "* Pointer Lock mouse look (yaw/pitch with pitch clamp)",
  "* WASD movement, Shift sprint, Space jump",
  "* Gravity + ground detection",
  "* Basic collision (player capsule/box vs level boxes/AABBs; no heavy physics engine)",
  "* Sprint FOV kick (slight FOV increase while sprinting)",
  "",
  "### 2) Weapon + shooting",
  "",
  "* Left-click shoots (semi-auto is fine; optional full-auto)",
  "* Hitscan using Raycaster",
  "* Recoil (small camera kick + weapon sway/bob)",
  "* Minimal muzzle flash (sprite/particle) + hit spark + simple bullet hole mark (can be simplified)",
  "* Ammo system: magazine + reserve ammo, R to reload (reload time, simple tween-based animation)",
  "* HUD: crosshair, ammo, health",
  "",
  "### 3) Enemy AI (minimum fun)",
  "",
  "* Spawn 5–10 enemies (capsules/boxes)",
  "* Simple finite state machine: Patrol → Chase → Attack → Dead",
  "* Vision/range detection",
  "* Enemies can shoot back (hitscan or simple projectiles)",
  "* Damage + death feedback (color flash, shrink/fall, etc.)",
  "",
  "### 4) Level + interaction",
  "",
  "* Small training arena built from primitives: floor, walls, cover boxes, ramps/platforms",
  "* Collision & bounds (no walking through walls; no falling out of the world)",
  "* Optional: pickups (health/ammo)",
  "",
  "### 5) Systems & quality",
  "",
  "* Target 60 FPS: keep it lightweight (limit shadows, simple geometry, reuse objects)",
  "* Centralized tunables (player speed, recoil, AI vision, etc.)",
  "* Restart/reset flow (if player dies or falls out of bounds, press a key to reset)",
  "",
  "## Architecture Requirement (within one HTML)",
  "",
  "Even though it is a single HTML file, structure the code clearly using sections/classes:",
  "",
  "* Config (tunable constants)",
  "* Core (renderer, scene, main loop, timing)",
  "* World (level builder, collision shapes)",
  "* Player (controller, camera, movement, collision)",
  "* Weapons (ammo, recoil, fire logic, FX)",
  "* AI (enemy entity + FSM)",
  "* UI (HUD update)",
  "  Keep functions small and readable; avoid a monolithic 1000-line function.",
  "",
  "## Deliverables",
  "",
  "1. A single runnable HTML file (copy/paste into index.html and open).",
  "2. At the top of the HTML, include a short README comment:",
  "",
  "   * How to run",
  "   * Key bindings",
  "   * Feature checklist",
  "3. Implement in phases in your output (but still culminating in one final HTML):",
  "",
  "   * Phase 1: scene + pointer lock + movement",
  "   * Phase 2: gravity + jump + collision",
  "   * Phase 3: weapon + shooting + HUD",
  "   * Phase 4: enemy AI + damage/death",
  "   * Phase 5: polish (sprint FOV, recoil feel, FX, reset)",
  "",
  "## Acceptance Criteria (Must Pass All)",
  "",
  "* Mouse locks and look works; WASD moves; Shift sprints; Space jumps",
  "* Left click shoots and damages enemies; enemies chase and attack back",
  "* HUD shows crosshair/ammo/health; R reload works",
  "* Player cannot pass through walls/boxes; falling out triggers reset or respawn",
  "",
  "## Output Format",
  "",
  "* Output ONLY the final single HTML in one code block.",
  "* No TODOs that prevent running.",
  "* Ensure it runs in a modern browser without additional build steps.",
].join("\n");

export const aiHubCollections: AiHubCollection[] = [
  {
    id: "signup",
    sequence: "01",
    title: "Sign-up Flow",
    subtitle: "Product UI",
    description: "同一個註冊任務，觀察六種模型如何安排層級、欄位與品牌感。",
    demos: [
      demo("ChatGPT", "產品註冊介面", "/showcase/signuptest/chatgpt.html"),
      demo("Claude", "產品註冊介面", "/showcase/signuptest/claude.html"),
      demo("Gemini", "產品註冊介面", "/showcase/signuptest/gemini.html"),
      demo("Grok", "產品註冊介面", "/showcase/signuptest/grok.html"),
      demo("DeepSeek", "產品註冊介面", "/showcase/signuptest/deepseek.html"),
      demo("Qwen", "產品註冊介面", "/showcase/signuptest/qwen.html"),
    ],
  },
  {
    id: "solar-system",
    sequence: "02",
    title: "Solar System",
    subtitle: "Motion & Space",
    description: "從軌道、比例到操作方式，比較模型如何把太陽系變成可探索的單頁體驗。",
    prompt:
      "請使用 HTML 前端技術，製作一個模擬太陽系的網頁，相關程式請集中在一個 html 檔案內",
    demos: [
      demo("ChatGPT", "太陽系互動示範", "/showcase/solarsystem/chatgpt.html"),
      demo("Claude", "太陽系互動示範", "/showcase/solarsystem/claude.html"),
      demo("Gemini", "太陽系互動示範", "/showcase/solarsystem/gemini.html"),
      demo("Gemini 3", "太陽系互動示範", "/showcase/solarsystem/gemini3.html"),
      demo("Grok", "太陽系互動示範", "/showcase/solarsystem/grok.html"),
      demo("DeepSeek", "太陽系互動示範", "/showcase/solarsystem/deepseek.html"),
      demo("Qwen", "太陽系互動示範", "/showcase/solarsystem/qwen.html"),
    ],
  },
  {
    id: "earth-moon",
    sequence: "03",
    title: "Earth & Moon",
    subtitle: "3D Simulation",
    description: "用相同的地月系統題目，對照光影、相機、軌道與資訊呈現的差異。",
    prompt:
      "製作一個單頁式的HTML，內容是模擬地球與月球運行的系統，要使用前端的3D技術來製作",
    demos: [
      demo("ChatGPT", "地月系統 3D 模擬", "/showcase/earthmoonsystem/chatgpt.html"),
      demo("Claude", "地月系統 3D 模擬", "/showcase/earthmoonsystem/claude.html"),
      demo("Gemini", "地月系統 3D 模擬", "/showcase/earthmoonsystem/gemini.html"),
      demo("Gemini 3", "地月系統 3D 模擬", "/showcase/earthmoonsystem/gemini3.html"),
      demo("Grok", "地月系統 3D 模擬", "/showcase/earthmoonsystem/grok.html"),
    ],
  },
  {
    id: "black-hole",
    sequence: "04",
    title: "Black Hole",
    subtitle: "Physics Playground",
    description: "黑洞、吸積盤與重力軌跡，看看不同模型如何處理複雜題材與即時互動。",
    prompt: blackHolePrompt,
    demos: [
      demo("ChatGPT", "黑洞 3D 模擬", "/showcase/blackhole/chatgpt.html"),
      demo("Claude", "黑洞 3D 模擬", "/showcase/blackhole/claude.html"),
      demo("Gemini", "黑洞 3D 模擬", "/showcase/blackhole/gemini.html"),
      demo("Gemini 3", "黑洞 3D 模擬", "/showcase/blackhole/gemini3.html"),
      demo("Grok", "黑洞 3D 模擬", "/showcase/blackhole/grok.html"),
    ],
  },
  {
    id: "cyber-messenger",
    sequence: "05",
    title: "Cyber Messenger",
    subtitle: "Interface Study",
    description: "從訊息密度到微互動，四個模型各自詮釋一個賽博通訊工具。",
    prompt: cyberMessengerPrompt,
    demos: [
      demo("ChatGPT", "賽博通訊介面", "/showcase/cybermessager/chatgpt.html"),
      demo("Claude", "賽博通訊介面", "/showcase/cybermessager/claude.html"),
      demo("Gemini", "賽博通訊介面", "/showcase/cybermessager/gemini.html"),
      demo("Gemini 3", "賽博通訊介面", "/showcase/cybermessager/gemini3.html"),
    ],
  },
  {
    id: "fps-lab",
    sequence: "06",
    title: "FPS Lab",
    subtitle: "Playable Systems",
    description: "同一份 FPS MVP 規格，對比移動、射擊、敵人 AI 與整體遊戲手感。",
    prompt: fpsPrompt,
    demos: [
      demo("GPT-5.4", "FPS MVP", "/showcase/cod2/"),
      demo("GPT-5.3 Codex", "FPS MVP", "/showcase/callofduty/codex53.html"),
      demo("Claude Opus 4.6", "FPS MVP", "/showcase/callofduty/opus46.html"),
      demo("Gemini 3", "FPS MVP", "/showcase/callofduty/gemini3.html"),
    ],
  },
  {
    id: "room",
    sequence: "07",
    title: "The Room",
    subtitle: "Spatial Experiment",
    description: "一個可即時探索的 Three.js 室內空間，作為 AI 輔助 3D 製作的完整案例。",
    demos: [
      demo("Three.js Build", "互動式 3D 室內空間", "/showcase/room/"),
    ],
  },
];

export const aiHubDemoCount = aiHubCollections.reduce(
  (total, collection) => total + collection.demos.length,
  0,
);

function demo(model: string, description: string, href: string): AiHubDemo {
  return {
    title: model,
    model,
    description,
    href,
  };
}
