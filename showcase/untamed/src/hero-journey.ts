import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sampleJourney, smoothRange } from "./hero-state";
import type { createJungleScene } from "./hero-scene";

gsap.registerPlugin(ScrollTrigger);

export function initHeroJourney() {
  const wrapper = document.querySelector<HTMLElement>(".hero-journey")!;
  const hero = wrapper.querySelector<HTMLElement>(".hero")!;
  const host = hero.querySelector<HTMLElement>(".jungle-backdrop")!;
  const front = hero.querySelector<HTMLElement>(".jungle-foreground")!;
  const image = hero.querySelector<HTMLElement>(".hero-image")!;
  const titles = Array.from(hero.querySelectorAll<HTMLElement>(".title-line"));
  const script = hero.querySelector<HTMLElement>(".hero-subline")!;
  const interfaceElements = Array.from(
    hero.querySelectorAll<HTMLElement>(".hero-bottom,.scroll-cue"),
  );
  const threshold = hero.querySelector<HTMLElement>(".jungle-threshold")!;
  let scene: Awaited<ReturnType<typeof createJungleScene>> | undefined;
  let tween: gsap.core.Tween | undefined;
  let frame = 0,
    last = 0,
    active = true,
    paused = true,
    disposed = false,
    loading = false,
    unavailable = false;
  let pointerX = 0,
    pointerY = 0,
    x = 0,
    y = 0;
  const state = { progress: 0 };
  const paint = () => {
    const pose = sampleJourney(state.progress, hero.clientWidth <= 700);
    hero.dataset.progress = pose.progress.toFixed(4);
    image.style.opacity = String(pose.entranceOpacity);
    front.style.opacity = String(smoothRange(pose.progress, 0.015, 0.13));
    titles.forEach((title, index) => {
      const d = pose.typeDeparture;
      title.style.transform = `translate3d(${(index ? 1 : -1) * d * 18}%,${(index ? 1 : -1) * d * 62}%,0) scale(${1 + d * 0.13})`;
      title.style.opacity = String(pose.typeOpacity);
    });
    script.style.opacity = String(pose.scriptOpacity);
    script.style.transform = `translateY(${pose.typeDeparture * 26}px)`;
    interfaceElements.forEach((el) => {
      el.style.opacity = String(pose.interfaceOpacity);
      el.inert = pose.interfaceOpacity < 0.05;
    });
    threshold.style.opacity = String(pose.threshold);
  };
  const render = (now: number) => {
    frame = 0;
    if (disposed || paused || !scene || !active || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    x += (pointerX - x) * 0.04;
    y += (pointerY - y) * 0.04;
    scene.render(state.progress, dt, x, y);
    frame = requestAnimationFrame(render);
  };
  const wake = () => {
    if (!frame && active && !paused && !document.hidden && scene) {
      last = 0;
      frame = requestAnimationFrame(render);
    }
  };
  const layout = (enabled: boolean) => {
    const before = wrapper.getBoundingClientRect().bottom;
    const below = before <= 0;
    wrapper.classList.toggle("is-immersive", enabled);
    if (below)
      window.scrollBy({
        top: wrapper.getBoundingClientRect().bottom - before,
        behavior: "instant",
      });
    ScrollTrigger.refresh();
  };
  const reset = () => {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    tween = undefined;
    cancelAnimationFrame(frame);
    frame = 0;
    state.progress = 0;
    paint();
    layout(false);
  };
  const activate = () => {
    if (!scene || paused || disposed) return;
    layout(true);
    scene.resize();
    tween = gsap.to(state, {
      progress: 1,
      ease: "none",
      onUpdate: paint,
      scrollTrigger: {
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.65,
        invalidateOnRefresh: true,
      },
    });
    paint();
    wake();
  };
  const fail = () => {
    unavailable = true;
    reset();
    scene?.destroy();
    scene = undefined;
  };
  const setPaused = async (value: boolean) => {
    paused = value;
    reset();
    if (paused || disposed || unavailable) return;
    if (scene) {
      activate();
      return;
    }
    if (loading) return;
    loading = true;
    try {
      const { createJungleScene } = await import("./hero-scene");
      if (disposed) return;
      scene = await createJungleScene(host, front, fail);
      if (disposed) {
        scene.destroy();
        return;
      }
      activate();
    } catch {
      fail();
    } finally {
      loading = false;
    }
  };
  const pointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const rect = hero.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) / rect.width - 0.5;
    pointerY = 0.5 - (e.clientY - rect.top) / rect.height;
  };
  const leave = () => {
    pointerX = pointerY = 0;
  };
  const observer = new IntersectionObserver(([entry]) => {
    active = entry.isIntersecting;
    if (!active) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  });
  observer.observe(hero);
  const resize = new ResizeObserver(() => {
    scene?.resize();
    paint();
  });
  resize.observe(hero);
  hero.addEventListener("pointermove", pointer, { passive: true });
  hero.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", wake);
  return {
    setPaused,
    destroy() {
      disposed = true;
      reset();
      scene?.destroy();
      observer.disconnect();
      resize.disconnect();
      hero.removeEventListener("pointermove", pointer);
      hero.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", wake);
    },
  };
}
