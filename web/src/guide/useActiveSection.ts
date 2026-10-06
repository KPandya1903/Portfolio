"use client";
import { useEffect } from "react";
import { guideStore } from "./store";

/** The section crossing a 10% band through the viewport's middle is active (docs/04 §5; event-driven R2.3). */
export function useActiveSection(ids: readonly string[]) {
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) guideStore.setSection(entry.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
}
