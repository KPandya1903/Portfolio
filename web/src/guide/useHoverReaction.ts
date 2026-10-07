"use client";
import { useEffect, useRef } from "react";
import { HOVER_DWELL_MS, HOVER_LEAVE_MS } from "./config";
import { hoverGaze } from "./hoverGaze";
import { hoverAllowed, INITIAL_HOVER, nextHover, type HoverEvent, type HoverState } from "./hoverRules";
import { guideStore, useGuide, type GuideStore } from "./store";
import { useTargetCenter } from "./useTargetCenter";

const marked = (t: EventTarget | null) => (t instanceof Element ? (t.closest("[data-guide-hover]") as HTMLElement | null) : null);

/**
 * Hover reactions: delegated pointerover/pointerout on `document` for elements marked `data-guide-hover`, mouse only.
 * The rules live in hoverRules (pure); this owns the dwell and leave timers, the measurement and the store writes.
 * The hovered element's centre is published through `hoverGaze` for the avatar's frame loop.
 */
export function useHoverReaction(store: GuideStore = guideStore) {
  const { center, track } = useTargetCenter();
  const section = useGuide((s) => s.section, store);
  const staging = useGuide((s) => s.stage !== null, store);
  const allowed = useGuide((s) => hoverAllowed({ intro: s.intro, staging: s.stage !== null, mode: s.mode, reducedMotion: s.reducedMotion }), store);

  const state = useRef<HoverState>(INITIAL_HOVER);
  const el = useRef<HTMLElement | null>(null);
  const dwellTimer = useRef(0);
  const leaveTimer = useRef(0);
  // Both are wired up in the effect below; the section/stage/allowed effect calls them through refs.
  const stop = useRef<() => void>(() => {});

  useEffect(() => {
    const clearTimers = () => {
      window.clearTimeout(dwellTimer.current);
      window.clearTimeout(leaveTimer.current);
      dwellTimer.current = leaveTimer.current = 0;
    };
    const apply = (event: HoverEvent) => {
      const r = nextHover(state.current, event, Date.now());
      state.current = r.state;
      if (r.say) store.say(r.say);
      if (r.lookId === undefined) return;
      if (r.lookId === null) {
        track(null);
        store.set({ hover: null });
      } else {
        track(el.current);
        store.set({ hover: { id: r.lookId } });
      }
    };
    const ctx = () => {
      const s = store.getState();
      return { intro: s.intro, staging: s.stage !== null, mode: s.mode, reducedMotion: s.reducedMotion };
    };
    const reset = () => {
      clearTimers();
      apply({ type: "reset" });
    };
    stop.current = reset;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = marked(e.target);
      const id = target?.dataset.guideHover;
      if (!target || !id || state.current.hoverId === id) return;
      clearTimers();
      el.current = target;
      apply({ type: "enter", id, ctx: ctx() });
      if (state.current.hoverId !== id) return; // refused (intro, stage, compact, reduced motion)
      dwellTimer.current = window.setTimeout(() => {
        dwellTimer.current = 0;
        apply({ type: "dwell-complete", id, ctx: ctx() });
      }, HOVER_DWELL_MS);
    };
    const onOut = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = marked(e.target);
      const id = target?.dataset.guideHover;
      if (!target || !id || state.current.hoverId !== id) return;
      if (e.relatedTarget instanceof Node && target.contains(e.relatedTarget)) return;
      window.clearTimeout(dwellTimer.current);
      apply({ type: "leave", id });
      leaveTimer.current = window.setTimeout(() => {
        leaveTimer.current = 0;
        apply({ type: "leave-complete" });
      }, HOVER_LEAVE_MS);
    };

    hoverGaze.center = center;
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      reset();
      stop.current = () => {};
      track(null);
      store.set({ hover: null });
      hoverGaze.center = { current: null };
    };
  }, [store, center, track]);

  // A section change, a stage, or hover becoming disallowed ends any look and any pending timer.
  useEffect(() => {
    stop.current();
  }, [section, staging, allowed]);
}
