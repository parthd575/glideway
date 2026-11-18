"use client";

import { useState } from "react";
import { Minus, Plus } from "@phosphor-icons/react";

export interface FaqItem { q: string; a: string }

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <li key={it.q} className="rounded-2xl border border-[#313131] bg-[#181818]">
            <h3>
              <button type="button" aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="lp-interactive flex w-full items-center justify-between gap-4 rounded-2xl p-6 text-left title-2 text-white hover:bg-[#1F1F1F]">
                <span className="text-pretty">{it.q}</span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#272727] text-white">{isOpen ? <Minus size={16} weight="bold" /> : <Plus size={16} weight="bold" />}</span>
              </button>
            </h3>
            {isOpen && <div id={`faq-${i}`} className="rise-in px-6 pb-6 body-3 text-[#9B9B9B]">{it.a}</div>}
          </li>
        );
      })}
    </ul>
  );
}
