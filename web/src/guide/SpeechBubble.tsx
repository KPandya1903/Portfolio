"use client";
import { useEffect, useRef } from "react";
import { bubbleBox } from "./anchors";
import { bubbleAnchor } from "./bubbleAnchor";
import { guideStore, useGuide, type GuideStore } from "./store";
import { useTypewriter } from "./useTypewriter";

const COMPACT_HIDE_MS = 5000;
const TYPE_CPS = 35;

export function SpeechBubble({ store = guideStore }: { store?: GuideStore }) {
  const bubble = useGuide((s) => s.bubble, store);
  const mode = useGuide((s) => s.mode, store);
  const reduced = useGuide((s) => s.reducedMotion, store);
  const ref = useRef<HTMLDivElement>(null);
  const { text, finish } = useTypewriter(bubble?.text ?? "", bubble?.key ?? 0, reduced ? Infinity : TYPE_CPS);
  const width = mode === "wide" ? 248 : 220;

  // Follow the avatar's head every frame without React re-renders.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const { left, top } = bubbleBox(bubbleAnchor, width, window.innerWidth);
        el.style.transform = `translate3d(${left}px, ${top}px, 0) translateY(-100%)`;
        el.style.visibility = bubbleAnchor.visible ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [width]);

  // Compact mode: bubbles auto-hide (docs/02 §2).
  useEffect(() => {
    if (!bubble || mode !== "compact") return;
    const t = window.setTimeout(() => store.set({ bubble: null }), COMPACT_HIDE_MS);
    return () => window.clearTimeout(t);
  }, [bubble, mode, store]);

  if (!bubble) return null;
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-testid="guide-bubble"
      onClick={finish}
      style={{ position: "fixed", left: 0, top: 0, zIndex: 45, width, visibility: "hidden" }}
      className="rounded-[14px] border border-accent-cream bg-surface-light px-4 py-3 pr-8 text-sm leading-snug text-text-primary shadow-card-lg"
    >
      {text}
      <button
        type="button"
        aria-label="Hide guide message"
        onClick={(e) => {
          e.stopPropagation();
          store.set({ bubble: null });
        }}
        className="absolute right-2 top-2 text-text-secondary hover:text-text-primary"
      >
        ×
      </button>
    </div>
  );
}
