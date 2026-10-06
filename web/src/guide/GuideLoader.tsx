"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { primeGuideState } from "./environment";
import { useGuide } from "./store";

// ssr:false must live in a client component (Next 16 lazy-loading guide).
const GuideRoot = dynamic(() => import("./GuideRoot"), { ssr: false });

/** Loads the 3D guide after the page is idle, so it never delays first paint (docs/04 §1). */
export function GuideLoader() {
  const enabled = useGuide((s) => s.enabled);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    primeGuideState();
    // typeof, not `in`: lib.dom always declares requestIdleCallback, so `in` would narrow the else branch to never.
    // Safari still lacks it at runtime.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  return idle && enabled ? <GuideRoot /> : null;
}
