import { Experience } from "@/types";

export const experiences: Experience[] = [
  {
    id: "fini",
    title: "Software Engineer Intern, iOS (AI Features)",
    company: "Fini",
    location: "Remote",
    period: "May 2026 – Present",
    current: true,
    description: [
      "Build AI-assistant features in Swift and SwiftUI (MVVM, Swift Package Manager) that turn natural-language intent into structured actions for task assignment and routine building.",
      "Migrate legacy UIKit screens to SwiftUI behind feature flags, so rebuilt screens roll out incrementally without breaking what already ships.",
      "Ship through senior-reviewed pull requests in a multi-contributor codebase (~15 active contributors), with SwiftLint-enforced style and localization across English, German, and Spanish."
    ],
    tech: ["Swift", "SwiftUI", "UIKit", "MVVM", "Swift Package Manager", "Feature Flags", "SwiftLint"]
  },
  {
    id: "stevens-research",
    title: "Graduate Research Assistant, Distributed Systems",
    company: "Stevens Institute of Technology",
    location: "Hoboken, NJ",
    period: "Nov 2025 – Present",
    current: true,
    description: [
      "Research energy efficiency in heterogeneous federated learning (HeteroFL), focusing on where cold-start training wastes energy.",
      "Built a distributed profiling pipeline with TensorFlow.js, Socket.IO, and Redis that collects per-layer power metrics in real time from 100+ heterogeneous edge devices.",
      "Traced cold-start energy overhead to specific bottleneck layers; the resulting optimizations cut training energy 35% with under 2% accuracy loss. Findings submitted for publication."
    ],
    tech: ["TensorFlow.js", "Socket.IO", "Redis", "Federated Learning", "Distributed Systems", "Edge Computing", "Profiling"]
  },
  {
    id: "djsce-placement-platform",
    title: "Research Intern – Placement Intelligence Platform",
    company: "D.J. Sanghvi College of Engineering",
    location: "Mumbai, India",
    period: "May 2024 – June 2025",
    current: false,
    description: [
      "Owned the backend for a placement platform serving 500+ students, with REST APIs handling 10K+ requests a day at under 200 ms p95 latency during concurrent resume uploads.",
      "Trained a custom spaCy NER resume parser on 2,000 labeled resumes (70/15/15 split), reaching 95% F1 against a 78% regex baseline, and served it through FastAPI.",
      "Fine-tuned MobileNetV2 for real-time interview-confidence detection at 30 FPS and 88% accuracy, and cut inference latency 40% with quantization."
    ],
    tech: ["Node.js", "FastAPI", "REST APIs", "spaCy", "NER", "TensorFlow", "MobileNetV2", "Microservices"]
  },
  {
    id: "djsce-undergrad-research",
    title: "Undergraduate Research Assistant",
    company: "D.J. Sanghvi College of Engineering",
    location: "Mumbai, India",
    period: "June 2022 – May 2024",
    current: false,
    description: [
      "Co-authored a peer-reviewed paper in Library Progress International (2024) on AI ingredient recognition and personalized recipe recommendation, and first-authored its system architecture section.",
      "Built the ingredient recognition model on MobileNetV2 and paired it with a hybrid recommender combining collaborative filtering and TF-IDF content matching over an 8,269-recipe catalog."
    ],
    tech: ["TensorFlow", "MobileNetV2", "Computer Vision", "TF-IDF", "Recommendation Systems", "Flutter"]
  }
];
