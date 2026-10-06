const timers = new WeakMap<Element, number>();

/** Flash the guide's highlight ring on a target for 1.6 s (docs/02 §5). */
export function flashHighlight(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  const previous = timers.get(el);
  if (previous) window.clearTimeout(previous);
  el.classList.add("guide-highlight");
  timers.set(
    el,
    window.setTimeout(() => {
      el.classList.remove("guide-highlight");
      timers.delete(el);
    }, 1600),
  );
}
