import gsap from "gsap";
import { initEndingInteraction } from "./ending-interaction";
import { initHeroJourney } from "./hero-journey";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

export type MotionState = ReturnType<typeof initMotion>;
export function initMotion() {
  const media = matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    paused: media.matches,
    refresh: () => ScrollTrigger.refresh(),
    destroy: () => {},
  };
  const button = document.querySelector<HTMLButtonElement>(".motion-toggle")!;
  let context: gsap.Context | undefined;
  const hero = document.querySelector<HTMLElement>(".hero")!;
  const journey = initHeroJourney();
  const endingInteraction = initEndingInteraction();
  const kinetic = document.querySelector<HTMLElement>(".kinetic-track")!;
  const fitTitle = () => {
    const spans = document.querySelectorAll<HTMLElement>(".title-line>span");
    spans.forEach((el) => (el.style.transform = ""));
    const line = spans[1];
    const range = document.createRange();
    range.selectNodeContents(line);
    const parentScale = new DOMMatrixReadOnly(
      getComputedStyle(line.parentElement!).transform,
    ).a;
    const actual = range.getBoundingClientRect().width / parentScale;
    const scale = Math.min(1, line.clientWidth / actual);
    spans.forEach((el) => (el.style.transform = `scaleX(${scale})`));
  };
  const resizeObserver = new ResizeObserver(() => {
    fitTitle();
  });
  resizeObserver.observe(hero);
  document.fonts.ready.then(fitTitle);
  const animate = () => {
    context?.revert();
    document.documentElement.classList.toggle("motion-paused", state.paused);
    button.textContent = state.paused ? "Resume motion" : "Pause motion";
    button.setAttribute("aria-pressed", String(state.paused));
    void journey.setPaused(state.paused);
    endingInteraction.setPaused(state.paused);
    if (state.paused) {
      fitTitle();
      return;
    }
    context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) =>
        gsap.from(el, {
          y: 45,
          opacity: 0,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
          clearProps: "opacity,transform",
        }),
      );
      gsap.to(".image-window img", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: ".fern-photo",
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(kinetic, {
        xPercent: -24,
        ease: "none",
        scrollTrigger: {
          trigger: ".ecosystem",
          start: "top 60%",
          end: "bottom top",
          scrub: 1.1,
        },
      });
      gsap.fromTo(
        ".field-frond",
        { rotate: -28, y: 35 },
        {
          rotate: -15,
          y: -25,
          ease: "none",
          scrollTrigger: {
            trigger: ".field-notes",
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        },
      );
      gsap.to(".ending-scene img", {
        yPercent: -10,
        scale: 1.01,
        ease: "none",
        scrollTrigger: {
          trigger: ".ending",
          start: "top bottom",
          end: "bottom bottom",
          scrub: true,
        },
      });
    });
  };
  const toggle = () => {
    state.paused = !state.paused;
    animate();
  };
  button.addEventListener("click", toggle);
  const mediaChange = () => {
    state.paused = media.matches;
    animate();
  };
  media.addEventListener("change", mediaChange);
  const progress = () => {
    const range = document.documentElement.scrollHeight - innerHeight;
    (
      document.querySelector(".reading-progress") as HTMLElement
    ).style.transform = `scaleX(${range > 0 ? scrollY / range : 0})`;
  };
  window.addEventListener("scroll", progress, { passive: true });
  animate();

  window.addEventListener("load", state.refresh, { once: true });
  state.destroy = () => {
    context?.revert();
    journey.destroy();
    endingInteraction.destroy();
    resizeObserver.disconnect();

    media.removeEventListener("change", mediaChange);
    button.removeEventListener("click", toggle);
    window.removeEventListener("scroll", progress);
  };
  return state;
}
