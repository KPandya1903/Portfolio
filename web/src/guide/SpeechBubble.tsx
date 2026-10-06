"use client";
import { useEffect, useRef } from "react";
import { bubbleBox } from "./anchors";
import { bubbleAnchor } from "./bubbleAnchor";
import { guideStore, useGuide } from "./store";
import { useTypewriter } from "./useTypewriter";

export function SpeechBubble() {
  const bubble = useGuide((s) => s.bubble);
  const mode = useGuide((s) => s.mode);
  const reduced = useGuide((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const { text, finish } = useTypewriter(bubble?.text ?? "", bubble?.key ?? 0, reduced ? Infinity : 35);
  const maxWidth = mode === "wide" ? 248 : 220;

  // Follow the avatar's head every frame without React re-renders.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const { left, top } = bubbleBox(bubbleAnchor, maxWidth, window.innerWidth);
        el.style.transform = `translate3d(${left}px, ${top}px, 0) translateY(-100%)`;
        el.style.visibility = bubbleAnchor.visible ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [maxWidth]);

  // Compact mode: bubbles auto-hide after 5 s (docs/02 §2).
  useEffect(() => {
    if (!bubble || mode !== "compact") return;
    const t = window.setTimeout(() => guideStore.set({ bubble: null }), 5000);
    return () => window.clearTimeout(t);
  }, [bubble, mode]);

  if (!bubble) return null;
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-testid="guide-bubble"
      onClick={finish}
      style={{ position: "fixed", left: 0, top: 0, zIndex: 45, width: maxWidth, visibility: "hidden" }}
      className="rounded-[14px] border border-accent-cream bg-surface-light px-4 py-3 pr-8 text-sm leading-snug text-text-primary shadow-card-lg"
    >
      {text}
      <button
        type="button"
        aria-label="Hide guide message"
        onClick={(e) => {
          e.stopPropagation();
          guideStore.set({ bubble: null });
        }}
        className="absolute right-2 top-2 text-text-secondary hover:text-text-primary"
      >
        ×
      </button>
    </div>
  );
}
