"use client";
import { useEffect } from "react";
import { STAGE_MIN_DWELL_MS, stopFor } from "./config";
import { stageDurationMs } from "./stageRules";
import { guideStore, useGuide, type GuideStore } from "./store";

/**
 * The only place stage timers live. A section that stays active for STAGE_MIN_DWELL_MS is staged if the
 * rules allow; the stage ends after the line's typing time plus the hold (capped). Timers are cleared
 * on every dependency change and on unmount, so a section change can never leave a stale stage.
 */
export function useStage(store: GuideStore = guideStore) {
  const section = useGuide((s) => s.section, store);
  const intro = useGuide((s) => s.intro, store);
  const mode = useGuide((s) => s.mode, store);
  const reducedMotion = useGuide((s) => s.reducedMotion, store);
  const modelReady = useGuide((s) => s.modelReady, store);
  const stage = useGuide((s) => s.stage, store);
  const staging = stage !== null;

  // Start: wait out the dwell, then let the rules decide. The firing timer is itself the proof of dwell (Date.now can lag
  // it), and a section that does not stage says its line from the corner so the line is never lost.
  useEffect(() => {
    if (!section) return;
    const t = window.setTimeout(() => {
      if (store.canStage(section, { dwellMs: STAGE_MIN_DWELL_MS })) store.startStage(section);
      else store.skipStage(section);
    }, Math.max(0, STAGE_MIN_DWELL_MS - store.dwellMs()));
    return () => window.clearTimeout(t);
  }, [store, section, intro, mode, reducedMotion, modelReady, staging]);

  // Compact mode or reduced motion switching on mid-stage ends it (the robot walks back).
  useEffect(() => {
    if (staging && (mode === "compact" || reducedMotion)) store.endStage();
  }, [store, staging, mode, reducedMotion]);

  // End: typing + hold, capped.
  const stageId = stage?.sectionId ?? null;
  useEffect(() => {
    if (!stageId) return;
    const t = window.setTimeout(() => store.endStage(), stageDurationMs(stopFor(stageId).line?.length ?? 0));
    return () => window.clearTimeout(t);
  }, [store, stageId]);

  useEffect(() => {
    if (stageId) document.documentElement.dataset.guideStage = stageId;
    else delete document.documentElement.dataset.guideStage;
  }, [stageId]);

  useEffect(
    () => () => {
      delete document.documentElement.dataset.guideStage;
      store.endStage();
    },
    [store],
  );
}
