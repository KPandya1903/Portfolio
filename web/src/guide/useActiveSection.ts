"use client";
import { useEffect } from "react";
import { guideStore, type GuideStore } from "./store";

/** The section crossing a 10% band through the viewport's middle is active (docs/04 §5; event-driven R2.3). */
export function useActiveSection(ids: readonly string[], store: GuideStore = guideStore) {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) store.setSection(entry.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids, store]);
}
