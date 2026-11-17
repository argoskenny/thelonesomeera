import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { loadImages, type LogImages } from '../lib/loadImages';
import { LogCanvas, type IntroMotion } from './LogCanvas';
import { Nav } from './Nav';
import styles from './Hero.module.css';
const START_ZOOM = 2.6, START_PIXEL = 6, PROGRESS_FOLLOW = .4;
const COUNTER_DURATION = .8, ZOOM_DURATION = .9, PIXEL_DURATION = 1, CHARACTER_STAGGER = .035;
export function Hero() {
  const root = useRef<HTMLElement>(null), number = useRef<HTMLSpanElement>(null);
  const motion = useRef<IntroMotion>({zoom:START_ZOOM,pixel:START_PIXEL});
  const [images,setImages] = useState<LogImages | null>(null);
  useEffect(() => {
    const abort = new AbortController(); let stale = false, owned: LogImages | null = null;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    motion.current = {zoom:reduced ? 1 : START_ZOOM,pixel:reduced ? 0 : START_PIXEL};
    const progress = {value:0}; let highWater = 0;
    const update = () => { if (number.current) number.current.textContent = String(Math.round(progress.value*100)).padStart(2,'0'); };
    const context = gsap.context(() => {},root);
    const follow = gsap.quickTo(progress,'value',{duration:PROGRESS_FOLLOW,ease:'power1.out',onUpdate:update});
    const imageTask = loadImages(abort.signal,value => { highWater = Math.max(highWater,value); if (!stale) follow(highWater*.9); }).then(result => { if (stale) result.forEach(image => image.close()); else owned = result; }).catch(error => { if (!stale) console.error(error); });
    const fonts = Promise.all(['italic 400 1em "Instrument Serif"','400 1em "Instrument Sans"','500 1em "Instrument Sans"'].map(font => document.fonts.load(font))).catch(error => { if (!stale) console.error(error); });
    void Promise.all([imageTask,fonts]).then(() => {
      if (stale) return;
      setImages(owned); follow.tween.kill();
      context.add(() => {
        const timeline = gsap.timeline();
        const select = (name: string) => root.current!.querySelector(`[data-reveal="${name}"]`);
        const lines = root.current!.querySelectorAll('[data-line]');
        if (reduced) {
          timeline.to(root.current!.querySelectorAll('[data-reveal]'),{opacity:1,duration:.4,ease:'power1.out'}); return;
        }
        timeline.to(progress,{value:1,duration:COUNTER_DURATION,ease:'power1.out',onUpdate:update},0)
          .to(motion.current,{zoom:1,duration:ZOOM_DURATION,ease:'expo.out'},0)
          .to(motion.current,{pixel:0,duration:PIXEL_DURATION,ease:'none'},0)
          .to(select('counter'),{opacity:0,duration:.4,ease:'power1.in'},.85)
          .set(select('headline'),{opacity:1},1.3);
        const reveal = (name: string,time: number,blur=10,duration=.6) => timeline.fromTo(select(name),{opacity:0,filter:`blur(${blur}px)`},{opacity:1,filter:'blur(0px)',duration,ease:'power2.out',clearProps:'filter'},time);
        reveal('nav',1,8,.5);
        lines.forEach(line => timeline.fromTo(line.children,{opacity:0,filter:'blur(18px)',xPercent:-30},{opacity:1,filter:'blur(0px)',xPercent:0,duration:.8,stagger:CHARACTER_STAGGER,ease:'power2.out',clearProps:'filter,transform'},1.3));
        reveal('lead',2.1); reveal('bottom',2.5); reveal('paragraph',2.7); reveal('cta',2.85);
      });
    });
    return () => { stale = true; abort.abort(); follow.tween.kill(); context.revert(); owned?.forEach(image => image.close()); };
  },[]);
  return <main ref={root} className={styles.hero}>
    <LogCanvas images={images} motion={motion} /><Nav />
    <div className={styles.headingGroup}>
      <h1 className={styles.headline} aria-label="Every layer tells a story." data-reveal="headline">
        {['Every layer','tells a story.'].map((line,index) => <span key={line} aria-hidden="true" data-line className={`${styles.line} ${index ? styles.sans : styles.serif}`}>{[...line].map((char,i) => <span className={styles.character} key={i}>{char}</span>)}</span>)}
      </h1>
      <p className={`${styles.body} ${styles.lead}`} data-reveal="lead">Turn forgotten records, scattered logs, and silent activity into something readable.</p>
    </div>
    <div className={styles.action}><p className={styles.body} data-reveal="paragraph">EASYLOG transforms historical data into structured decisions — without losing the story behind it.</p><a href="#" className={styles.cta} data-reveal="cta">Start uncovering</a></div>
    <div className={styles.bottom} data-reveal="bottom"><div className={styles.hint}><span className={styles.hintIcon} aria-hidden="true">✦</span><span className={styles.pointerHint}>Move your cursor to reveal</span><span className={styles.touchHint}>Every detail, uncovered</span></div><span>20–26</span></div>
    <p className={styles.counter} data-reveal="counter" aria-hidden="true"><span ref={number}>00</span><span className={styles.percent}>%</span></p>
  </main>;
}
