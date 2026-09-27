import { TimelineEntry } from "@/types";

// Fallback "today" for the server render; the client swaps in the real date on mount.
export const timelineAsOf = "2026-09-27";

// Chronological by start month. Numbers match experience.ts and projects.ts.
export const timeline: TimelineEntry[] = [
  {
    id: "btech",
    category: "education",
    start: "2021-09",
    end: "2025-05",
    title: "B.Tech, AI & Machine Learning",
    org: "D.J. Sanghvi College of Engineering · Mumbai",
    description: "Machine learning, deep learning, computer vision, NLP, and data structures & algorithms.",
    tags: ["Mumbai University", "AI & ML"]
  },
  {
    id: "djsce-undergrad-research",
    category: "research",
    start: "2022-06",
    end: "2024-05",
    title: "Undergraduate Research Assistant",
    org: "D.J. Sanghvi College · Mumbai",
    description: "Built the ingredient recognition model and hybrid recipe recommender behind a peer-reviewed paper.",
    tags: ["MobileNetV2", "8,269 recipes"]
  },
  {
    id: "acm",
    category: "experience",
    start: "2023-12",
    end: "2025-01",
    title: "Technical Lead, ACM",
    org: "ACM student chapter · D.J. Sanghvi",
    description: "Led technical work for the college's ACM student chapter.",
    tags: ["Leadership"]
  },
  {
    id: "djsce-placement-platform",
    category: "experience",
    start: "2024-05",
    end: "2025-06",
    title: "Placement Intelligence Platform",
    org: "Research Intern · D.J. Sanghvi College",
    description: "Owned the backend for 500+ students, plus a spaCy NER resume parser and real-time CV confidence detection.",
    tags: ["10K+ req/day", "95% F1", "<200 ms p95"]
  },
  {
    id: "publication",
    category: "award",
    start: "2024-10",
    title: "Peer-reviewed paper",
    org: "Library Progress International",
    description: "AI ingredient recognition and personalized recipe recommendation. First-authored the system architecture section.",
    tags: ["NutriSense", "Co-author"],
    githubRepo: "KPandya1903/NutriSense"
  },
  {
    id: "nexusmesh",
    category: "project",
    start: "2025-08",
    end: "2026-01",
    title: "NexusMesh",
    org: "Decentralized P2P event mesh",
    description: "A Chord DHT built from primitives in Java 17, with gRPC streaming for broker-free event delivery.",
    tags: ["<5 ms p99 · 100 nodes", "O(log N)"],
    githubRepo: "KPandya1903/NexusMesh"
  },
  {
    id: "stevens",
    category: "education",
    start: "2025-09",
    end: "2027-05",
    title: "MS, Computer Science",
    org: "Stevens Institute of Technology · Hoboken",
    description: "Distributed systems, operating systems, concurrent and parallel (CUDA) programming, ML, databases, cloud.",
    tags: ["Hoboken, NJ", "Class of 2027"],
    short: "MS at Stevens"
  },
  {
    id: "taskpulse",
    category: "project",
    start: "2025-10",
    end: "2026-04",
    title: "TaskPulse",
    org: "Distributed task orchestrator",
    description: "Redis priority queues, idempotent execution, and bounded backoff to stop retry storms under burst load.",
    tags: ["10K+ tasks/day", "99.9% reliability"],
    githubRepo: "KPandya1903/TaskPulse"
  },
  {
    id: "stevens-research",
    category: "research",
    start: "2025-11",
    end: "present",
    title: "Graduate Research Assistant",
    org: "Distributed Systems · Stevens",
    description: "Energy efficiency in heterogeneous federated learning, profiling per-layer power across 100+ edge devices.",
    tags: ["35% energy cut", "<2% accuracy loss"],
    short: "Stevens research"
  },
  {
    id: "hackhouse-sf",
    category: "award",
    start: "2025-12",
    title: "HackHouse SF, Top 100",
    org: "Resident · San Francisco",
    description: "Built alongside founders from SuperMemory, AirGarage, Omi, and Browser-Use.",
    tags: ["Top 100", "Pitched AirGarage"]
  },
  {
    id: "fleetiq",
    category: "project",
    start: "2025-12",
    title: "FleetIQ",
    org: "Vehicle entry–exit matching",
    description: "YOLOv8 plate detection, multi-engine OCR, and fuzzy temporal matching across parking-lot imagery.",
    tags: ["98.15% OCR", "591 matched pairs"],
    githubRepo: "KPandya1903/FleetIQ"
  },
  {
    id: "doclens",
    category: "project",
    start: "2026-01",
    title: "DocLens",
    org: "Edge-native doc search & chat",
    description: "Cloudflare Workers, Vectorize, and Workers AI behind streaming Gemini answers.",
    tags: ["~70 ms cold start", "285 KB gzipped"],
    githubRepo: "KPandya1903/DocLens",
    liveUrl: "https://doc-explorer.kunjspandya.workers.dev"
  },
  {
    id: "tradeflow",
    category: "project",
    start: "2026-01",
    end: "present",
    title: "TradeFlow",
    org: "Paper trading platform",
    description: "$100K virtual portfolios with real-time Alpaca pricing and a Holt-Winters + LSTM + GRU forecast ensemble.",
    tags: ["23-feature OHLCV", "TypeScript"],
    githubRepo: "KPandya1903/TradeFlow",
    short: "TradeFlow"
  },
  {
    id: "credit-risk",
    category: "project",
    start: "2026-01",
    title: "Credit Risk Inference System",
    org: "ML model + Flask API",
    description: "XGBoost pipeline served through a Flask REST API and stress-tested at 1,000 requests.",
    tags: ["0.91 AUC-ROC", "<200 ms median"],
    githubRepo: "KPandya1903/Credit-Risk-Inference-System"
  },
  {
    id: "quackhacks",
    category: "award",
    start: "2026-02",
    title: "QuackHacks '26, 1st place",
    org: "I Wizard · 24-hour hackathon",
    description: "Real-time 3D Harry Potter dueling game in the browser, built with React Three Fiber.",
    tags: ["1st place", "React Three Fiber"],
    githubRepo: "KPandya1903/I_Wizard",
    liveUrl: "https://i-wizard.vercel.app"
  },
  {
    id: "quickfill",
    category: "project",
    start: "2026-03",
    title: "QuickFill",
    org: "Chrome extension",
    description: "Keyboard-driven snippets, autofill, and templates on any site.",
    tags: ["19+ active users", "Manifest V3"],
    githubRepo: "KPandya1903/Extension"
  },
  {
    id: "vaultchat",
    category: "project",
    start: "2026-04",
    title: "VaultChat",
    org: "Zero-knowledge encrypted messaging",
    description: "Stateless Go nodes fanned out over Redis Pub/Sub. The server only ever stores ciphertext.",
    tags: ["ECDH P-256", "AES-GCM-256"],
    githubRepo: "KPandya1903/Vault-Chat"
  },
  {
    id: "fini",
    category: "experience",
    start: "2026-05",
    end: "present",
    title: "Software Engineer Intern, iOS",
    org: "Fini · AI features · Remote",
    description: "SwiftUI assistant features that turn natural language into structured actions, plus UIKit → SwiftUI migration behind flags.",
    tags: ["Swift · SwiftUI", "EN/DE/ES"],
    short: "Fini"
  },
  {
    id: "edara",
    category: "project",
    start: "2026-05",
    end: "present",
    title: "Edara",
    org: "Procedure intelligence engine",
    description: "Staged pipeline that turns technical PDFs into source-grounded task data, with the LLM confined to meaning.",
    tags: ["s0 → s9 pipeline", "FastAPI · Redis"],
    privateRepo: true,
    short: "Edara"
  },
  {
    id: "graduation",
    category: "milestone",
    start: "2027-05",
    title: "MS graduation",
    org: "Stevens Institute of Technology",
    description: "Master of Science in Computer Science.",
    tags: ["May 2027"]
  },
  {
    id: "full-time",
    category: "milestone",
    start: "2027-06",
    title: "Full-time start",
    org: "New grad 2027",
    description: "Open to new-grad software and ML engineering roles.",
    tags: ["SWE", "ML / AI"]
  }
];
