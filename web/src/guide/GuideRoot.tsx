"use client";
import { useEffect } from "react";
import { SECTION_IDS } from "./config";
import { GuideCanvas } from "./GuideCanvas";
import { GuideDebug } from "./GuideDebug";
import { shouldShowDebug } from "./shouldShowDebug";
import { SpeechBubble } from "./SpeechBubble";
import { useGuide } from "./store";
import { useActiveSection } from "./useActiveSection";
import { useGuideEnvironment } from "./useGuideEnvironment";
import { useIntroSequence } from "./useIntroSequence";

export default function GuideRoot() {
  useGuideEnvironment();
  useActiveSection(SECTION_IDS);
  useIntroSequence();

  const section = useGuide((s) => s.section);
  useEffect(() => {
    if (section) document.documentElement.dataset.guideSection = section;
  }, [section]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.guideIntro;
      delete document.documentElement.dataset.guideSection;
    },
    [],
  );

  return (
    <>
      <GuideCanvas />
      <SpeechBubble />
      {process.env.NODE_ENV !== "production" &&
        shouldShowDebug(process.env.NODE_ENV, window.location.search) && <GuideDebug />}
    </>
  );
}
