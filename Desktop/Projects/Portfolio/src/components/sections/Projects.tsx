import { ScrollReveal } from "../animations/ScrollReveal";
import { ProjectCard } from "../ui/ProjectCard";
import { projects } from "@/data/projects";

export const Projects = () => {
  return (
    <section id="projects" className="py-20 bg-background dark:bg-background-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-text-primary dark:text-text-primary-dark">
            Featured <span className="text-accent-primary dark:text-accent-secondary">Projects</span>
          </h2>
          <div className="w-20 h-1 bg-accent-primary dark:bg-accent-secondary mx-auto mb-4" />
          <p className="text-center text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto mb-16">
            A selection of projects demonstrating expertise in distributed systems,
            AI/ML, and scalable backend architecture
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 lg:gap-8">
          {projects.map((project, index) => (
            <ScrollReveal key={project.id} delay={0.1 * (index + 1)}>
              <ProjectCard project={project} />
            </ScrollReveal>
          ))}
        </div>

        {/* GitHub Link */}
        <ScrollReveal delay={0.6}>
          <div className="text-center mt-12">
            <a
              href="https://github.com/kpandya1903"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent-primary dark:text-accent-secondary hover:text-accent-hover dark:hover:text-accent-cream transition-colors font-medium"
            >
              View More Projects on GitHub →
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
