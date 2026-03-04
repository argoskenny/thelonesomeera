export type AiHubCard = {
  title: string;
  description: string;
  tags: string[];
  link: string;
};

export type AiHubSection = {
  key:
    | "signuptest"
    | "solarsystem"
    | "earthmoonsystem"
    | "blackhole"
    | "cybermessager"
    | "callofduty";
  label: string;
  title: string;
  subtitle: string;
  prompt?: string;
  cards: AiHubCard[];
};

const callOfDutyPrompt = [
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

export const aiHubSections: AiHubSection[] = [
  {
    key: "signuptest",
    label: "SignUp Test",
    title: "SignUp Test",
    subtitle: "LLM Provider Demo Pages",
    cards: [
      {
        title: "Signup Test - ChatGPT",
        description: "模型互動測試頁（ChatGPT）",
        tags: ["LLM", "ChatGPT", "Signup"],
        link: "/signuptest/chatgpt.html",
      },
      {
        title: "Signup Test - Claude",
        description: "模型互動測試頁（Claude）",
        tags: ["LLM", "Claude", "Signup"],
        link: "/signuptest/claude.html",
      },
      {
        title: "Signup Test - Gemini",
        description: "模型互動測試頁（Gemini）",
        tags: ["LLM", "Gemini", "Signup"],
        link: "/signuptest/gemini.html",
      },
      {
        title: "Signup Test - Grok",
        description: "模型互動測試頁（Grok）",
        tags: ["LLM", "Grok", "Signup"],
        link: "/signuptest/grok.html",
      },
      {
        title: "Signup Test - DeepSeek",
        description: "模型互動測試頁（DeepSeek）",
        tags: ["LLM", "DeepSeek", "Signup"],
        link: "/signuptest/deepseek.html",
      },
      {
        title: "Signup Test - Qwen",
        description: "模型互動測試頁（Qwen）",
        tags: ["LLM", "Qwen", "Signup"],
        link: "/signuptest/qwen.html",
      },
    ],
  },
  {
    key: "solarsystem",
    label: "Solar System Test",
    title: "Solar System Test",
    subtitle: "LLM Themed Demos",
    prompt:
      "請使用 HTML 前端技術，製作一個模擬太陽系的網頁，相關程式請集中在一個 html 檔案內",
    cards: [
      {
        title: "Solar System - ChatGPT",
        description: "太陽系主題互動示範（ChatGPT）",
        tags: ["LLM", "ChatGPT", "SolarSystem"],
        link: "/solarsystem/chatgpt.html",
      },
      {
        title: "Solar System - Claude",
        description: "太陽系主題互動示範（Claude）",
        tags: ["LLM", "Claude", "SolarSystem"],
        link: "/solarsystem/claude.html",
      },
      {
        title: "Solar System - Gemini",
        description: "太陽系主題互動示範（Gemini）",
        tags: ["LLM", "Gemini", "SolarSystem"],
        link: "/solarsystem/gemini.html",
      },
      {
        title: "Solar System - Gemini 3",
        description: "太陽系主題互動示範（Gemini 3）",
        tags: ["LLM", "Gemini", "SolarSystem"],
        link: "/solarsystem/gemini3.html",
      },
      {
        title: "Solar System - Grok",
        description: "太陽系主題互動示範（Grok）",
        tags: ["LLM", "Grok", "SolarSystem"],
        link: "/solarsystem/grok.html",
      },
      {
        title: "Solar System - DeepSeek",
        description: "太陽系主題互動示範（DeepSeek）",
        tags: ["LLM", "DeepSeek", "SolarSystem"],
        link: "/solarsystem/deepseek.html",
      },
      {
        title: "Solar System - Qwen",
        description: "太陽系主題互動示範（Qwen）",
        tags: ["LLM", "Qwen", "SolarSystem"],
        link: "/solarsystem/qwen.html",
      },
    ],
  },
  {
    key: "earthmoonsystem",
    label: "Earth-Moon System Test",
    title: "Earth-Moon System Test",
    subtitle: "3D Simulation Demos",
    prompt:
      "製作一個單頁式的HTML，內容是模擬地球與月球運行的系統，要使用前端的3D技術來製作",
    cards: [
      {
        title: "Earth-Moon System - ChatGPT",
        description: "地月系統 3D 模擬（ChatGPT）",
        tags: ["LLM", "ChatGPT", "3D"],
        link: "/earthmoonsystem/chatgpt.html",
      },
      {
        title: "Earth-Moon System - Claude",
        description: "地月系統 3D 模擬（Claude）",
        tags: ["LLM", "Claude", "3D"],
        link: "/earthmoonsystem/claude.html",
      },
      {
        title: "Earth-Moon System - Gemini",
        description: "地月系統 3D 模擬（Gemini）",
        tags: ["LLM", "Gemini", "3D"],
        link: "/earthmoonsystem/gemini.html",
      },
      {
        title: "Earth-Moon System - Gemini 3",
        description: "地月系統 3D 模擬（Gemini 3）",
        tags: ["LLM", "Gemini", "3D"],
        link: "/earthmoonsystem/gemini3.html",
      },
      {
        title: "Earth-Moon System - Grok",
        description: "地月系統 3D 模擬（Grok）",
        tags: ["LLM", "Grok", "3D"],
        link: "/earthmoonsystem/grok.html",
      },
    ],
  },
  {
    key: "blackhole",
    label: "Black Hole Test",
    title: "Black Hole Test",
    subtitle: "3D Black Hole Simulation Demos",
    prompt: `Create a single-page HTML that dynamically demonstrates, in 3D, the most common model of a black hole in outer space. Simulate the motion trajectories of other celestial bodies under its gravitational influence. Add a feature that allows the user to launch an object toward the black hole, showing how the object moves and is affected as it approaches. Simulate gravitational interactions and physical behavior between the black hole and celestial bodies so that users can intuitively observe the dynamic demonstration.

Please follow these principles:
- Begin with a concise checklist (3-7 bullets) of what you will do; only describe conceptual steps.
- After each major technical implementation or interaction design step, briefly verify the result and decide whether to self-correct.
- If you need to import external 3D rendering tools (such as three.js), first give a short explanation of their purpose and necessary parameters.
- If there are insurmountable technical limitations, clearly state them and suggest alternative approaches.`,
    cards: [
      {
        title: "Black Hole - ChatGPT",
        description: "黑洞 3D 模擬（ChatGPT）",
        tags: ["LLM", "ChatGPT", "3D"],
        link: "/blackhole/chatgpt.html",
      },
      {
        title: "Black Hole - Claude",
        description: "黑洞 3D 模擬（Claude）",
        tags: ["LLM", "Claude", "3D"],
        link: "/blackhole/claude.html",
      },
      {
        title: "Black Hole - Gemini",
        description: "黑洞 3D 模擬（Gemini）",
        tags: ["LLM", "Gemini", "3D"],
        link: "/blackhole/gemini.html",
      },
      {
        title: "Black Hole - Gemini 3",
        description: "黑洞 3D 模擬（Gemini 3）",
        tags: ["LLM", "Gemini", "3D"],
        link: "/blackhole/gemini3.html",
      },
      {
        title: "Black Hole - Grok",
        description: "黑洞 3D 模擬（Grok）",
        tags: ["LLM", "Grok", "3D"],
        link: "/blackhole/grok.html",
      },
    ],
  },
  {
    key: "cybermessager",
    label: "Cyber Messager Test",
    title: "Cyber Messager Test",
    subtitle: "Cyberpunk Communication App Demos",
    prompt: `Use a design style with a strong cyberpunk tech aesthetic to create a front-end single-page HTML website that simulates the interface and functions of a communication app (such as a chat application). Only front-end display and interactions are required, no back-end support.

Before starting, provide a concise checklist (3-7 items) outlining the main subtasks to be completed, then proceed to actually design and implement the page. After completing each step, perform a self-check of the results; if there are issues, immediately fix them before continuing.`,
    cards: [
      {
        title: "Cyber Messager - ChatGPT",
        description: "賽博朋克通訊應用（ChatGPT）",
        tags: ["LLM", "ChatGPT", "UI/UX"],
        link: "/cybermessager/chatgpt.html",
      },
      {
        title: "Cyber Messager - Claude",
        description: "賽博朋克通訊應用（Claude）",
        tags: ["LLM", "Claude", "UI/UX"],
        link: "/cybermessager/claude.html",
      },
      {
        title: "Cyber Messager - Gemini",
        description: "賽博朋克通訊應用（Gemini）",
        tags: ["LLM", "Gemini", "UI/UX"],
        link: "/cybermessager/gemini.html",
      },
      {
        title: "Cyber Messager - Gemini 3",
        description: "賽博朋克通訊應用（Gemini 3）",
        tags: ["LLM", "Gemini", "UI/UX"],
        link: "/cybermessager/gemini3.html",
      },
      {
        title: "Cyber Messager - Grok",
        description: "賽博朋克通訊應用（Grok）- 空檔案",
        tags: ["LLM", "Grok", "UI/UX"],
        link: "/cybermessager/grok.html",
      },
    ],
  },
  {
    key: "callofduty",
    label: "Call Of Duty Game Test",
    title: "Call Of Duty Game Test",
    subtitle: "FPS MVP Prompt Testing",
    prompt: callOfDutyPrompt,
    cards: [
      {
        title: "GPT-5.3-Codex",
        description: "FPS MVP 測試頁（GPT-5.3-Codex）",
        tags: ["LLM", "GPT-5.3-Codex", "FPS"],
        link: "/callofduty/codex53.html",
      },
      {
        title: "Claude Opus 4.6",
        description: "FPS MVP 測試頁（Claude Opus 4.6）",
        tags: ["LLM", "Claude Opus 4.6", "FPS"],
        link: "/callofduty/opus46.html",
      },
      {
        title: "Gemini 3",
        description: "FPS MVP 測試頁（Gemini 3）",
        tags: ["LLM", "Gemini 3", "FPS"],
        link: "/callofduty/gemini3.html",
      },
    ],
  },
];
