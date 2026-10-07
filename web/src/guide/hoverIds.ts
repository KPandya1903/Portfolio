/** Hover ids (`data-guide-hover`): the markup and the lines in config.ts derive them the same way. */
export const projectHoverId = (id: string) => `project-${id}`;
export const experienceHoverId = (id: string) => `exp-${id}`;
export const journeyHoverId = (id: string) => `journey-${id}`;
export const skillHoverId = (category: string) => `skills-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
