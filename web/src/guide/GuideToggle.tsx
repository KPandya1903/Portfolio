"use client";
import { GUIDE_ENABLED_KEY, writeStorage } from "./environment";
import { guideStore, useGuide, type GuideStore } from "./store";

/** Visitor-facing off switch, persisted (pattern: R5.1 recruiter mode). */
export function GuideToggle({ store = guideStore }: { store?: GuideStore }) {
  const enabled = useGuide((s) => s.enabled, store);
  const available = useGuide((s) => s.available, store);
  const toggle = () => {
    const next = !enabled;
    store.set({ enabled: next });
    writeStorage("local", GUIDE_ENABLED_KEY, next ? "1" : "0");
  };
  if (!available) return null;
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
    >
      {enabled ? "Guide on" : "Guide off"}
    </button>
  );
}
