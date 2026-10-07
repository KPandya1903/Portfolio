import { useCallback, useEffect, useRef } from "react";
import { POINTER_IDLE_MS } from "./config";

export interface PointerState {
  /** Last mouse position in viewport px. */
  x: number;
  y: number;
  /** Date.now() of the last mouse move; 0 before any. */
  lastMove: number;
}

/** Tracks the mouse for the frame loop: ref-only, no React state per move; touch and pen are ignored. */
export function usePointer() {
  const pointer = useRef<PointerState>({ x: 0, y: 0, lastMove: 0 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const p = pointer.current;
      p.x = e.clientX;
      p.y = e.clientY;
      p.lastMove = Date.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /** True while the mouse moved within POINTER_IDLE_MS of `now`. */
  const isActive = useCallback((now: number) => pointer.current.lastMove > 0 && now - pointer.current.lastMove < POINTER_IDLE_MS, []);

  return { pointer, isActive };
}
