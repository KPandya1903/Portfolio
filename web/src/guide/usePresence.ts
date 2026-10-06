"use client";
import { useEffect, useState } from "react";

/**
 * Keeps `value` mounted for `exitMs` after it becomes null, so an exit animation can play.
 * While non-null it returns the value at once; after it goes null it returns the last value with
 * `leaving: true` until the timer ends. exitMs = 0 drops it immediately.
 */
export function usePresence<T>(value: T | null, exitMs: number): { shown: T | null; leaving: boolean } {
  // The last non-null value, tagged with whether its exit window has run out; both are derived during render.
  const [held, setHeld] = useState<{ value: T | null; expired: boolean }>({ value, expired: false });
  if (value !== null && (held.value !== value || held.expired)) setHeld({ value, expired: false });

  const holding = value === null && held.value !== null && !held.expired && exitMs > 0;

  useEffect(() => {
    if (!holding) return;
    const id = window.setTimeout(() => setHeld((h) => ({ ...h, expired: true })), exitMs);
    return () => window.clearTimeout(id);
  }, [holding, exitMs]);

  if (value !== null) return { shown: value, leaving: false };
  return holding ? { shown: held.value, leaving: true } : { shown: null, leaving: false };
}
