import { describe, expect, it } from "vitest";
import { GUIDE_STOPS, HOVER_COOLDOWN_MS, HOVER_DWELL_MS, HOVER_LEAVE_MS, HOVER_LINES, INTRO, MODEL, SECTION_IDS, stopFor } from "../config";
import { experienceHoverId, journeyHoverId, projectHoverId, skillHoverId } from "../hoverIds";
import { siteMetadata } from "@/data/metadata";
import { experiences } from "@/data/experience";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { timeline } from "@/data/timeline";

const corpus = JSON.stringify({ siteMetadata, experiences, projects, skills, timeline });
const numbersIn = (s: string) => s.match(/\d+(?:[.,]\d+)*(?:K\+|\+|%)?/g) ?? [];

describe("guide config", () => {
  it("has exactly one stop per guided section, in page order", () => {
    expect(GUIDE_STOPS.map((s) => s.id)).toEqual(SECTION_IDS.filter((id) => id !== "linkedin"));
  });

  it("keeps lines short", () => {
    expect(INTRO.line.length).toBeLessThanOrEqual(160);
    for (const s of GUIDE_STOPS) expect(s.line?.length ?? 0).toBeLessThanOrEqual(140);
  });

  it("only uses numbers that already appear in the site's data", () => {
    for (const line of [INTRO.line, ...GUIDE_STOPS.map((s) => s.line ?? "")]) {
      for (const n of numbersIn(line)) expect(corpus, `"${n}" in "${line}"`).toContain(n);
    }
  });

  it("maps every logical clip", () => {
    for (const c of ["Wave", "Talk", "Point", "Idle", "Travel", "ThumbsUp"] as const) {
      expect(MODEL.clipMap[c]).toBeTruthy();
    }
  });

  it("falls back to the nearest earlier stop for sections without one", () => {
    expect(stopFor(null).id).toBe("hero");
    expect(stopFor("linkedin").id).toBe("projects");
    expect(stopFor("skills").id).toBe("skills");
  });

  describe("hover lines", () => {
    const realIds = new Set([
      ...projects.map((p) => projectHoverId(p.id)),
      ...skills.map((s) => skillHoverId(s.category)),
      ...experiences.map((e) => experienceHoverId(e.id)),
      ...timeline.map((t) => journeyHoverId(t.id)),
    ]);

    it("has the specified timings", () => {
      expect([HOVER_DWELL_MS, HOVER_COOLDOWN_MS, HOVER_LEAVE_MS]).toEqual([350, 6000, 800]);
    });

    it("keeps every line to 120 characters", () => {
      for (const [id, line] of Object.entries(HOVER_LINES)) expect(line.length, id).toBeLessThanOrEqual(120);
    });

    it("only uses numbers that already appear in the site's data", () => {
      for (const [id, line] of Object.entries(HOVER_LINES)) {
        for (const n of numbersIn(line)) expect(corpus, `"${n}" in ${id}`).toContain(n);
      }
    });

    it("has no stale keys: every id matches a real project, skill group, experience or timeline entry", () => {
      for (const id of Object.keys(HOVER_LINES)) expect(realIds.has(id), id).toBe(true);
    });

    it("has a line for every project, skill group and experience", () => {
      for (const id of [
        ...projects.map((p) => projectHoverId(p.id)),
        ...skills.map((s) => skillHoverId(s.category)),
        ...experiences.map((e) => experienceHoverId(e.id)),
      ]) {
        expect(HOVER_LINES[id], id).toBeTruthy();
      }
    });

    it("keeps the private project private: no link, never called public", () => {
      const line = HOVER_LINES[projectHoverId("edara")];
      expect(line).toMatch(/private/i);
      expect(line).not.toMatch(/public|github|http/i);
    });
  });
});
