"use client";

import { useEffect, useRef, useState } from "react";

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Advect the detailed photographic plasma, keeping the shadow and disk plane stable.
const fragmentSource = `
  precision highp float;
  uniform sampler2D u_texture;
  uniform float u_time;
  varying vec2 v_uv;
  void main() {
    vec2 uv = vec2(v_uv.x, 1.0 - v_uv.y);
    vec2 p = uv - vec2(0.5, 0.485);
    float r = length(p);
    float angle = atan(p.y, p.x);
    float plasma = smoothstep(0.13, 0.19, r) * (1.0 - smoothstep(0.39, 0.57, r));
    float disk = exp(-pow((p.y + p.x * 0.075) * 25.0, 2.0));
    float flow = sin(angle * 9.0 - u_time * 0.65 + r * 48.0);
    float ripple = sin(r * 115.0 - u_time * 1.05 + angle * 3.0);
    vec2 tangent = vec2(-p.y, p.x) / max(r, 0.001);
    vec2 displacement = tangent * (flow * 0.0035 + ripple * 0.0015) * plasma;
    displacement.x += sin(p.x * 48.0 - u_time * 0.85) * disk * 0.003;
    vec3 color = texture2D(u_texture, uv + displacement).rgb;
    float energy = 1.0 + plasma * (0.065 * sin(angle * 5.0 - u_time * 0.7 + r * 24.0)
      + 0.025 * sin(angle * 13.0 + u_time * 1.1));
    color *= energy;
    // Transparent surroundings expose the independent, full-page star field.
    float edge = 1.0 - smoothstep(0.42, 0.51, max(abs(p.x), abs(p.y)));
    float shadow = 1.0 - smoothstep(0.17, 0.24, r);
    float plasmaAlpha = smoothstep(0.025, 0.15, max(color.r, max(color.g, color.b)));
    float alpha = max(shadow, plasmaAlpha) * edge;
    gl_FragColor = vec4(color * alpha, alpha);
  }
`;

export default function BlackHoleCanvas({ paused }: { paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playback = useRef<((paused: boolean) => void) | null>(null);
  const pausedRef = useRef(paused);
  const [contextVersion, setContextVersion] = useState(0);

  useEffect(() => {
    pausedRef.current = paused;
    playback.current?.(paused);
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, powerPreference: "low-power" });
    if (!gl) return;
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const error = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Black hole shader: ${error}`);
      }
      return shader;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram()!;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      throw new Error(`Black hole program: ${error}`);
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, "u_texture"), 0);
    const timeUniform = gl.getUniformLocation(program, "u_time");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let alive = true;
    let loaded = false;
    let visible = true;
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    const draw = () => {
      if (!alive || !loaded || gl.isContextLost()) return;
      gl.uniform1f(timeUniform, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const tick = (now: number) => {
      elapsed += previous ? Math.min((now - previous) / 1000, 0.05) : 0;
      previous = now;
      draw();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      cancelAnimationFrame(frame);
      previous = 0;
      if (!alive || !loaded || gl.isContextLost()) return;
      draw();
      if (!pausedRef.current && !reduced.matches && visible && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };
    playback.current = sync;
    const resize = () => {
      const resolution = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.min(1600, Math.round(canvas.clientWidth * resolution));
      canvas.height = Math.min(1600, Math.round(canvas.clientHeight * resolution));
      gl.viewport(0, 0, canvas.width, canvas.height);
      draw();
    };
    const image = new window.Image();
    image.onload = () => {
      if (!alive || gl.isContextLost()) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      loaded = true;
      resize();
      sync();
    };
    image.src = "/images/era/black-hole.webp";
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    visibilityObserver.observe(canvas);
    const lost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frame); };
    const restored = () => setContextVersion((value) => value + 1);
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      alive = false;
      image.onload = null;
      playback.current = null;
      cancelAnimationFrame(frame);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [contextVersion]);

  return <canvas ref={canvasRef} className="black-hole-canvas" role="img" aria-label="白熱吸積盤環繞黑洞，金色光流沿重力透鏡緩慢流動" />;
}
