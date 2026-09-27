"use client";

import {
  CSSProperties,
  Fragment,
  KeyboardEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaGithub } from "react-icons/fa";
import { HiExternalLink, HiLockClosed } from "react-icons/hi";
import { ScrollReveal } from "../animations/ScrollReveal";
import { timeline, timelineAsOf } from "@/data/timeline";
import { TimelineCategory, TimelineEntry } from "@/types";
import { cn } from "@/lib/utils";

// Geometry: one entry per half wave, crests carry cards above, troughs below.
const SLOT = 150;
const PAD = 260;
const HEIGHT = 700;
const MID = 360;
const AMP = 56;
const GAP = 26;
const CARD_W = 244;
const NOW_W = 212;

const WALNUT = "#3E2723";
const COFFEE = "#8D6E63";
const MUTED = "#6D4C41";
const CARD_BG = "#FEFDFB";

const CATEGORIES: { id: TimelineCategory; label: string; color: string }[] = [
  { id: "education", label: "Education", color: "#A87B1F" },
  { id: "experience", label: "Experience", color: "#3D6B57" },
  { id: "research", label: "Research", color: "#95465A" },
  { id: "project", label: "Projects", color: "#3F5D8C" },
  { id: "award", label: "Awards & papers", color: "#BE4B2E" },
  { id: "milestone", label: "Milestones", color: COFFEE },
];
const COLOR = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.color])) as Record<TimelineCategory, string>;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Slot =
  | { kind: "entry"; entry: TimelineEntry; t: number; te: number | null; x: number; y: number; up: boolean }
  | { kind: "now"; t: number; x: number; y: number; up: boolean };

const monthStart = (s: string) => {
  const [y, m] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, 1);
};
const monthEnd = (s: string) => {
  const [y, m] = s.split("-").map(Number);
  return Date.UTC(y, m, 0);
};
const dayStart = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const fmt = (t: number) => {
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
const pct = (x: number, w: number) => `${((x / w) * 100).toFixed(3)}%`;

const yAt = (x: number) => MID - AMP * Math.cos((Math.PI * (x - PAD)) / SLOT);

function wavePath(x0: number, x1: number) {
  let d = `M${x0.toFixed(1)} ${yAt(x0).toFixed(1)}`;
  for (let x = Math.ceil(x0 / 3) * 3; x < x1; x += 3) d += `L${x} ${yAt(x).toFixed(1)}`;
  return `${d}L${x1.toFixed(1)} ${yAt(x1).toFixed(1)}`;
}

function buildLayout(today: number) {
  const items = timeline.map((entry) => ({ entry, t: monthStart(entry.start) }));
  let nowAt = items.findIndex((it) => it.t > today);
  if (nowAt === -1) nowAt = items.length;

  const ordered: ({ kind: "entry"; entry: TimelineEntry; t: number } | { kind: "now"; t: number })[] = [];
  items.forEach((it, k) => {
    if (k === nowAt) ordered.push({ kind: "now", t: today });
    ordered.push({ kind: "entry", ...it });
  });
  if (nowAt === items.length) ordered.push({ kind: "now", t: today });

  const slots: Slot[] = ordered.map((o, i) => {
    const x = PAD + i * SLOT;
    const up = i % 2 === 0;
    const y = MID + (up ? -AMP : AMP);
    if (o.kind === "now") return { ...o, x, y, up };
    const end = o.entry.end;
    const te = !end ? null : end === "present" ? today : monthEnd(end);
    return { ...o, te, x, y, up };
  });

  const width = PAD * 2 + (slots.length - 1) * SLOT;
  const nowIndex = slots.findIndex((s) => s.kind === "now");

  // Piecewise-linear date → x through each slot's start date.
  const dateToX = (t: number) => {
    if (t <= slots[0].t) return slots[0].x;
    let lo = 0;
    for (let i = 0; i < slots.length; i++) if (slots[i].t <= t) lo = i;
    if (lo === slots.length - 1) return slots[lo].x;
    const a = slots[lo];
    const b = slots[lo + 1];
    return a.x + ((b.x - a.x) * (t - a.t)) / (b.t - a.t);
  };

  const firstYear = new Date(slots[0].t).getUTCFullYear();
  const lastYear = new Date(slots[slots.length - 1].t).getUTCFullYear();
  const years: { year: number; x: number }[] = [];
  for (let y = firstYear + 1; y <= lastYear; y++) years.push({ year: y, x: dateToX(Date.UTC(y, 0, 1)) });

  const running = slots.filter(
    (s): s is Extract<Slot, { kind: "entry" }> =>
      s.kind === "entry" && s.entry.category !== "milestone" && s.t <= today && s.te !== null && s.te >= today
  );

  return { slots, width, nowIndex, dateToX, firstYear, years, running };
}

export const Journey = () => {
  const [today, setToday] = useState(() => dayStart(timelineAsOf));
  const [active, setActive] = useState<number | null>(null);
  const [hot, setHot] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Set<TimelineCategory>>(() => new Set());
  const [miniWidth, setMiniWidth] = useState(1100);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const miniViewRef = useRef<HTMLDivElement>(null);
  const fadeLeftRef = useRef<HTMLDivElement>(null);
  const fadeRightRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);
  const glideRef = useRef(0);
  const syncRef = useRef(0);
  const miniDragRef = useRef(false);
  const reduceRef = useRef(false);

  const layout = useMemo(() => buildLayout(today), [today]);
  const { slots, width, nowIndex, dateToX, firstYear, years, running } = layout;
  const nowSlot = slots[nowIndex];

  const isVisible = (s: Slot) => s.kind === "now" || !hidden.has(s.entry.category);

  useEffect(() => {
    const d = new Date();
    setToday(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Minimap viewport and edge fades follow the scroll position without re-rendering.
  const sync = () => {
    syncRef.current = 0;
    const el = scrollerRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const cw = el.clientWidth;
    const max = el.scrollWidth - cw;
    if (fadeLeftRef.current) fadeLeftRef.current.style.opacity = left > 2 ? "1" : "0";
    if (fadeRightRef.current) fadeRightRef.current.style.opacity = left < max - 2 ? "1" : "0";
    if (miniViewRef.current) {
      miniViewRef.current.style.left = pct(left, width);
      miniViewRef.current.style.width = pct(Math.min(cw, width), width);
    }
  };
  const queueSync = () => {
    if (!syncRef.current) syncRef.current = requestAnimationFrame(sync);
  };

  useEffect(() => {
    sync();
    const mini = miniRef.current;
    if (!mini) return;
    const ro = new ResizeObserver(() => {
      setMiniWidth(mini.clientWidth);
      sync();
    });
    ro.observe(mini);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  // Mouse drag to pan, with a short glide on release. Touch and trackpads scroll natively.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let drag: { x: number; left: number; moved: boolean; lx: number; lt: number; v: number; id: number } | null = null;
    let suppressUntil = 0;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      if ((e.target as Element).closest("a, button")) return;
      cancelAnimationFrame(glideRef.current);
      drag = { x: e.clientX, left: el.scrollLeft, moved: false, lx: e.clientX, lt: performance.now(), v: 0, id: e.pointerId };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) {
        drag.moved = true;
        el.classList.add("cursor-grabbing", "select-none");
        try {
          el.setPointerCapture(drag.id);
        } catch {}
      }
      if (!drag.moved) return;
      el.scrollLeft = drag.left - dx;
      const t = performance.now();
      const dt = t - drag.lt;
      if (dt > 0) drag.v = 0.8 * ((e.clientX - drag.lx) / dt) + 0.2 * drag.v;
      drag.lx = e.clientX;
      drag.lt = t;
    };
    const onUp = () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      el.classList.remove("cursor-grabbing", "select-none");
      if (!d.moved) return;
      suppressUntil = performance.now() + 60;
      if (!reduceRef.current && Math.abs(d.v) > 0.15 && performance.now() - d.lt < 80) {
        let v = d.v * 16;
        const glide = () => {
          el.scrollLeft -= v;
          v *= 0.93;
          if (Math.abs(v) > 0.4) glideRef.current = requestAnimationFrame(glide);
        };
        glideRef.current = requestAnimationFrame(glide);
      }
    };
    // A drag should not also count as a click on the card or link under the pointer.
    const onClickCapture = (e: MouseEvent) => {
      if (performance.now() < suppressUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      el.removeEventListener("click", onClickCapture, true);
      cancelAnimationFrame(glideRef.current);
    };
  }, []);

  const centerOn = (x: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    cancelAnimationFrame(glideRef.current);
    el.scrollTo({ left: x - el.clientWidth / 2, behavior: reduceRef.current ? "auto" : "smooth" });
  };

  const select = (i: number | null, scroll: boolean) => {
    setActive(i);
    if (i === null) return;
    cardRefs.current[i]?.focus({ preventScroll: true });
    if (scroll) centerOn(slots[i].x);
  };

  const step = (dir: 1 | -1) => {
    const vis = slots.map((s, i) => ({ s, i })).filter(({ s }) => isVisible(s));
    if (!vis.length) return;
    let target: { s: Slot; i: number };
    if (active !== null && isVisible(slots[active])) {
      const k = vis.findIndex((v) => v.i === active);
      target = vis[Math.min(vis.length - 1, Math.max(0, k + dir))];
    } else {
      const el = scrollerRef.current;
      const c = el ? el.scrollLeft + el.clientWidth / 2 : 0;
      target =
        dir > 0
          ? vis.find((v) => v.s.x > c + 1) ?? vis[vis.length - 1]
          : [...vis].reverse().find((v) => v.s.x < c - 1) ?? vis[0];
    }
    select(target.i, true);
  };

  const toggleCategory = (id: TimelineCategory) => {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHidden(next);
    const a = active === null ? null : slots[active];
    if (a && a.kind === "entry" && next.has(a.entry.category)) setActive(null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  const miniJump = (e: ReactPointerEvent<HTMLDivElement>) => {
    const mini = miniRef.current;
    const el = scrollerRef.current;
    if (!mini || !el) return;
    const r = mini.getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    cancelAnimationFrame(glideRef.current);
    el.scrollLeft = f * width - el.clientWidth / 2;
  };

  // The wave lights up from an entry's start to its end while it is hovered or selected.
  const spanIndex = hot ?? active;
  const spanSlot = spanIndex === null ? null : slots[spanIndex];
  let span: { d: string; color: string; x: number; y: number } | null = null;
  if (spanSlot && spanSlot.kind === "entry" && spanSlot.te !== null) {
    const xe = dateToX(spanSlot.te);
    if (xe - spanSlot.x >= 4) {
      span = { d: wavePath(spanSlot.x, xe), color: COLOR[spanSlot.entry.category], x: xe, y: yAt(xe) };
    }
  }

  const counts = timeline.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});

  let lastLabel = 36;
  const miniYearVisible = years.map(({ x }) => {
    const px = (x / width) * miniWidth;
    const show = px - lastLabel >= 38;
    if (show) lastLabel = px;
    return show;
  });

  const fadeStop = (PAD * 0.75) / width;
  const todayDate = new Date(today);

  return (
    <section id="journey" className="py-20 bg-background" onKeyDown={onKeyDown}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-text-primary">Journey</h2>
          <div className="w-20 h-1 bg-accent-primary mx-auto mb-6" />
          <p className="max-w-2xl mx-auto text-center text-lg text-text-secondary leading-relaxed text-balance">
            From Mumbai to Hoboken: every role, paper, project, and win on one line, in order.
          </p>
          <p className="mt-3 mb-10 text-center font-mono text-xs text-text-secondary tabular-nums">
            {timeline.length} entries · {fmt(slots[0].t)} → {fmt(slots[slots.length - 1].t)} · {running.length} running
            now
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 mb-4">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Show or hide categories">
              {CATEGORIES.map((c) => {
                const on = !hidden.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleCategory(c.id)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg border border-accent-cream px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent-secondary",
                      on ? "bg-surface-light text-text-primary" : "bg-transparent text-text-secondary/60"
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full border-[1.5px]"
                      style={{ borderColor: c.color, background: on ? c.color : "transparent" }}
                    />
                    {c.label}
                    <span className="font-mono text-[11px] text-text-secondary/70">{counts[c.id] ?? 0}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
              <span className="mr-1 hidden font-mono text-xs text-text-secondary/70 lg:inline">
                Drag or swipe · ← → to step
              </span>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous entry"
                className="flex-1 rounded-lg border-2 border-accent-cream bg-surface-light px-4 py-1.5 text-sm font-medium text-text-primary transition-all hover:border-accent-secondary sm:flex-none"
              >
                ‹ Prev
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next entry"
                className="flex-1 rounded-lg border-2 border-accent-cream bg-surface-light px-4 py-1.5 text-sm font-medium text-text-primary transition-all hover:border-accent-secondary sm:flex-none"
              >
                Next ›
              </button>
              <button
                type="button"
                onClick={() => select(nowIndex, true)}
                className="flex-1 rounded-lg border-2 border-accent-primary bg-accent-primary px-4 py-1.5 text-sm font-medium text-surface-light transition-all hover:bg-accent-hover sm:flex-none"
              >
                Today
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-accent-cream bg-surface shadow-card">
            <div
              ref={fadeLeftRef}
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-surface to-transparent opacity-0 transition-opacity duration-200"
            />
            <div
              ref={fadeRightRef}
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-surface to-transparent transition-opacity duration-200"
            />
            <div
              ref={scrollerRef}
              onScroll={queueSync}
              tabIndex={0}
              role="region"
              aria-label="Timeline, scrolls sideways"
              className="scrollbar-hide cursor-grab overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary"
            >
              <div
                className="relative"
                style={{
                  width,
                  height: HEIGHT,
                  backgroundImage:
                    "linear-gradient(to right, rgba(93,64,55,0.10) 1px, transparent 1px), linear-gradient(to right, rgba(93,64,55,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(93,64,55,0.045) 1px, transparent 1px)",
                  backgroundSize: `${SLOT}px 100%, 30px 100%, 100% 30px`,
                  backgroundPosition: `${PAD}px 0, ${PAD}px 0, 0 ${MID % 30}px`,
                }}
              >
                <svg
                  className="pointer-events-none absolute inset-0 overflow-visible"
                  width={width}
                  height={HEIGHT}
                  viewBox={`0 0 ${width} ${HEIGHT}`}
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="journey-fade" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={width} y2="0">
                      <stop offset="0" stopColor={WALNUT} stopOpacity="0" />
                      <stop offset={fadeStop} stopColor={WALNUT} stopOpacity="1" />
                      <stop offset={1 - fadeStop} stopColor={WALNUT} stopOpacity="1" />
                      <stop offset="1" stopColor={WALNUT} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <line x1="0" x2={width} y1={MID} y2={MID} stroke={COFFEE} strokeDasharray="2 6" opacity="0.45" />
                  <text x="24" y="22" className="font-mono" fontSize="12.5" fill={MUTED}>
                    {firstYear}
                  </text>
                  {years.map(({ year, x }) => (
                    <Fragment key={year}>
                      <line x1={x} x2={x} y1="30" y2={HEIGHT} stroke={COFFEE} strokeDasharray="3 5" opacity="0.5" />
                      <text x={x + 7} y="22" className="font-mono" fontSize="12.5" fill={MUTED}>
                        {year}
                      </text>
                    </Fragment>
                  ))}
                  <line
                    x1={nowSlot.x}
                    x2={nowSlot.x}
                    y1={nowSlot.up ? nowSlot.y + 12 : 30}
                    y2={nowSlot.up ? HEIGHT : nowSlot.y - 12}
                    stroke={WALNUT}
                    strokeDasharray="3 5"
                    opacity="0.4"
                  />

                  <path d={wavePath(0, nowSlot.x)} fill="none" stroke="url(#journey-fade)" strokeWidth="2.25" strokeLinecap="round" />
                  <path
                    d={wavePath(nowSlot.x, width)}
                    fill="none"
                    stroke="url(#journey-fade)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray="1 7"
                  />

                  {span && (
                    <>
                      <path d={span.d} fill="none" stroke={span.color} strokeWidth="10" strokeLinecap="round" opacity="0.3" />
                      <circle cx={span.x} cy={span.y} r="5" fill={CARD_BG} stroke={span.color} strokeWidth="2.5" />
                    </>
                  )}

                  {slots.map((s, i) => {
                    const color = s.kind === "now" ? WALNUT : COLOR[s.entry.category];
                    return (
                      <line
                        key={`c${i}`}
                        x1={s.x}
                        x2={s.x}
                        y1={s.up ? s.y - 8 : s.y + 8}
                        y2={s.up ? s.y - GAP : s.y + GAP}
                        stroke={color}
                        strokeWidth="1.5"
                        opacity={isVisible(s) ? 1 : 0.15}
                      />
                    );
                  })}

                  {slots.map((s, i) => {
                    if (s.kind === "now") {
                      return (
                        <Fragment key="now">
                          <circle
                            cx={s.x}
                            cy={s.y}
                            r="7"
                            fill="none"
                            stroke={WALNUT}
                            strokeWidth="1.5"
                            className="animate-ping motion-reduce:hidden"
                            style={{ transformBox: "fill-box", transformOrigin: "center" }}
                          />
                          <circle cx={s.x} cy={s.y} r="6.5" fill={WALNUT} />
                        </Fragment>
                      );
                    }
                    const color = COLOR[s.entry.category];
                    const lit = spanIndex === i;
                    return (
                      <circle
                        key={s.entry.id}
                        cx={s.x}
                        cy={s.y}
                        r="7"
                        fill={lit ? color : CARD_BG}
                        stroke={color}
                        strokeWidth="3"
                        strokeDasharray={s.t > today ? "3 3" : undefined}
                        opacity={isVisible(s) ? 1 : 0.15}
                        className="cursor-pointer [pointer-events:all]"
                        onMouseEnter={() => setHot(i)}
                        onMouseLeave={() => setHot(null)}
                        onClick={() => select(active === i ? null : i, false)}
                      />
                    );
                  })}
                </svg>

                {slots.map((s, i) => {
                  const w = s.kind === "now" ? NOW_W : CARD_W;
                  const color = s.kind === "now" ? WALNUT : COLOR[s.entry.category];
                  const vis = isVisible(s);
                  const style: CSSProperties & { "--c": string } = {
                    left: s.x - w / 2,
                    width: w,
                    ...(s.up ? { bottom: HEIGHT - (s.y - GAP) } : { top: s.y + GAP }),
                    "--c": color,
                  };
                  const shared = {
                    ref: (el: HTMLElement | null) => {
                      cardRefs.current[i] = el;
                    },
                    tabIndex: vis ? 0 : -1,
                    style,
                    onClick: () => select(active === i ? null : i, false),
                    onMouseEnter: () => setHot(i),
                    onMouseLeave: () => setHot(null),
                    onFocus: () => setHot(i),
                    onBlur: () => setHot(null),
                  };
                  const cardClass = cn(
                    "absolute flex cursor-pointer flex-col gap-[5px] rounded-lg border px-3.5 pb-[13px] pt-3 transition duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:[outline-color:var(--c)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
                    active === i
                      ? "border-transparent bg-surface-light shadow-[0_0_0_2px_var(--c)]"
                      : "border-accent-cream bg-surface-light shadow-card hover:shadow-card-hover",
                    s.t > today && active !== i && "border-dashed bg-surface-light/60 shadow-none",
                    !vis && "pointer-events-none opacity-[0.15]"
                  );

                  if (s.kind === "now") {
                    return (
                      <article key="now" {...shared} className={cardClass} aria-label={`Today: ${running.length} threads running`}>
                        <div className="flex items-center gap-[7px] font-mono text-[10.5px] uppercase leading-tight tracking-[0.06em] text-text-secondary tabular-nums">
                          <span className="h-2 w-2 flex-none rounded-full" style={{ background: WALNUT }} />
                          <span className="font-medium text-text-primary">Today</span>
                          <span>
                            {todayDate.getUTCDate()} {fmt(today)}
                          </span>
                        </div>
                        <h3 className="text-[18px] font-bold leading-tight text-text-primary">
                          {running.length} threads running
                        </h3>
                        <ul className="mt-0.5 grid gap-[3px]">
                          {running.map((r) => (
                            <li key={r.entry.id} className="flex items-center gap-[7px] text-[12.5px] text-text-secondary">
                              <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: COLOR[r.entry.category] }} />
                              {r.entry.short ?? r.entry.title}
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                  }

                  const e = s.entry;
                  return (
                    <article key={e.id} {...shared} className={cardClass}>
                      <div className="flex items-center gap-[7px] font-mono text-[10.5px] uppercase leading-tight tracking-[0.06em] text-text-secondary tabular-nums">
                        <span className="h-2 w-2 flex-none rounded-full" style={{ background: color }} aria-hidden="true" />
                        <span>
                          {fmt(s.t)}
                          {e.end && (
                            <>
                              {" – "}
                              {e.end === "present" ? (
                                <span className="font-medium text-text-primary">Now</span>
                              ) : (
                                fmt(monthStart(e.end))
                              )}
                            </>
                          )}
                        </span>
                        <span className="ml-auto flex items-center gap-2 normal-case tracking-normal">
                          {e.privateRepo && (
                            <span className="flex items-center gap-1 text-text-secondary/80">
                              <HiLockClosed className="h-3 w-3" />
                              Private
                            </span>
                          )}
                          {e.githubRepo && (
                            <a
                              href={`https://github.com/${e.githubRepo}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${e.title} on GitHub`}
                              onClick={(ev) => ev.stopPropagation()}
                              className="text-text-secondary transition-colors hover:text-text-primary"
                            >
                              <FaGithub className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {e.liveUrl && (
                            <a
                              href={e.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${e.title}, live site`}
                              onClick={(ev) => ev.stopPropagation()}
                              className="text-text-secondary transition-colors hover:text-text-primary"
                            >
                              <HiExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          {s.t > today && <span className="text-text-secondary/80">Upcoming</span>}
                        </span>
                      </div>
                      <h3 className="mt-0.5 text-balance text-[16.5px] font-bold leading-[1.2] text-text-primary">{e.title}</h3>
                      <p className="text-[12.5px] font-medium leading-snug text-accent-secondary">{e.org}</p>
                      <p className="mt-px text-[13px] leading-[1.45] text-text-secondary">{e.description}</p>
                      <ul className="mt-[3px] flex flex-wrap gap-1">
                        {e.tags.map((tag) => (
                          <li
                            key={tag}
                            className="whitespace-nowrap rounded px-1.5 py-1 font-mono text-[10.5px] leading-none text-text-primary"
                            style={{ background: `${color}1F` }}
                          >
                            {tag}
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            ref={miniRef}
            aria-hidden="true"
            className="relative mt-3 h-[46px] cursor-pointer touch-none select-none"
            onPointerDown={(e) => {
              miniDragRef.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              miniJump(e);
            }}
            onPointerMove={(e) => miniDragRef.current && miniJump(e)}
            onPointerUp={() => (miniDragRef.current = false)}
            onPointerCancel={() => (miniDragRef.current = false)}
          >
            <div className="absolute inset-x-0 top-2 h-3.5 rounded-[5px] border border-accent-cream bg-surface" />
            <span className="absolute left-0 top-[29px] font-mono text-[11px] leading-none text-text-secondary">{firstYear}</span>
            {years.map(({ year, x }, k) => (
              <Fragment key={year}>
                <span className="absolute top-1 h-[22px] border-l border-accent-secondary/50" style={{ left: pct(x, width) }} />
                <span
                  className="absolute top-[29px] ml-1 font-mono text-[11px] leading-none text-text-secondary"
                  style={{ left: pct(x, width), visibility: miniYearVisible[k] ? "visible" : "hidden" }}
                >
                  {year}
                </span>
              </Fragment>
            ))}
            {slots.map((s, i) =>
              s.kind === "now" ? (
                <span
                  key="now"
                  className="absolute top-1 h-[22px] border-l-[1.5px] border-dashed border-text-primary"
                  style={{ left: pct(s.x, width) }}
                />
              ) : (
                <span
                  key={s.entry.id}
                  className="absolute top-3 -ml-[3px] h-1.5 w-1.5 rounded-full transition-opacity"
                  style={{ left: pct(s.x, width), background: COLOR[s.entry.category], opacity: isVisible(s) ? 1 : 0.15 }}
                  data-i={i}
                />
              )
            )}
            <div
              ref={miniViewRef}
              className="absolute top-1 h-[22px] rounded-[5px] border-[1.5px] border-text-primary bg-text-primary/[0.07]"
            />
          </div>

          <p className="mt-2 text-center text-xs text-text-secondary/80">
            Entries are evenly spaced, so busy years take more room. Hover or tap one to see how long it ran.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
};
