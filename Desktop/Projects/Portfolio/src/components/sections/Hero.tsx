"use client";

import { FadeIn } from "../animations/FadeIn";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { siteMetadata } from "@/data/metadata";

export const Hero = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 bg-background dark:bg-background-dark">
      <div className="max-w-4xl mx-auto w-full">
        {/* Main Card */}
        <FadeIn delay={0.2}>
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-card-lg p-12 text-center border border-accent-cream dark:border-accent-cream/20">
            {/* Profile Info */}
            <div className="mb-8">
              <h1 className="text-5xl sm:text-6xl font-bold text-text-primary dark:text-text-primary-dark mb-4">
                {siteMetadata.name}
              </h1>
              <p className="text-xl text-text-secondary dark:text-text-secondary-dark mb-2">
                {siteMetadata.title}
              </p>
              <p className="text-text-secondary dark:text-text-secondary-dark">
                📍 {siteMetadata.location}
              </p>
            </div>

            {/* Bio */}
            <div className="max-w-2xl mx-auto mb-10">
              <p className="text-text-secondary dark:text-text-secondary-dark leading-relaxed">
                Building scalable backend systems and intelligent applications.
                From distributed task orchestrators to AI-powered platforms,
                I turn ideas into production-ready solutions that scale.
              </p>
            </div>

            {/* Stats/Highlights */}
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-10 pb-10 border-b border-accent-cream dark:border-accent-cream/20">
              <div>
                <div className="text-2xl font-bold text-accent-primary dark:text-accent-secondary">10K+</div>
                <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Tasks/Day Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-primary dark:text-accent-secondary">500+</div>
                <div className="text-sm text-text-secondary dark:text-text-secondary-dark">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-accent-primary dark:text-accent-secondary">94%</div>
                <div className="text-sm text-text-secondary dark:text-text-secondary-dark">ML Accuracy</div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
              <button
                onClick={() => scrollToSection("projects")}
                className="px-8 py-3 bg-accent-primary dark:bg-accent-secondary text-surface-light dark:text-background-dark rounded-lg font-medium hover:bg-accent-hover dark:hover:bg-accent-cream transition-all hover:shadow-card-hover"
              >
                View Projects
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className="px-8 py-3 bg-surface-light dark:bg-surface-dark border-2 border-accent-cream dark:border-accent-cream/30 text-text-primary dark:text-text-primary-dark rounded-lg font-medium hover:border-accent-secondary dark:hover:border-accent-secondary hover:shadow-card transition-all"
              >
                Get in Touch
              </button>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-surface-light dark:bg-surface-dark border-2 border-accent-cream dark:border-accent-cream/30 text-text-primary dark:text-text-primary-dark rounded-lg font-medium hover:border-accent-secondary dark:hover:border-accent-secondary hover:shadow-card transition-all"
              >
                Resume
              </a>
            </div>

            {/* Social Links */}
            <div className="flex gap-4 justify-center pt-6 border-t border-accent-cream dark:border-accent-cream/20">
              <a
                href={siteMetadata.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full hover:bg-surface dark:hover:bg-background-dark transition-all"
                aria-label="GitHub"
              >
                <FaGithub className="w-5 h-5 text-text-primary dark:text-text-primary-dark" />
              </a>
              <a
                href={siteMetadata.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-full hover:bg-surface dark:hover:bg-background-dark transition-all"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="w-5 h-5 text-text-primary dark:text-text-primary-dark" />
              </a>
              <a
                href={`mailto:${siteMetadata.email}`}
                className="p-3 rounded-full hover:bg-surface dark:hover:bg-background-dark transition-all"
                aria-label="Email"
              >
                <FaEnvelope className="w-5 h-5 text-text-primary dark:text-text-primary-dark" />
              </a>
            </div>
          </div>
        </FadeIn>

        {/* Scroll Indicator */}
        <FadeIn delay={0.6}>
          <div className="flex justify-center mt-12">
            <button
              onClick={() => scrollToSection("about")}
              className="text-text-secondary dark:text-text-secondary-dark text-sm hover:text-text-primary dark:hover:text-text-primary-dark transition-colors flex flex-col items-center gap-2"
            >
              <span>Scroll to explore</span>
              <div className="w-5 h-8 border-2 border-accent-secondary dark:border-accent-cream rounded-full flex items-start justify-center p-1">
                <div className="w-1 h-2 bg-accent-secondary dark:bg-accent-cream rounded-full animate-bounce" />
              </div>
            </button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};
