const FIRST_LABEL_OFFSET = 36;
const MIN_LABEL_GAP = 38;

/** Which year labels fit on the Journey minimap without overlapping (pure; extracted from Journey.tsx). */
export function visibleYearLabels(xs: number[], width: number, miniWidth: number): boolean[] {
  let last = FIRST_LABEL_OFFSET;
  return xs.map((x) => {
    const px = (x / width) * miniWidth;
    const show = px - last >= MIN_LABEL_GAP;
    if (show) last = px;
    return show;
  });
}
