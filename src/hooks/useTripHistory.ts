"use client";

import { useCallback } from "react";
import { newId, type Trip } from "@/lib/storage";
import { useLocalStore } from "./useLocalStore";

const MAX = 50;
const EMPTY: Trip[] = [];

export function useTripHistory() {
  const [trips, setTrips] = useLocalStore<Trip[]>("trips", EMPTY);

  const add = useCallback((t: Omit<Trip, "id" | "ts" | "completed">): string => {
    const id = newId();
    setTrips((prev) => [{ ...t, id, ts: Date.now(), completed: false }, ...prev].slice(0, MAX));
    return id;
  }, [setTrips]);

  const complete = useCallback((id: string) => setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, completed: true } : t))), [setTrips]);
  const remove = useCallback((id: string) => setTrips((prev) => prev.filter((t) => t.id !== id)), [setTrips]);
  const clear = useCallback(() => setTrips([]), [setTrips]);

  return { trips, add, complete, remove, clear };
}
