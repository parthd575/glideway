"use client";

import { useState } from "react";
import { clearAllLocalData } from "@/lib/storage";

export default function ClearDataButton() {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { clearAllLocalData(); setDone(true); }} className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-gray-200 transition hover:bg-white/5">
      {done ? "Saved places, trips and preferences cleared" : "Delete my saved places, trips and preferences"}
    </button>
  );
}
