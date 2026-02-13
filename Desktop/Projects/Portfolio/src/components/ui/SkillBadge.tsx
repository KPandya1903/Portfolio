import React from "react";

interface SkillBadgeProps {
  skill: string;
  className?: string;
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, className }) => {
  return (
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full bg-surface dark:bg-surface-dark text-text-secondary dark:text-text-secondary-dark hover:bg-accent-cream dark:hover:bg-accent-cream/10 transition-colors border border-accent-cream dark:border-accent-cream/20 ${className}`}
    >
      {skill}
    </span>
  );
};
