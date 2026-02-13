import { ScrollReveal } from "../animations/ScrollReveal";
import { FaGithub, FaLinkedin, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { siteMetadata } from "@/data/metadata";

export const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-background dark:bg-background-dark">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 text-text-primary dark:text-text-primary-dark">
            Get in <span className="text-accent-primary dark:text-accent-secondary">Touch</span>
          </h2>
          <div className="w-20 h-1 bg-accent-primary dark:bg-accent-secondary mx-auto mb-8" />
          <p className="text-center text-text-secondary dark:text-text-secondary-dark max-w-2xl mx-auto mb-16">
            I&apos;m always open to discussing new opportunities, collaborations, or just
            having a chat about distributed systems and AI/ML.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Email */}
          <ScrollReveal delay={0.2}>
            <a
              href={`mailto:${siteMetadata.email}`}
              className="group bg-surface dark:bg-surface-dark rounded-xl p-6 border border-accent-cream dark:border-accent-cream/20 hover:border-accent-secondary dark:hover:border-accent-secondary hover:shadow-card-hover transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent-cream dark:bg-accent-cream/10 flex items-center justify-center mb-4 group-hover:bg-accent-cream/60 dark:group-hover:bg-accent-cream/20 transition-colors">
                <FaEnvelope className="w-6 h-6 text-accent-primary dark:text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-2">Email</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark break-all">
                {siteMetadata.email}
              </p>
            </a>
          </ScrollReveal>

          {/* GitHub */}
          <ScrollReveal delay={0.3}>
            <a
              href={siteMetadata.github}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-surface dark:bg-surface-dark rounded-xl p-6 border border-accent-cream dark:border-accent-cream/20 hover:border-accent-secondary dark:hover:border-accent-secondary hover:shadow-card-hover transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent-cream dark:bg-accent-cream/10 flex items-center justify-center mb-4 group-hover:bg-accent-cream/60 dark:group-hover:bg-accent-cream/20 transition-colors">
                <FaGithub className="w-6 h-6 text-accent-primary dark:text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-2">GitHub</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">@kpandya1903</p>
            </a>
          </ScrollReveal>

          {/* LinkedIn */}
          <ScrollReveal delay={0.4}>
            <a
              href={siteMetadata.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-surface dark:bg-surface-dark rounded-xl p-6 border border-accent-cream dark:border-accent-cream/20 hover:border-accent-secondary dark:hover:border-accent-secondary hover:shadow-card-hover transition-all duration-300 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-accent-cream dark:bg-accent-cream/10 flex items-center justify-center mb-4 group-hover:bg-accent-cream/60 dark:group-hover:bg-accent-cream/20 transition-colors">
                <FaLinkedin className="w-6 h-6 text-accent-primary dark:text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-2">LinkedIn</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">Connect with me</p>
            </a>
          </ScrollReveal>

          {/* Location */}
          <ScrollReveal delay={0.5}>
            <div className="bg-surface dark:bg-surface-dark rounded-xl p-6 border border-accent-cream dark:border-accent-cream/20 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-accent-cream dark:bg-accent-cream/10 flex items-center justify-center mb-4">
                <FaMapMarkerAlt className="w-6 h-6 text-accent-primary dark:text-accent-secondary" />
              </div>
              <h3 className="font-semibold text-text-primary dark:text-text-primary-dark mb-2">Location</h3>
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{siteMetadata.location}</p>
            </div>
          </ScrollReveal>
        </div>

        {/* Footer */}
        <ScrollReveal delay={0.6}>
          <div className="mt-16 pt-8 border-t border-accent-cream dark:border-accent-cream/20 text-center">
            <p className="text-text-secondary dark:text-text-secondary-dark text-sm">
              © {new Date().getFullYear()} {siteMetadata.name}. Built with Next.js,
              TypeScript, and Tailwind CSS.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
