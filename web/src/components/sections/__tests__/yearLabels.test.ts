import { describe, expect, it } from "vitest";
import { visibleYearLabels } from "../yearLabels";

// Behaviour of the live site's minimap loop (Journey.tsx): the first label needs 74 px from the left
// edge (36 + 38), and each shown label needs 38 px from the previous shown one.
describe("visibleYearLabels", () => {
  it("keeps labels 38 px apart on the minimap", () => {
    // timeline 1000 wide, minimap 200 wide → minimap px = [0, 20, 60, 100, 104, 200]
    expect(visibleYearLabels([0, 100, 300, 500, 520, 1000], 1000, 200)).toEqual([false, false, false, true, false, true]);
  });

  it("shows a label exactly 38 px after the previous one", () => {
    expect(visibleYearLabels([74, 112], 100, 100)).toEqual([true, true]);
  });

  it("returns nothing for no years", () => {
    expect(visibleYearLabels([], 1000, 200)).toEqual([]);
  });
});
