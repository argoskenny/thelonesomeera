/** A quiet procedural forest soundscape. No audio starts before an explicit click. */
export function initSound() {
  const button = document.querySelector<HTMLButtonElement>(".sound-toggle")!;
  let context: AudioContext | undefined;
  let enabled = false;
  let chirpTimer: ReturnType<typeof setInterval> | undefined;
  const start = async () => {
    if (!context) {
      context = new AudioContext();
      const length = context.sampleRate * 4;
      const buffer = context.createBuffer(1, length, context.sampleRate);
      const samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < length; i++) {
        last = (last + Math.random() * 0.035 - 0.0175) / 1.015;
        samples[i] = last * 2;
      }
      const noise = context.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1000;
      const gain = context.createGain();
      gain.gain.value = 0.24;
      noise.connect(filter).connect(gain).connect(context.destination);
      noise.start();
      chirpTimer = setInterval(() => {
        if (
          !enabled ||
          document.hidden ||
          !context ||
          context.state !== "running"
        )
          return;
        const now = context.currentTime;
        const oscillator = context.createOscillator();
        const volume = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(1800 + Math.random() * 1300, now);
        oscillator.frequency.exponentialRampToValueAtTime(
          900 + Math.random() * 500,
          now + 0.18,
        );
        volume.gain.setValueAtTime(0, now);
        volume.gain.linearRampToValueAtTime(0.025, now + 0.02);
        volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
        oscillator.connect(volume).connect(context.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.32);
        oscillator.onended = () => {
          oscillator.disconnect();
          volume.disconnect();
        };
      }, 2300);
    }
    await context.resume();
  };
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (enabled) {
        await context?.suspend();
        enabled = false;
      } else {
        await start();
        enabled = true;
      }
      button.setAttribute("aria-pressed", String(enabled));
      button.querySelector("span")!.textContent = enabled
        ? "Sound on"
        : "Sound off";
    } catch {
      button.querySelector("span")!.textContent = "Sound unavailable";
    } finally {
      button.disabled = false;
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (!context || !enabled) return;
    if (document.hidden) void context.suspend();
    else void context.resume();
  });
  window.addEventListener(
    "pagehide",
    () => {
      if (chirpTimer) clearInterval(chirpTimer);
      void context?.close();
    },
    { once: true },
  );
}
