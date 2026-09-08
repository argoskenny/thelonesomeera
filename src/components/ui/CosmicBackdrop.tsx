"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CosmicBackdropProps = {
  variant: "galaxy" | "nebula";
  contained?: boolean;
};

export default function CosmicBackdrop({ variant, contained = false }: CosmicBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const pauseRef = useRef(false);
  const playback = useRef<(() => void) | null>(null);

  useEffect(() => {
    pauseRef.current = paused;
    playback.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !stage || !context) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let seed = variant === "galaxy" ? 7391 : 3817;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const stars = Array.from({ length: 620 }, () => ({
      x: random(), y: random(), depth: 0.15 + random() * 0.85,
      phase: random() * Math.PI * 2, size: 0.35 + random() * 1.05,
      bright: random() > 0.967,
    }));
    const glow = document.createElement("canvas");
    glow.width = glow.height = 64;
    const glowContext = glow.getContext("2d")!;
    const gradient = glowContext.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.06, "#e8ecff");
    gradient.addColorStop(0.16, "#b2ccffa0");
    gradient.addColorStop(0.45, "#738dff25");
    gradient.addColorStop(1, "#738dff00");
    glowContext.fillStyle = gradient;
    glowContext.fillRect(0, 0, 64, 64);
    let width = 1;
    let height = 1;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    let visible = false;
    let alive = true;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const count = width < 760 ? 240 : stars.length;
      for (let index = 0; index < count; index++) {
        const star = stars[index];
        const x = ((star.x * width + pointer.x * star.depth * 23 + elapsed * star.depth * 0.5) % width + width) % width;
        const y = ((star.y * height + pointer.y * star.depth * 18 - elapsed * star.depth * 0.3) % height + height) % height;
        const pulse = 0.6 + Math.sin(elapsed * 0.55 + star.phase) * 0.2;
        context.globalAlpha = pulse * (0.25 + star.depth * 0.6);
        if (star.bright) {
          const size = 16 + star.depth * 21;
          context.drawImage(glow, x - size / 2, y - size / 2, size, size);
          context.strokeStyle = "#dfeaff";
          context.lineWidth = 0.45;
          context.beginPath();
          context.moveTo(x - 5, y); context.lineTo(x + 5, y);
          context.moveTo(x, y - 5); context.lineTo(x, y + 5);
          context.stroke();
        } else {
          context.fillStyle = variant === "galaxy" ? "#b7d8ff" : "#ddd2ff";
          context.beginPath();
          context.arc(x, y, star.size * star.depth, 0, Math.PI * 2);
          context.fill();
        }
      }
      // One restrained meteor per cycle; no flashes or repeating screen-wide streaks.
      const meteor = (elapsed + (variant === "galaxy" ? 0 : 7)) % 19;
      if (meteor > 12 && meteor < 13.8) {
        const travel = (meteor - 12) / 1.8;
        const x = width * (0.8 - travel * 0.35);
        const y = height * (0.12 + travel * 0.21);
        const trail = context.createLinearGradient(x, y, x + 85, y - 42);
        trail.addColorStop(0, "#dfe8ff"); trail.addColorStop(1, "#c9d5ff00");
        context.globalAlpha = Math.sin(travel * Math.PI) * 0.4;
        context.strokeStyle = trail;
        context.lineWidth = 1;
        context.beginPath(); context.moveTo(x, y); context.lineTo(x + 85, y - 42); context.stroke();
      }
      context.globalAlpha = 1;
      stage.style.setProperty("--cosmic-x", `${pointer.x * 10}px`);
      stage.style.setProperty("--cosmic-y", `${pointer.y * 8}px`);
    };
    const tick = (now: number) => {
      elapsed += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      pointer.x += (pointer.targetX - pointer.x) * 0.035;
      pointer.y += (pointer.targetY - pointer.y) * 0.035;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!alive) return;
      if (reduced.matches) pointer.x = pointer.y = pointer.targetX = pointer.targetY = 0;
      draw();
      if (visible && !document.hidden && !pauseRef.current && !reduced.matches) frame = requestAnimationFrame(tick);
    };
    playback.current = sync;
    const resize = () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch" || pauseRef.current || reduced.matches || !visible) return;
      pointer.targetX = event.clientX / innerWidth - 0.5;
      pointer.targetY = event.clientY / innerHeight - 0.5;
    };
    const resetPointer = () => { pointer.targetX = pointer.targetY = 0; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(stage);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(stage);
    reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", resetPointer);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect(); sizeObserver.disconnect();
      reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", resetPointer);
      playback.current = null;
    };
  }, [variant]);

  return (
    <>
      <div className={`cosmic-environment cosmic-environment--${variant}${contained ? " cosmic-environment--contained" : ""}`} aria-hidden="true">
        <div className="cosmic-environment__stage" ref={stageRef}>
          <div className="cosmic-environment__nebula" />
          <canvas ref={canvasRef} />
          <div className="cosmic-environment__shade" />
        </div>
      </div>
      <button type="button" className={`cosmic-toggle${contained ? " cosmic-toggle--contained" : ""}`} aria-pressed={paused} aria-label={paused ? "播放星際背景動畫" : "暫停星際背景動畫"} onClick={() => setPaused(!paused)}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}<span>{paused ? "播放星空" : "暫停星空"}</span>
      </button>
    </>
  );
}
