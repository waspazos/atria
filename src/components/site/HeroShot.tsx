"use client";

import { useEffect, useRef, useState } from "react";
import s from "./Site.module.css";

const FRAME_W = 1440;
const FRAME_H = 900;
const VISIBLE_H = 760;

/** Live client space rendered at desktop size and scaled to fit. */
export default function HeroShot({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / FRAME_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={s.shot}>
      <div className={s.figBar}>
        <span>FIG. 01 · CLIENT VIEW</span>
        <span>{label}</span>
      </div>
      <div className={s.shotFrame} style={{ height: Math.round(VISIBLE_H * scale) }}>
        <iframe
          src={src}
          title="Atria client space"
          tabIndex={-1}
          aria-hidden
          loading="lazy"
          style={{ width: FRAME_W, height: FRAME_H, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
