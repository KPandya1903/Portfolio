const RING_MS = 1600;
const timers = new WeakMap<Element, number>();

/** Flash the guide's highlight ring on a target for 1.6 s (docs/02 §5). */
export function flashHighlight(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  window.clearTimeout(timers.get(el));
  el.classList.add("guide-highlight");
  timers.set(
    el,
    window.setTimeout(() => el.classList.remove("guide-highlight"), RING_MS),
  );
}
