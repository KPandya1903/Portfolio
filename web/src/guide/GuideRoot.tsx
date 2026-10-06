"use client";
import { Component, useEffect, type ReactNode } from "react";
import { SECTION_IDS } from "./config";
import { GuideCanvas } from "./GuideCanvas";
import { SpeechBubble } from "./SpeechBubble";
import { guideStore, useGuide } from "./store";
import { useActiveSection } from "./useActiveSection";
import { useGuideEnvironment } from "./useGuideEnvironment";
import { useIntroSequence } from "./useIntroSequence";

/** A failed GLB load or WebGL error removes the guide quietly (docs/04 §8). */
class GuideErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    guideStore.dispatchIntro("LOAD_TIMEOUT");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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
    <GuideErrorBoundary>
      <GuideCanvas />
      <SpeechBubble />
    </GuideErrorBoundary>
  );
}
