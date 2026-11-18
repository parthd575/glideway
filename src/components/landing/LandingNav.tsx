"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { id: "routes", label: "Routes" },
  { id: "how", label: "How it works" },
  { id: "features", label: "Features" },
  { id: "faq", label: "FAQ" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  // Mark the section being read as the current item
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) setActive(e.target.id); }, { rootMargin: "-40% 0px -55% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]);

  const ease = "transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]";

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav aria-label="Primary" className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[#313131] bg-[#181818]/70 p-2 backdrop-blur-xl">
          <Link href="/" className="lp-interactive rounded-lg px-3 py-2 title-3 text-white hover:bg-[#272727]">Glide<span className="text-emerald-400">Way</span></Link>
          <ul className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} aria-current={active === l.id ? "true" : undefined} className={`lp-interactive block rounded-lg px-3 py-2 button-sm hover:bg-[#272727] hover:text-white ${active === l.id ? "bg-[#272727] text-white" : "text-[#9B9B9B]"}`}>{l.label}</a>
              </li>
            ))}
          </ul>
          <Link href="/app?demo=1" className="lp-interactive hidden rounded-lg bg-white px-3 py-2 button-sm text-black hover:bg-[#9B9B9B] md:block">Try the demo</Link>
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="lp-interactive relative h-10 w-10 rounded-lg text-white hover:bg-[#272727] md:hidden">
            <span className={`absolute left-1/2 top-1/2 block h-0.5 w-5 -ml-2.5 rounded-full bg-white ${ease} ${open ? "rotate-45" : "-translate-y-1"}`} />
            <span className={`absolute left-1/2 top-1/2 block h-0.5 w-5 -ml-2.5 rounded-full bg-white ${ease} ${open ? "-rotate-45" : "translate-y-1"}`} />
          </button>
        </nav>
      </header>

      <div id="mobile-menu" aria-hidden={!open} className={`fixed inset-0 z-40 flex flex-col justify-center gap-6 bg-black/90 p-6 backdrop-blur-2xl transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        {[...LINKS.map((l) => ({ href: `#${l.id}`, label: l.label })), { href: "/app?demo=1", label: "Try the demo route" }].map((l, i, all) => (
          <a
            key={l.href} href={l.href} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}
            aria-current={l.href === `#${active}` ? "true" : undefined}
            className={`lp-interactive heading-4 w-fit ${i === all.length - 1 ? "text-emerald-400" : "text-white"} ${ease} ${open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} `}
            style={{ transitionProperty: "transform, opacity", transitionDelay: open ? `${Math.min(i * 60, 400)}ms` : "0ms" }}
          >{l.label}</a>
        ))}
      </div>
    </>
  );
}
