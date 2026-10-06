"use client";
import { GUIDE_ENABLED_KEY, writeStorage } from "./environment";
import { guideStore, useGuide } from "./store";

/** Visitor-facing off switch, persisted (pattern: R5.1 recruiter mode). */
export function GuideToggle() {
  const enabled = useGuide((s) => s.enabled);
  const toggle = () => {
    const next = !enabled;
    guideStore.set({ enabled: next });
    writeStorage("local", GUIDE_ENABLED_KEY, next ? "1" : "0");
    if (next) delete document.documentElement.dataset.guide;
    else document.documentElement.dataset.guide = "off";
  };
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
    >
      Guide {enabled ? "on" : "off"}
    </button>
  );
}
