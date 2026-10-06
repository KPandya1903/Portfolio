"use client";
import { useEffect, useState } from "react";
import { SECTION_IDS } from "./config";
import { GuideCanvas } from "./GuideCanvas";
import { GuideDebug } from "./GuideDebug";
import { shouldShowDebug } from "./shouldShowDebug";
import { SpeechBubble } from "./SpeechBubble";
import { guideStore, useGuide } from "./store";
import { useActiveSection } from "./useActiveSection";
import { useGuideEnvironment } from "./useGuideEnvironment";
import { useIntroSequence } from "./useIntroSequence";

export default function GuideRoot() {
  useGuideEnvironment();
  useActiveSection(SECTION_IDS);
  useIntroSequence();

  // Read once. Touching window here is safe only because GuideRoot is client-only (loaded with ssr:false).
  // The literal NODE_ENV check is required for dead-code elimination in production; do not move it
  // into shouldShowDebug or a shared constant.
  const [showDebug] = useState(
    () => process.env.NODE_ENV !== "production" && shouldShowDebug(process.env.NODE_ENV, window.location.search),
  );

  const section = useGuide((s) => s.section);
  useEffect(() => {
    if (section) document.documentElement.dataset.guideSection = section;
  }, [section]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.guideIntro;
      delete document.documentElement.dataset.guideSection;
      // Covers toggle-off and failure: re-enabling must not re-type or re-announce the old line.
      guideStore.set({ bubble: null });
    },
    [],
  );

  return (
    <>
      <GuideCanvas />
      <SpeechBubble />
      {process.env.NODE_ENV !== "production" && showDebug && <GuideDebug />}
    </>
  );
}
