import "@fontsource/barlow-condensed/latin-800.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/instrument-serif/latin-400-italic.css";
import "@fontsource/instrument-serif/latin-400.css";
import "./style.css";
import { arrow, mark } from "./icons";
import { initMotion } from "./motion";
import { initSound } from "./sound";

const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const species = [
  {
    name: "Choreography",
    tags: "GSAP / SCROLL / MOTION",
    text: "Thoughtful motion that guides, reveals and connects. Because interaction is a language.",
    detail:
      "Timelines bring order to movement. Easing gives it character. Scroll connects the story to your hand. Every reveal, pause and microinteraction has a purpose.",
  },
  {
    name: "Living systems",
    tags: "CANVAS / SVG / TYPESCRIPT",
    text: "A few simple rules. An unexpected world of possibilities.",
    detail:
      "Creative coding turns logic into living patterns. Canvas draws, SVG scales, and TypeScript connects the system. React and Vue can give these experiments a home; Web Audio gives them a voice.",
  },
  {
    name: "New dimensions",
    tags: "THREE.JS / WEBGL / SHADERS",
    text: "Beyond the flat screen. Into something you can feel.",
    detail:
      "Three.js shapes worlds in three dimensions. WebGL and shaders paint with the GPU. WebGPU opens new territory for rendering and computation. In the lab above, a custom shader breathes life into procedural geometry.",
  },
];

const label = (left: string, right: string) =>
  `<div class="section-label"><span>${left}</span><span>${right}</span></div>`;

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<a class="skip-link" href="#ecosystem">Skip to the ecosystem</a>
<div class="reading-progress" aria-hidden="true"></div>
<header class="site-header">
  <a class="brand" href="#surface" aria-label="UNTAMED home">${mark}<span>UNTAMED</span></a>
  <nav aria-label="Main navigation"><a href="#ecosystem">The ecosystem</a><a href="#field-notes">Field notes</a></nav>
  <button class="sound-toggle" type="button" aria-pressed="false"><span>Sound off</span><i class="sound-bars" aria-hidden="true"><b></b><b></b><b></b><b></b><b></b></i></button>
</header>
<main>
  <div class="hero-journey" id="surface">
  <section class="hero" aria-labelledby="hero-title">
    <div class="hero-scene"><div class="jungle-backdrop" aria-hidden="true"></div><img class="hero-image" src="${asset("images/jungle.webp")}" width="1536" height="1024" alt="Sunlight filtering through a dense tropical rainforest and a distant waterfall" fetchpriority="high" /></div>
    <div class="jungle-foreground" aria-hidden="true"></div>
    <div class="jungle-threshold" aria-hidden="true"></div>
    <div class="hero-content">
      <h1 id="hero-title"><span class="title-line"><span>CREATIVE</span></span><span class="title-line"><span>DEVELOPMENT</span></span></h1>
      <div class="hero-subline"><span class="independent"><i></i>Independent minds. Infinite possibilities.</span><p class="hero-script">in its wildest form.</p></div>
    </div>
    <div class="hero-bottom"><p>A living exploration of<br class="mobile-break" /> design, code &amp; motion.</p><a class="explore-link" href="#ecosystem"><span class="circle-arrow">${arrow}</span><span>ENTER THE ECOSYSTEM</span></a></div>
    <a class="scroll-cue" href="#ecosystem">SCROLL TO EXPLORE<span></span></a>
  </section>
  </div>
  <section class="ecosystem paper" id="ecosystem" aria-labelledby="ecosystem-title">
    ${label("01 / THE ECOSYSTEM", "WHERE DISCIPLINES COLLIDE")}
    <div class="manifesto-grid">
      <div class="manifesto-copy"><h2 id="ecosystem-title" class="reveal">Nothing great<br />grows in a<br /><em>straight line.</em></h2><p class="manifesto-intro reveal">Between design and technology, something wild takes root. We turn ideas into experiences you can feel.</p>
        <div class="discipline-map" aria-label="Design, code, motion, storytelling and technology are connected">
          <svg viewBox="0 0 420 190" aria-hidden="true"><g stroke="currentColor" stroke-width=".7"><path d="M210 100V30M210 100L82 62M210 100L338 62M210 100L118 167M210 100L302 167"/></g><circle cx="210" cy="100" r="8" fill="#c46736" stroke="none"/></svg>
          <span class="discipline d1">CODE<small>GROW POSSIBILITIES</small></span><span class="discipline d2">DESIGN<small>SHAPE WORLDS</small></span><span class="discipline d3">TECHNOLOGY<small>GO BEYOND</small></span><span class="discipline d4">MOTION<small>BRING TO LIFE</small></span><span class="discipline d5">STORYTELLING<small>MAKE IT MATTER</small></span>
        </div>
      </div>
      <figure class="fern-photo reveal"><div class="image-window"><img src="${asset("images/fern.webp")}" alt="Dew-covered fern unfurling into a spiral" width="1122" height="1402" loading="lazy" /></div><figcaption><span>IDEAS TAKE ROOT HERE.</span><span>FIG. 01 — NATURALLY UNPREDICTABLE</span></figcaption></figure>
    </div>
    <div class="kinetic" aria-label="Design times code times motion"><div class="kinetic-track" aria-hidden="true"><span>DESIGN</span><i>×</i><span>CODE</span><i>×</i><span>MOTION</span><i>×</i><span>IMAGINATION</span></div></div>
    <div class="kinetic-caption mono"><span>MOVE THROUGH THE WORDS. FEEL THE MOMENTUM.</span><span>ORDER MEETS INSTINCT.</span></div>
  </section>
  <section class="lab" id="living-lab" aria-labelledby="lab-title">
    ${label("02 / THE LIVING LAB", "CODE, MEET NATURE.")}
    <div class="lab-layout">
      <div class="lab-copy"><h2 id="lab-title" class="reveal">A little logic.<br /><em>A lot of life.</em></h2><p class="lab-intro">An organism born from mathematics.<br />Shaped by you.</p>
        <div class="lab-controls">
          <div class="mode-tabs" role="tablist" aria-label="Organism mode">${["Growth", "Flow", "Spores"].map((name, i) => `<button type="button" id="mode-${i}" role="tab" aria-controls="organism-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? "0" : "-1"}" data-mode="${i}"><span>0${i + 1}</span> ${name}</button>`).join("")}</div>
          <div class="range-control"><label for="energy">ENERGY <output for="energy" id="energy-output">0.65</output></label><input id="energy" type="range" min="0" max="100" value="65" /></div>
          <div class="range-control"><label for="complexity">COMPLEXITY <output for="complexity" id="complexity-output">0.75</output></label><input id="complexity" type="range" min="15" max="100" value="75" /></div>
          <button class="regenerate" type="button">Regenerate ${arrow}</button>
        </div>
      </div>
      <div class="organism-panel" id="organism-panel" role="tabpanel" aria-labelledby="mode-0"><div class="organism-mount" tabindex="0" role="img" aria-label="Interactive 3D fern. Drag to rotate, or use left and right arrow keys."></div><p class="renderer-status sr-only" role="status"></p><div class="specimen-caption"><span>DRAG TO ROTATE · ARROW KEYS TO EXPLORE</span><span id="specimen-name" aria-live="polite">SPECIMEN 001 — DIGITAL FERN</span></div></div>
    </div>
    <div class="lab-foot mono"><span><i class="live-dot"></i> PROCEDURAL BY NATURE</span><span>EVERY ITERATION IS A NEW BEGINNING</span></div>
  </section>
  <section class="field-notes paper" id="field-notes" aria-labelledby="notes-title">
    ${label("03 / FIELD NOTES", "A DIVERSE TECHNOLOGY ECOSYSTEM")}
    <img class="field-frond" src="${asset("images/frond.webp")}" alt="" width="1024" height="1536" loading="lazy" />
    <h2 id="notes-title" class="reveal">Different species.<br /><em>One ecosystem.</em></h2>
    <div class="species-list">${species.map((s, i) => `<article class="species ${i === 0 ? "is-open" : ""}"><h3><button class="species-toggle" aria-expanded="${i === 0}" aria-controls="species-${i}" id="species-button-${i}"><span class="species-number">0${i + 1}</span><span class="species-heading">${s.name}<small>${s.tags}</small></span><span class="small-circle">${arrow}</span></button></h3><div class="species-content" id="species-${i}" role="region" aria-labelledby="species-button-${i}" ${i === 0 ? "" : "hidden"}><p>${s.text}</p><p class="species-detail">${s.detail}</p></div></article>`).join("")}</div>

  </section>
  <section class="principles" aria-label="Creative development principles"><a class="principles-brand" href="#surface">UNTAMED</a><div><span>01</span><h3>FEEL SOMETHING</h3><p>Storytelling that stirs curiosity.<br />Typography that gives it a voice.</p></div><div><span>02</span><h3>MAKE IT RESPOND</h3><p>Interaction that feels alive.<br />Accessible, on every screen.</p></div><div><span>03</span><h3>LEAVE IT LIGHTER</h3><p>Care in every frame.<br />Performance is part of the craft.</p></div></section>
  <section class="ending" aria-labelledby="ending-title">
    <div class="ending-scene"><img src="${asset("images/jungle-ending.jpg")}" alt="" width="1536" height="1024" loading="lazy" /></div>
    <div class="ending-light" aria-hidden="true"></div>
    <div class="ending-content"><h2 id="ending-title"><span>STAY</span><em>Keep making the unexpected.</em><span>UNTAMED.</span></h2><p class="ending-equation mono">DESIGN + CODE + MOTION + IMAGINATION</p><a class="back-to-top explore-link" href="#surface"><span class="circle-arrow">${arrow}</span><span>BACK TO THE SURFACE</span></a></div>
    <footer><a class="footer-brand" href="#surface">UNTAMED</a><p>An independent exploration of creative development.</p><span>© 2026</span><button class="motion-toggle" type="button" aria-pressed="false">Pause motion</button></footer>
  </section>
</main>`;

const motion = initMotion();
initSound();
let labCleanup: (() => void) | undefined;
const lab = document.querySelector<HTMLElement>(".lab")!;
const observer = new IntersectionObserver(
  async ([entry]) => {
    if (!entry.isIntersecting) return;
    observer.disconnect();
    try {
      const { initLab } = await import("./lab");
      labCleanup = initLab(motion);
    } catch {
      document.querySelector(".renderer-status")!.textContent =
        "The interactive renderer could not load. Please refresh to try again.";
      document.querySelector(".organism-mount")!.classList.add("is-fallback");
      document
        .querySelectorAll<HTMLInputElement | HTMLButtonElement>(
          ".lab-controls button, .lab-controls input",
        )
        .forEach((control) => (control.disabled = true));
    }
  },
  { rootMargin: "650px" },
);
observer.observe(lab);

document
  .querySelectorAll<HTMLButtonElement>(".species-toggle")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const expand = button.getAttribute("aria-expanded") !== "true";
      document
        .querySelectorAll<HTMLButtonElement>(".species-toggle")
        .forEach((other) => {
          const open = other === button && expand;
          other.setAttribute("aria-expanded", String(open));
          other.closest(".species")!.classList.toggle("is-open", open);
          document.getElementById(
            other.getAttribute("aria-controls")!,
          )!.hidden = !open;
        });
      motion.refresh();
    });
  });
window.addEventListener(
  "pagehide",
  () => {
    observer.disconnect();
    labCleanup?.();
    motion.destroy();
  },
  { once: true },
);
