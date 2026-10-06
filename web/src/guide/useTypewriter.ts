"use client";
import { useEffect, useState } from "react";

/** Reveals `full` at `cps` characters per second; a new `key` restarts it. cps = Infinity shows it at once (R3.1). */
export function useTypewriter(full: string, key: number, cps: number) {
  const [progress, setProgress] = useState({ key, count: 0 });
  const count = progress.key === key ? progress.count : 0;

  useEffect(() => {
    if (!Number.isFinite(cps)) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const c = p.key === key ? p.count : 0;
        if (c >= full.length) {
          window.clearInterval(id);
          return { key, count: c };
        }
        return { key, count: c + 1 };
      });
    }, 1000 / cps);
    return () => window.clearInterval(id);
  }, [full, key, cps]);

  const shown = Number.isFinite(cps) ? count : full.length;
  return { text: full.slice(0, shown), finish: () => setProgress({ key, count: full.length }) };
}
