import { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "vehicle-matching",
    title: "Vehicle Matching System (AIRGarage Track)",
    category: "Computer Vision & Deep Learning",
    description: "Multi-stage computer vision pipeline for associating vehicle entry-exit events across 100K+ images with 94% matching accuracy.",
    problem: "Need to accurately match vehicle entry and exit events across a massive dataset of parking lot images for automated parking management.",
    solution: "Assembled a multi-stage CV pipeline using YOLO for vehicle detection, FastALPR + OCR for license plate reading, and ResNet for vehicle feature matching. Accelerated processing with CUDA-optimized GPU inference.",
    impact: "Achieved 94% matching accuracy across 100K+ images. Reduced end-to-end processing latency under batch workloads using GPU acceleration.",
    tech: ["Python", "YOLO", "FastALPR", "OCR", "ResNet", "CUDA", "Computer Vision", "Deep Learning"],
    githubRepo: "kpandya1903/vehicle-matching-system",
    highlights: [
      "94% matching accuracy across 100K+ images",
      "Multi-stage pipeline: YOLO → FastALPR + OCR → ResNet",
      "GPU-accelerated inference with CUDA",
      "Real-time batch processing"
    ],
    date: "Dec 2025"
  },
  {
    id: "pulse",
    title: "Pulse — Distributed Task Orchestrator",
    category: "Distributed Systems",
    description: "Horizontally scalable distributed task orchestration service with REST APIs, Redis priority queues, and fault-tolerant task processing.",
    problem: "Need for a reliable, fault-tolerant task orchestration system capable of handling burst workloads without task starvation or retry storms.",
    solution: "Built a distributed orchestrator exposing REST APIs for task submission, scheduling, and status tracking. Implemented horizontally scalable workers consuming from Redis priority queues with priority-aware batching, idempotent execution, and bounded retries.",
    impact: "Handles 10K+ tasks/day with 99.9% reliability. Resolved task starvation and retry storms under burst workloads, stabilizing end-to-end task processing.",
    tech: ["Python", "FastAPI", "PostgreSQL", "Redis", "Docker", "Distributed Systems"],
    githubRepo: "kpandya1903/pulse",
    highlights: [
      "10K+ tasks/day processing capacity",
      "99.9% reliability with fault tolerance",
      "Priority-aware batching for fair scheduling",
      "Idempotent task execution with bounded retries",
      "Horizontally scalable worker architecture"
    ],
    date: "Oct 2025"
  },
  {
    id: "p2p-event-mesh",
    title: "Decentralized P2P Event Mesh",
    category: "Distributed Systems & Networking",
    description: "Decentralized peer-to-peer event mesh using Java, gRPC, and Chord-based DHT for real-time push-based message propagation.",
    problem: "Design a decentralized system for real-time event propagation across dynamic nodes without central coordination.",
    solution: "Formed a P2P event mesh using Java and gRPC with a Chord-based Distributed Hash Table (DHT) enabling real-time, push-based message propagation. Implemented fault tolerance for node joins, failures, and migrations.",
    impact: "Evaluated on Amazon EC2, maintaining consistent message delivery during node joins, failures, and migrations. Zero central point of failure with automatic DHT rebalancing.",
    tech: ["Java", "gRPC", "EC2", "Protobuf", "Chord DHT", "Distributed Systems", "Networking"],
    githubRepo: "kpandya1903/p2p-event-mesh",
    highlights: [
      "Chord-based DHT for decentralized routing",
      "Real-time push-based message propagation",
      "Fault-tolerant during node churn",
      "Deployed and tested on Amazon EC2",
      "Zero single point of failure"
    ],
    date: "Aug 2025"
  },
  {
    id: "smartkitchen-ai",
    title: "SmartKitchen AI",
    category: "AI/ML & Backend Systems",
    description: "Scalable backend with MobileNetV2-based ingredient recognition, recipe catalog of 8,000+ entries, and hybrid recommendation engine.",
    problem: "Build an intelligent kitchen assistant that recognizes ingredients and provides personalized meal recommendations with nutritional tracking.",
    solution: "Delivered a scalable backend integrating MobileNetV2-based ingredient recognition service with a 8,000+ recipe catalog. Implemented hybrid recommendation engine combining TF-IDF content-based filtering with user-preference signals.",
    impact: "Real-time ingredient recognition and personalized recommendations. Automated inventory tracking and nutritional data retrieval in end-to-end production workflow.",
    tech: ["Python", "MobileNetV2", "TensorFlow", "TF-IDF", "Backend Systems", "Recommendation Engines"],
    githubRepo: "kpandya1903/smartkitchen-ai",
    highlights: [
      "MobileNetV2-based ingredient recognition",
      "8,000+ recipe catalog integration",
      "Hybrid TF-IDF + preference-based recommendations",
      "Automated inventory and nutrition tracking",
      "Production-ready backend architecture"
    ],
    date: "Oct 2024"
  }
];
