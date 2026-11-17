import { useEffect,useRef } from 'react';
import styles from './Cursor.module.css';
const FOLLOW_REMAINING = .7, FRAME_MS = 16.67;
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current!, query = matchMedia('(hover: hover) and (pointer: fine)');
    let x = 0,y = 0,tx = 0,ty = 0,started = false,frame = 0,previous = performance.now();
    const move = (event: PointerEvent) => { if (!query.matches || event.pointerType === 'touch') return; tx = event.clientX; ty = event.clientY; if (!started) { x = tx; y = ty; started = true; } element.style.opacity = '1'; };
    const leave = (event: MouseEvent) => { if (!event.relatedTarget) element.style.opacity = '0'; };
    const blur = () => { element.style.opacity = '0'; };
    const tick = (now: number) => { const k = 1-Math.pow(FOLLOW_REMAINING,(now-previous)/FRAME_MS); previous = now; x += (tx-x)*k; y += (ty-y)*k; element.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick); window.addEventListener('pointermove',move); window.addEventListener('mouseout',leave); window.addEventListener('blur',blur);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('pointermove',move); window.removeEventListener('mouseout',leave); window.removeEventListener('blur',blur); };
  },[]);
  return <div className={styles.cursor} ref={ref} aria-hidden="true" />;
}
