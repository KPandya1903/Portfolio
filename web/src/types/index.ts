export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  problem: string;
  solution: string;
  impact: string;
  tech: string[];
  githubRepo?: string;
  liveUrl?: string;
  privateRepo?: boolean;
  highlights: string[];
  date: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  tech: string[];
  current: boolean;
}

export interface Education {
  id: string;
  degree: string;
  field: string;
  institution: string;
  location: string;
  period: string;
  coursework?: string[];
}

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  date: string;
}

export type TimelineCategory =
  | "education"
  | "experience"
  | "research"
  | "project"
  | "award"
  | "milestone";

export interface TimelineEntry {
  id: string;
  category: TimelineCategory;
  start: string; // "YYYY-MM"
  end?: string; // "YYYY-MM" or "present"
  title: string;
  org: string;
  description: string;
  tags: string[];
  githubRepo?: string;
  liveUrl?: string;
  privateRepo?: boolean;
  short?: string; // name shown in the "today" card while the entry is running
}

export interface SkillCategory {
  category: string;
  skills: string[];
}

export interface GitHubRepo {
  name: string;
  stars: number;
  forks: number;
  language: string;
  languageColor?: string;
}

export interface ContactLink {
  label: string;
  url: string;
  icon: string;
}
