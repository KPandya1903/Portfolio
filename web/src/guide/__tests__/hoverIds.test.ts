import { describe, expect, it } from "vitest";
import { experienceHoverId, journeyHoverId, projectHoverId, skillHoverId } from "../hoverIds";

describe("hover ids", () => {
  it("prefixes data ids", () => {
    expect(projectHoverId("nexusmesh")).toBe("project-nexusmesh");
    expect(experienceHoverId("fini")).toBe("exp-fini");
    expect(journeyHoverId("btech")).toBe("journey-btech");
  });
  it("slugs skill categories", () => {
    expect(skillHoverId("Languages")).toBe("skills-languages");
    expect(skillHoverId("Distributed Systems & Backend")).toBe("skills-distributed-systems-backend");
    expect(skillHoverId("AI / ML")).toBe("skills-ai-ml");
  });
});
