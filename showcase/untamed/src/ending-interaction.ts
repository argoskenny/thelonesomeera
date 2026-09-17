/** Pointer depth is independent of the existing scroll transform. */
export function initEndingInteraction() {
  const ending = document.querySelector<HTMLElement>(".ending")!;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  let paused = true,
    visible = false,
    frame = 0,
    last = 0;
  let x = 0,
    y = 0,
    glow = 0;
  let targetX = 0,
    targetY = 0,
    targetGlow = 0;
  const paint = () => {
    ending.style.setProperty("--ending-x", `${x * -18}px`);
    ending.style.setProperty("--ending-y", `${y * -12}px`);
    ending.style.setProperty("--ending-type-x", `${x * 4}px`);
    ending.style.setProperty("--ending-type-y", `${y * 3}px`);
    ending.style.setProperty("--light-x", `${50 + x * 50}%`);
    ending.style.setProperty("--light-y", `${50 + y * 50}%`);
    ending.style.setProperty("--light-opacity", String(glow));
  };
  const render = (now: number) => {
    frame = 0;
    if (paused || !visible || document.hidden) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
    last = now;
    const ease = 1 - Math.exp(-dt * 7);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    glow += (targetGlow - glow) * ease;
    paint();
    if (
      Math.abs(x - targetX) +
        Math.abs(y - targetY) +
        Math.abs(glow - targetGlow) >
      0.001
    )
      frame = requestAnimationFrame(render);
  };
  const wake = () => {
    if (!frame && !paused && visible && !document.hidden) {
      last = 0;
      frame = requestAnimationFrame(render);
    }
  };
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    x = y = targetX = targetY = glow = targetGlow = 0;
    paint();
  };
  const move = (event: PointerEvent) => {
    if (paused || !finePointer.matches || event.pointerType !== "mouse") return;
    const rect = ending.getBoundingClientRect();
    targetX = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1),
    );
    targetY = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height) * 2 - 1),
    );
    targetGlow = 1;
    wake();
  };
  const leave = () => {
    targetX = targetY = targetGlow = 0;
    wake();
  };
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) reset();
  });
  const hidden = () => {
    if (document.hidden) reset();
  };
  const pointerChange = () => {
    if (!finePointer.matches) reset();
  };
  visibility.observe(ending);
  ending.addEventListener("pointermove", move, { passive: true });
  ending.addEventListener("pointerleave", leave);
  document.addEventListener("visibilitychange", hidden);
  finePointer.addEventListener("change", pointerChange);
  return {
    setPaused(value: boolean) {
      paused = value;
      if (paused) reset();
    },
    destroy() {
      reset();
      visibility.disconnect();
      ending.removeEventListener("pointermove", move);
      ending.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", hidden);
      finePointer.removeEventListener("change", pointerChange);
    },
  };
}
