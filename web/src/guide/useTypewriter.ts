"use client";
import { useEffect, useState } from "react";

/** Reveals `full` at `cps` characters per second; a new `key` restarts it. cps = Infinity shows it at once (R3.1); cps <= 0 freezes it where it is. */
export function useTypewriter(full: string, key: number, cps: number) {
  // Progress is tagged with its key, so a new key reads as 0 during render instead of resetting in an effect.
  const [progress, setProgress] = useState({ key, count: 0 });
  const instant = !Number.isFinite(cps);
  const count = instant ? full.length : progress.key === key ? progress.count : 0;

  useEffect(() => {
    if (instant || cps <= 0) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const c = p.key === key ? p.count : 0;
        if (c >= full.length) {
          window.clearInterval(id);
          return p;
        }
        return { key, count: c + 1 };
      });
    }, 1000 / cps);
    return () => window.clearInterval(id);
  }, [full, key, cps, instant]);

  return { text: full.slice(0, count), finish: () => setProgress({ key, count: full.length }) };
}
