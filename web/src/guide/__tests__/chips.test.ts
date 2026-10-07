import { describe, expect, it } from "vitest";
import { CHIPS, RESUME_URL } from "../config";
import { chipAction } from "../chips";

const wide = { reducedMotion: false, mode: "wide" } as const;

describe("CHIPS", () => {
  it("lists the five quick jumps; every section target has a stop", () => {
    expect(CHIPS.map((c) => c.label)).toEqual(["Resume", "Projects", "Experience", "Skills", "Contact"]);
    expect(RESUME_URL).toBe("/Kunj_Pandya_Resume.pdf");
  });
});

describe("chipAction", () => {
  it("opens the resume PDF", () => {
    expect(chipAction("resume", wide)).toEqual({ type: "open", url: "/Kunj_Pandya_Resume.pdf" });
  });
  it("scrolls smoothly to a section and forces its stage on wide screens", () => {
    expect(chipAction("skills", wide)).toEqual({ type: "scroll", id: "skills", behavior: "smooth", forceStage: true });
  });
  it("scrolls instantly under reduced motion, and never forces a stage", () => {
    expect(chipAction("skills", { reducedMotion: true, mode: "wide" })).toEqual({ type: "scroll", id: "skills", behavior: "auto", forceStage: false });
  });
  it("only scrolls on compact screens (no stage there)", () => {
    expect(chipAction("projects", { reducedMotion: false, mode: "compact" })).toEqual({ type: "scroll", id: "projects", behavior: "smooth", forceStage: false });
  });
});
