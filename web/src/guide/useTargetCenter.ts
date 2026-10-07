import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

export interface TargetCenter {
  /** Centre of the tracked element in CSS px, or null. Read it in the frame loop; no layout reads needed. */
  center: MutableRefObject<{ x: number; y: number } | null>;
  /** Track an element (measured now, then on scroll/resize, at most once per frame); null stops tracking. */
  track: (el: Element | null) => void;
  /** Re-measure the tracked element now (e.g. on arrival, once the avatar has settled). */
  refresh: () => void;
}

/** Caches the pointing target's centre (docs/04 §5): scroll is passive and rAF-throttled, resize re-measures. */
export function useTargetCenter(): TargetCenter {
  const center = useRef<{ x: number; y: number } | null>(null);
  const el = useRef<Element | null>(null);
  const held = useRef({ x: 0, y: 0 }); // mutated on re-measure so no object is allocated per measure

  const measure = useCallback(() => {
    if (!el.current || !el.current.isConnected) {
      center.current = null;
      return;
    }
    const r = el.current.getBoundingClientRect();
    held.current.x = r.left + r.width / 2;
    held.current.y = r.top + r.height / 2;
    center.current = held.current;
  }, []);

  const track = useCallback(
    (next: Element | null) => {
      el.current = next;
      measure();
    },
    [measure],
  );

  useEffect(() => {
    let raf = 0;
    const schedule = () => {
      if (raf || !el.current) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (el.current) measure();
      });
    };
    // Capture: scroll does not bubble, so this is how an inner scroller (the Journey strip) re-measures too.
    window.addEventListener("scroll", schedule, { passive: true, capture: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [measure]);

  return { center, track, refresh: measure };
}
