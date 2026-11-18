"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/** Large tagline whose words light up one at a time as they cross a trigger line. */
export default function TaglineReveal({ lines }: { lines: string[] }) {
  const root = useRef<HTMLParagraphElement>(null);
  const words = useMemo(() => lines.map((l) => l.split(" ")), [lines]);
  const total = words.flat().length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setActive(total); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const trigger = window.innerHeight * 0.7;
      let n = 0;
      root.current?.querySelectorAll<HTMLElement>("[data-w]").forEach((el) => { if (el.getBoundingClientRect().top < trigger) n++; });
      setActive(n);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); }; // throttled to one update per frame
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => { window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); if (raf) cancelAnimationFrame(raf); };
  }, [total]);

  let i = 0;
  return (
    <p ref={root} className="heading-1 max-w-[680px] text-white" aria-label={lines.join(" ")}>
      {words.map((line, li) => (
        <span key={li} className="block" aria-hidden>
          {line.map((w, wi) => {
            const idx = i++;
            return (
              <span key={wi} data-w className="inline-block transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ opacity: idx < active ? 1 : 0.3, transitionDelay: `${(wi % 5) * 40}ms` }}>
                {w}{wi < line.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
