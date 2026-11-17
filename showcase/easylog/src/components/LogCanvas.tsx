import { useEffect, useRef, type RefObject } from 'react';
import type { LogImages } from '../lib/loadImages';
import styles from './LogCanvas.module.css';
export type IntroMotion = { zoom: number; pixel: number };
const BRUSH_RADIUS = 240, MASK_SCALE = .5, SPACING = .12, DECAY = 1.1;
const MOVING_STRENGTH = .5, REST_STRENGTH = .25, REST_INTERVAL = .05, MIN_ALPHA = .004;
type Stamp = { x: number; y: number; strength: number; born: number };
export function LogCanvas({ images, motion }: { images: LogImages | null; motion: RefObject<IntroMotion> }) {
  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  const canvasRef = useRef<HTMLCanvasElement>(null), clipRef = useRef<HTMLDivElement>(null), imageRef = useRef<HTMLDivElement>(null), probeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!, hero = canvas.parentElement!;
    const ctx = canvas.getContext('2d')!;
    const scene = document.createElement('canvas'), layer = document.createElement('canvas'), mask = document.createElement('canvas'), brush = document.createElement('canvas'), pixel = document.createElement('canvas');
    const sc = scene.getContext('2d')!, lc = layer.getContext('2d')!, mc = mask.getContext('2d')!, bc = brush.getContext('2d')!, pc = pixel.getContext('2d')!;
    let w = 0, h = 0, dpr = 1, radius = 1, r = 1, frame = 0;
    let rect = hero.getBoundingClientRect(), clip = clipRef.current!.getBoundingClientRect(), box = imageRef.current!.getBoundingClientRect();
    let stamps: Stamp[] = [], inside = false, moved = false, x = 0, y = 0, lastX = 0, lastY = 0, travel = 0, lastMove = 0, lastRest = 0;
    const touch = matchMedia('(hover: none)');
    const resize = () => {
      rect = hero.getBoundingClientRect(); clip = clipRef.current!.getBoundingClientRect(); box = imageRef.current!.getBoundingClientRect();
      w = rect.width; h = rect.height; dpr = Math.min(devicePixelRatio || 1,2);
      for (const target of [canvas,scene,layer]) { target.width = Math.round(w*dpr); target.height = Math.round(h*dpr); }
      mask.width = Math.round(w*MASK_SCALE); mask.height = Math.round(h*MASK_SCALE);
      radius = BRUSH_RADIUS * probeRef.current!.getBoundingClientRect().width / 100;
      r = Math.max(1,Math.round(radius*MASK_SCALE)); brush.width = brush.height = 2*r;
      const gradient = bc.createRadialGradient(r,r,0,r,r,r);
      gradient.addColorStop(0,'black'); gradient.addColorStop(.45,'rgba(0,0,0,.85)'); gradient.addColorStop(1,'transparent');
      bc.fillStyle = gradient; bc.fillRect(0,0,2*r,2*r); stamps = []; travel = 0; lastX = x; lastY = y;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return;
      x = event.clientX-rect.left; y = event.clientY-rect.top;
      lastMove = performance.now()/1000;
      if (!inside) { lastX = x; lastY = y; travel = 0; lastRest = lastMove; stamps.push({x,y,strength: MOVING_STRENGTH,born: lastMove}); }
      inside = true; moved = true;
    };
    const leave = (event: MouseEvent) => { if (!event.relatedTarget) { inside = false; moved = false; travel = 0; } };
    const blur = () => { inside = false; moved = false; };
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (!w || !h || !canvas.width || !canvas.height) return;
      const now = time/1000;
      if (inside && moved) {
        const dx = x-lastX, dy = y-lastY, distance = Math.hypot(dx,dy), step = radius*SPACING;
        if (distance > 0 && step > 0) {
          for (let d = step-travel; d <= distance; d += step) stamps.push({x:lastX+dx*d/distance,y:lastY+dy*d/distance,strength:MOVING_STRENGTH,born:now});
          travel = (travel+distance)%step;
        }
        lastX = x; lastY = y; moved = false; lastRest = now;
      }
      if (inside && now-lastMove >= REST_INTERVAL) {
        // Cap catch-up after a hidden tab; old resting stamps would already have decayed.
        lastRest = Math.max(lastRest,now-DECAY*6);
        while (now-lastRest >= REST_INTERVAL) { lastRest += REST_INTERVAL; stamps.push({x,y,strength:REST_STRENGTH,born:lastRest}); }
      }
      mc.clearRect(0,0,mask.width,mask.height);
      stamps = stamps.filter(stamp => {
        const alpha = stamp.strength*Math.exp(-(now-stamp.born)/DECAY);
        if (alpha < MIN_ALPHA) return false;
        mc.globalAlpha = alpha; mc.drawImage(brush,stamp.x*MASK_SCALE-r,stamp.y*MASK_SCALE-r); return true;
      }); mc.globalAlpha = 1;
      const loadedImages = imagesRef.current;
      if (!loadedImages) return;
      const zoom = motion.current.zoom, iw = box.width*zoom, ih = box.height*zoom;
      const ix = box.left-rect.left+(box.width-iw)/2, iy = box.top-rect.top+(box.height-ih)/2;
      sc.setTransform(dpr,0,0,dpr,0,0); sc.clearRect(0,0,w,h);
      sc.drawImage(loadedImages[0],ix,iy,iw,ih);
      if (touch.matches) sc.drawImage(loadedImages[1],ix,iy,iw,ih);
      else {
        lc.setTransform(dpr,0,0,dpr,0,0); lc.clearRect(0,0,w,h); lc.drawImage(loadedImages[1],ix,iy,iw,ih);
        lc.globalCompositeOperation = 'destination-in'; lc.drawImage(mask,0,0,w,h); lc.globalCompositeOperation = 'source-over';
        sc.setTransform(1,0,0,1,0,0); sc.drawImage(layer,0,0);
      }
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
      ctx.save(); ctx.beginPath(); ctx.rect(clip.left-rect.left,clip.top-rect.top,clip.width,clip.height); ctx.clip();
      const block = Math.pow(2,motion.current.pixel);
      if (block > 1.01) {
        pixel.width = Math.max(1,Math.ceil(w/block)); pixel.height = Math.max(1,Math.ceil(h/block));
        // Keep blocks square in CSS pixels; clip the partial blocks at the edges.
        pc.drawImage(scene,0,0,w/block,h/block);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(pixel,0,0,pixel.width*block,pixel.height*block);
      } else { ctx.imageSmoothingEnabled = true; ctx.drawImage(scene,0,0,w,h); }
      ctx.restore();
    };
    const observer = new ResizeObserver(resize); observer.observe(hero); resize(); frame = requestAnimationFrame(draw);
    window.addEventListener('pointermove',move); window.addEventListener('mouseout',leave); window.addEventListener('blur',blur);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener('pointermove',move); window.removeEventListener('mouseout',leave); window.removeEventListener('blur',blur); };
  },[motion]);
  return <><canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" /><div ref={clipRef} className={styles.clip}><div ref={imageRef} className={styles.image} /></div><div ref={probeRef} className={styles.probe} /></>;
}
