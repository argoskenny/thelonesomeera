"use client";

import BlackHoleCanvas from "@/components/ui/BlackHoleCanvas";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function SingularArt({ interactive = false }: { interactive?: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = frame.current;
    const section = element?.closest("section");
    if (!element || !section) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let scheduled = 0;
    const update = () => {
      scheduled = 0;
      if (reduced.matches) {
        element.style.setProperty("--art-zoom", "1");
        return;
      }
      if (paused) return;
      const bounds = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -bounds.top / Math.max(bounds.height, 1)));
      const range = innerWidth <= 760 ? 0.3 : 0.55;
      element.style.setProperty("--art-zoom", String(1 + progress * range));
    };
    const schedule = () => {
      if (!scheduled && !document.hidden) scheduled = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(scheduled);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
    };
  }, [paused]);

  return (
    <div className={`singular-art${paused ? " is-paused" : ""}`} ref={frame}
      onPointerMove={interactive ? (event) => {
        if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        frame.current?.style.setProperty("--art-x", `${((event.clientX - bounds.left) / bounds.width - 0.5) * 6}deg`);
        frame.current?.style.setProperty("--art-y", `${((event.clientY - bounds.top) / bounds.height - 0.5) * -4}deg`);
      } : undefined}
      onPointerLeave={() => {
        frame.current?.style.setProperty("--art-x", "0deg");
        frame.current?.style.setProperty("--art-y", "0deg");
      }}>
      <div className="singular-art__perspective">
        <BlackHoleCanvas paused={paused} />
      </div>
      <button className="motion-toggle" type="button" aria-label={paused ? "播放主視覺動畫" : "暫停主視覺動畫"} aria-pressed={paused} onClick={() => setPaused(!paused)}>
        {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}<span>{paused ? "播放動態" : "暫停動態"}</span>
      </button>
    </div>
  );
}
