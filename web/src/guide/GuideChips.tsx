"use client";
import { useEffect } from "react";
import { restingBox } from "./anchors";
import { chipAction, menuAllowed } from "./chips";
import { CHIPS } from "./config";
import { HOTSPOT_ID, MENU_ID } from "./GuideHotspot";
import { guideStore, useGuide, type GuideStore } from "./store";
import { usePresence } from "./usePresence";

const EXIT_MS = 120;
const GAP = 8;
const CHIP =
  "rounded-full border border-accent-cream bg-surface-light px-3.5 py-1.5 text-sm font-medium text-text-primary shadow-card-lg transition-colors hover:border-accent-secondary";

/**
 * The quick-jump menu: plain buttons right of the resting robot (beside the hotspot, below the speech bubble, so
 * neither covers the other; wrapping keeps it on a phone screen). Always in the DOM while the hotspot is, so
 * aria-controls resolves; hidden and inert while closed, which also keeps it out of the tab order.
 */
export function GuideChips({ store = guideStore }: { store?: GuideStore }) {
  const allowed = useGuide(menuAllowed, store);
  const menuOpen = useGuide((s) => s.menuOpen, store);
  const mode = useGuide((s) => s.mode, store);
  const reduced = useGuide((s) => s.reducedMotion, store);
  const open = allowed && menuOpen;
  const { shown, leaving } = usePresence(open ? true : null, reduced ? 0 : EXIT_MS);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      store.closeMenu();
      document.getElementById(HOTSPOT_ID)?.focus();
    };
    const onPress = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.(`#${MENU_ID}, #${HOTSPOT_ID}`)) return;
      store.closeMenu();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [open, store]);

  if (!allowed) return null;
  const { left, bottom, size } = restingBox(mode);
  const x = left + size + GAP;

  const choose = (target: string) => {
    const action = chipAction(target, { reducedMotion: reduced, mode });
    store.closeMenu(); // first, so the scroll-driven section change has nothing left to close
    if (action.type === "open") {
      window.open(action.url, "_blank", "noopener");
      return;
    }
    if (action.forceStage) store.requestStage(action.id);
    document.getElementById(action.id)?.scrollIntoView({ behavior: action.behavior });
  };

  return (
    <nav
      id={MENU_ID}
      aria-label="Guide menu"
      hidden={!shown}
      inert={!open}
      className={`flex flex-wrap items-end gap-2 ${reduced ? "" : leaving ? "guide-bubble-out" : "guide-bubble-in"}`}
      style={{ position: "fixed", left: x, bottom, maxWidth: `calc(100vw - ${x + 16}px)`, zIndex: 46 }}
    >
      {CHIPS.map((c) => (
        <button key={c.id} type="button" className={CHIP} onClick={() => choose(c.target)}>
          {c.label}
        </button>
      ))}
    </nav>
  );
}
