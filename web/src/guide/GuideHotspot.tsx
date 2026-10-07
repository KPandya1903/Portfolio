"use client";
import { restingBox } from "./anchors";
import { menuAllowed } from "./chips";
import { guideStore, useGuide, type GuideStore } from "./store";

export const HOTSPOT_ID = "guide-hotspot";
export const MENU_ID = "guide-menu";

/**
 * A transparent button over the resting robot (the canvas is click-through). Clicking it waves and toggles the
 * quick-jump menu. It exists only while the robot is in its corner: not during the intro or a center stage.
 */
export function GuideHotspot({ store = guideStore }: { store?: GuideStore }) {
  const allowed = useGuide(menuAllowed, store);
  const mode = useGuide((s) => s.mode, store);
  const menuOpen = useGuide((s) => s.menuOpen, store);
  if (!allowed) return null;
  const { left, bottom, size } = restingBox(mode);
  return (
    <button
      id={HOTSPOT_ID}
      type="button"
      aria-label="Open guide menu"
      aria-expanded={menuOpen}
      aria-controls={MENU_ID}
      className="guide-hotspot"
      onClick={() => {
        store.toggleMenu();
        store.react();
      }}
      style={{ position: "fixed", left, bottom, width: size, height: size, zIndex: 42, cursor: "pointer" }}
    />
  );
}
