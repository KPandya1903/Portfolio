"use client";

import React, { useRef, useState } from "react";
import { Project } from "@/types";
import { SkillBadge } from "./SkillBadge";
import { FaGithub } from "react-icons/fa";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, className }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -10;
    const rotateYValue = ((x - centerX) / centerX) * 10;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: "transform 0.1s ease-out",
      }}
      className={`group relative bg-surface-light dark:bg-surface-dark rounded-xl p-8 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col h-full border border-accent-cream dark:border-accent-cream/20 ${className}`}
    >
      {/* Category Badge */}
      <div className="mb-4">
        <span className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark bg-surface dark:bg-background-dark px-3 py-1 rounded-full">
          {project.category}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark mb-3">
        {project.title}
      </h3>

      {/* Date */}
      <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-4">{project.date}</p>

      {/* Description */}
      <p className="text-text-secondary dark:text-text-secondary-dark mb-4 leading-relaxed">
        {project.description}
      </p>

      {/* Impact Highlight */}
      <div className="mb-6 p-4 bg-surface dark:bg-background-dark rounded-lg border border-accent-cream dark:border-accent-cream/20">
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
          <span className="font-semibold text-accent-primary dark:text-accent-secondary">Impact:</span> {project.impact}
        </p>
      </div>

      {/* Tech Stack */}
      <div className="flex flex-wrap gap-2 mb-6">
        {project.tech.slice(0, 5).map((tech) => (
          <SkillBadge key={tech} skill={tech} />
        ))}
        {project.tech.length > 5 && (
          <span className="text-xs text-text-secondary dark:text-text-secondary-dark self-center">
            +{project.tech.length - 5} more
          </span>
        )}
      </div>

      {/* GitHub Link */}
      <div className="mt-auto pt-4 border-t border-accent-cream dark:border-accent-cream/20">
        {project.githubRepo && (
          <a
            href={`https://github.com/${project.githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent-primary dark:text-accent-secondary hover:text-accent-hover dark:hover:text-accent-cream transition-colors"
          >
            <FaGithub className="w-4 h-4" />
            View on GitHub
          </a>
        )}
      </div>
    </div>
  );
};
