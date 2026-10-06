import { describe, expect, it } from "vitest";
import { GUIDE_STOPS, INTRO, MODEL, SECTION_IDS, stopFor } from "../config";
import { siteMetadata } from "@/data/metadata";
import { experiences } from "@/data/experience";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";

const corpus = JSON.stringify({ siteMetadata, experiences, projects, skills });
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
});
