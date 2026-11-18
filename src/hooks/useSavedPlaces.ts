"use client";

import { useCallback } from "react";
import { newId, type PlaceKind, type SavedPlace } from "@/lib/storage";
import type { Place } from "@/lib/types";
import { useLocalStore } from "./useLocalStore";

const MAX = 30;
const EMPTY: SavedPlace[] = [];

export function useSavedPlaces() {
  const [places, setPlaces] = useLocalStore<SavedPlace[]>("places", EMPTY);

  /** Home and Work hold one place each; favourites accumulate. */
  const save = useCallback((kind: PlaceKind, place: Place, name?: string) => {
    const label = name || (kind === "home" ? "Home" : kind === "work" ? "Work" : place.label);
    setPlaces((prev) => {
      const rest = prev.filter((p) => (kind === "fav" ? !(p.kind === "fav" && p.place.lat === place.lat && p.place.lng === place.lng) : p.kind !== kind));
      return [{ id: newId(), kind, name: label, place, ts: Date.now() }, ...rest].slice(0, MAX);
    });
  }, [setPlaces]);

  const remove = useCallback((id: string) => setPlaces((prev) => prev.filter((p) => p.id !== id)), [setPlaces]);

  return { places, save, remove };
}
