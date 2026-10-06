import { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "edara",
    title: "Edara — Procedure Intelligence Engine",
    category: "AI Systems & Data Pipelines",
    description: "Turns technical PDFs like install guides, service manuals, and statements of work into structured, source-grounded task data, with the LLM confined to meaning and every claim traced back to its source.",
    problem: "LLM document pipelines produce confident output that can't be traced back to the page it came from, which makes it unusable for procedures people actually follow.",
    solution: "Built a staged Python pipeline (s0_ingest → s9_project) with versioned artifact contracts and validation at every stage boundary. Structure, provenance, and figures stay deterministic; an LLM handles semantics and must cite the span lines it used. FastAPI serves uploads and reads while a background worker runs the stages, with Redis as queue and LLM cache and Supabase Postgres as the source of truth.",
    impact: "A provenance resolver maps every generated claim to an exact source span, and unresolvable provenance fails the build. 13 test modules, including human-read golden ground truth, run against a 13-document corpus of networking, appliance, and statement-of-work documents.",
    tech: ["Python", "FastAPI", "Supabase", "PostgreSQL", "Redis", "Docling", "OpenAI", "pytest"],
    privateRepo: true,
    highlights: [
      "Staged pipeline with versioned artifact contracts",
      "Every generated claim resolves to a source span, or the build fails",
      "Deterministic structure, LLM for meaning",
      "FastAPI web service plus background worker",
      "Human review queue before production use"
    ],
    date: "May 2026 – Present"
  },
  {
    id: "nexusmesh",
    title: "NexusMesh — Decentralized P2P Event Mesh",
    category: "Distributed Systems",
    description: "A peer-to-peer event mesh built on a Chord DHT implemented from primitives, with bidirectional gRPC streaming for push-based event delivery and no central broker.",
    problem: "Propagate events in real time across nodes that join, fail, and move keys, without a central coordinator.",
    solution: "Implemented Chord in Java 17 with a 160-bit SHA-1 identifier ring, finger-table routing, and automatic stabilization. Layered a pub/sub event broker over bidirectional gRPC streams, with thread-safe local storage and a CLI for bindings, lookups, and routing tables.",
    impact: "Under 5 ms p99 lookup in a 100-node network, under 1 ms event delivery on a local network, and ±5% storage distribution variance. O(log N) lookups, with stabilization converging in O(log² N) rounds.",
    tech: ["Java 17", "gRPC", "Protocol Buffers", "Chord DHT", "Maven", "Concurrency"],
    githubRepo: "KPandya1903/NexusMesh",
    highlights: [
      "Chord DHT built from primitives",
      "<5 ms p99 lookup across 100 nodes",
      "Bidirectional gRPC event streaming",
      "Survives node joins, failures, and key migration",
      "No central broker"
    ],
    date: "Aug 2025 – Jan 2026"
  },
  {
    id: "taskpulse",
    title: "TaskPulse — Distributed Task Orchestrator",
    category: "Distributed Systems",
    description: "Horizontally scalable task orchestration service with REST APIs for job submission, priority scheduling, and status tracking.",
    problem: "Burst workloads cause task starvation and retry storms in naive job queues.",
    solution: "Built FastAPI endpoints for submitting, scheduling, and tracking tasks, with distributed workers consuming from a Redis priority queue and PostgreSQL as durable state. Added priority-aware batching, idempotent execution, and bounded exponential backoff.",
    impact: "Sustains 10K+ tasks a day at 99.9% reliability across distributed workers, with starvation and retry storms resolved under burst load.",
    tech: ["Python", "FastAPI", "Redis", "PostgreSQL", "Docker"],
    githubRepo: "KPandya1903/TaskPulse",
    highlights: [
      "10K+ tasks/day at 99.9% reliability",
      "Redis priority queue with PostgreSQL as durable state",
      "Priority-aware batching",
      "Idempotent execution with bounded exponential backoff"
    ],
    date: "Oct 2025 – Apr 2026"
  },
  {
    id: "fleetiq",
    title: "FleetIQ — Vehicle Entry–Exit Matching",
    category: "Computer Vision",
    description: "Four-stage computer vision pipeline that matches vehicle entry and exit events across parking-lot imagery. Built at HackHouse SF and pitched to AirGarage.",
    problem: "Match the entry and exit events of the same vehicle across camera images where plates are blurred, angled, or badly lit.",
    solution: "The pipeline parses image metadata, detects plates with YOLOv8, reads them with multi-engine OCR (Fast-ALPR on ONNX plus EasyOCR) after six enhancement strategies including CLAHE, bilateral filtering, and adaptive thresholding, then pairs events with fuzzy temporal matching on Levenshtein distance inside a 72-hour window.",
    impact: "98.15% OCR success (1,960 of 1,997 images) and 99.85% bounding-box extraction, detecting plates at about 115 images per second. Produced 591 matched pairs: 368 exact and 223 fuzzy.",
    tech: ["Python", "PyTorch", "YOLOv8", "OpenCV", "Fast-ALPR", "EasyOCR", "SQLite", "aiohttp"],
    githubRepo: "KPandya1903/FleetIQ",
    highlights: [
      "98.15% OCR success across 1,997 images",
      "99.85% bounding-box extraction",
      "591 matched entry–exit pairs",
      "Six OCR enhancement strategies",
      "30 concurrent async HTTP requests"
    ],
    date: "Dec 2025"
  },
  {
    id: "doclens",
    title: "DocLens — Edge-Native Doc Search & Chat",
    category: "AI & Edge Computing",
    description: "Semantic search and AI chat over Cloudflare's documentation, running entirely on Cloudflare's edge.",
    problem: "Let developers ask documentation questions in plain language and get grounded answers with low latency worldwide.",
    solution: "A Cloudflare Worker embeds queries with Workers AI (BGE-base-en-v1.5, 768 dimensions), searches Vectorize by cosine similarity, and streams answers from Gemini 2.0 Flash through the Vercel AI SDK. Durable Objects keep chat sessions on SQLite, and tool calls support human-in-the-loop confirmation.",
    impact: "About 70 ms Worker cold start and 200–400 ms search latency, with the client bundle cut from 1.5 MB to 285 KB gzipped. Live in production.",
    tech: ["TypeScript", "Cloudflare Workers", "Vectorize", "Workers AI", "Durable Objects", "Gemini", "React 19"],
    githubRepo: "KPandya1903/DocLens",
    liveUrl: "https://doc-explorer.kunjspandya.workers.dev",
    highlights: [
      "~70 ms cold start, 200–400 ms search",
      "BGE embeddings in Vectorize",
      "Streaming Gemini responses",
      "Persistent chat on Durable Objects",
      "Bundle cut from 1.5 MB to 285 KB gzipped"
    ],
    date: "Jan 2026"
  },
  {
    id: "vaultchat",
    title: "VaultChat — Zero-Knowledge Encrypted Messaging",
    category: "Security & Distributed Systems",
    description: "End-to-end encrypted chat where the server never sees plaintext, built on stateless Go instances that scale horizontally.",
    problem: "Relay messages across multiple servers without any server being able to read them, even if it is compromised.",
    solution: "Browsers exchange keys with ECDH P-256 and encrypt with AES-GCM-256 through the Web Crypto API, holding non-extractable keys in IndexedDB. Stateless Go nodes fan messages out over Redis Pub/Sub and subscribe to a room only when a local client is in it. PostgreSQL 16 stores ciphertext only.",
    impact: "No plaintext field exists in the database schema or the wire protocol. The server rejects invalid P-256 public keys and caps frames at 64 KB with UUID-validated identifiers.",
    tech: ["Go", "WebSockets", "Redis Pub/Sub", "PostgreSQL", "Web Crypto API", "React 19", "TypeScript"],
    githubRepo: "KPandya1903/Vault-Chat",
    highlights: [
      "ECDH P-256 key exchange, AES-GCM-256 encryption",
      "Stateless Go nodes over Redis Pub/Sub",
      "Demand-driven room subscriptions",
      "Ciphertext-only PostgreSQL storage"
    ],
    date: "Apr 2026"
  },
  {
    id: "tradeflow",
    title: "TradeFlow — Paper Trading Platform",
    category: "Full-Stack & Machine Learning",
    description: "Paper trading platform with $100K virtual portfolios, real-time Alpaca pricing across the S&P 500, ML price forecasts, and group competitions.",
    problem: "Give people a risk-free place to learn trading with real market data, technical analysis, and AI-assisted research.",
    solution: "React and TypeScript front end with a Node.js/Express and PostgreSQL (Prisma) backend. TensorFlow.js runs a stacked ensemble of Holt-Winters, LSTM, and GRU models over 23 engineered OHLCV features, and a research pipeline streams LLM analysis from DeepSeek-R1 (via Ollama and Groq) and Gemini.",
    impact: "Limit and stop orders validated on 60-second cycles; RSI, MACD, Bollinger Bands, and Weinstein stage analysis; FIFO cost-basis tracking with capital-gains estimates; group trading with invite codes and leaderboards.",
    tech: ["React", "TypeScript", "Node.js", "PostgreSQL", "Prisma", "TensorFlow.js", "Ollama", "Gemini"],
    githubRepo: "KPandya1903/TradeFlow",
    highlights: [
      "$100K virtual portfolios with real-time Alpaca pricing",
      "Holt-Winters + LSTM + GRU ensemble",
      "23-feature OHLCV pipeline",
      "FIFO cost-basis tax tracking",
      "Group competitions with leaderboards"
    ],
    date: "2026"
  },
  {
    id: "i-wizard",
    title: "I Wizard — 3D Dueling Game (QuackHacks '26 Winner)",
    category: "Hackathon Winner · 3D Web",
    description: "Real-time Harry Potter dueling game in the browser, set in a 3D Hogwarts Great Hall. Won 1st place at QuackHacks '26.",
    problem: "Build a playable, good-looking 3D game in 24 hours that loads quickly in a browser.",
    solution: "Built with React 19 and React Three Fiber, using drei for HDRI lighting, contact shadows, and sparkles, and postprocessing for bloom, vignette, and tone mapping. A Leva panel tunes lighting and effects live.",
    impact: "Won 1st place at QuackHacks '26 from a 24-hour build, and it is playable live on Vercel.",
    tech: ["React 19", "React Three Fiber", "Three.js", "drei", "Vite"],
    githubRepo: "KPandya1903/I_Wizard",
    liveUrl: "https://i-wizard.vercel.app",
    highlights: [
      "1st place, QuackHacks '26",
      "Real-time 3D arena in the browser",
      "Bloom, vignette, and tone-mapping postprocessing"
    ],
    date: "Feb 2026"
  },
  {
    id: "wizard-duel",
    title: "Wizard Duel — Unity Campaign",
    category: "Game Development & AI",
    description: "First-person 3D wizard battle game built with Unity 6 and URP, featuring a 10-level Harry Potter-themed campaign with voice-controlled spell casting.",
    problem: "Create an immersive wizard combat game with progressive difficulty, real-time spell physics, and innovative voice-controlled input.",
    solution: "Developed a Unity 6 game with Universal Render Pipeline, featuring 8 progressively unlocked spells with projectile physics, shields, and status effects. Integrated Featherless Whisper API for voice-to-spell casting and optional LLM-powered opponent AI decisions.",
    impact: "10-level campaign from Professor Quirrell to Lord Voldemort across themed arenas. State machine AI with weighted decision-making and dynamic arena theming per level.",
    tech: ["Unity 6", "C#", "URP", "Cinemachine", "Whisper API", "LLM", "ProBuilder"],
    githubRepo: "KPandya1903/Unity---Harry-Potter-",
    highlights: [
      "10-level Harry Potter-themed campaign",
      "Voice-controlled spell casting via Whisper API",
      "8 spells with projectile physics and status effects",
      "State machine AI with weighted decisions",
      "Dynamic arena theming with ArenaThemeApplier"
    ],
    date: "Feb 2026"
  },
  {
    id: "recallai",
    title: "RecallAI — Semantic Memory for YouTube",
    category: "Applied NLP · Chrome Extension",
    description: "Chrome extension that turns YouTube watch history into a semantic memory network, with all NLP running locally in the browser.",
    problem: "What you learn from videos is gone once the tab closes, and sending viewing history to a server is a privacy cost.",
    solution: "A content script captures live captions through a MutationObserver. A Manifest V3 service worker extracts TF-IDF keywords and entities, writes extractive summaries, and computes 384-dimensional all-MiniLM-L6-v2 embeddings with transformers.js, storing everything in IndexedDB.",
    impact: "Links related videos by weighted cosine similarity (70%) and entity overlap (30%), and renders them as an interactive 3D force-directed graph. No server, no API keys, and no data leaves the machine.",
    tech: ["JavaScript", "transformers.js", "Chrome Extensions (MV3)", "IndexedDB", "Embeddings", "TF-IDF"],
    githubRepo: "KPandya1903/RecallAI",
    highlights: [
      "Local embeddings with all-MiniLM-L6-v2",
      "Live caption capture, no API keys",
      "Semantic edges between related videos",
      "3D neuron-graph visualization"
    ],
    date: "2026"
  },
  {
    id: "credit-risk",
    title: "Credit Risk Inference System",
    category: "Machine Learning & Backend",
    description: "Credit risk scoring model served through a real-time Flask inference API.",
    problem: "Score loan applications in real time with a model that is accurate, explainable to test, and fast to serve.",
    solution: "Built a scikit-learn pipeline with StandardScaler, categorical encoding, and an XGBoost classifier, trained on a 1,000-row synthetic credit dataset. Served it through a Flask REST API with PostgreSQL integration, pytest unit tests, and a 1,000-request stress test.",
    impact: "0.91 AUC-ROC and 81% accuracy on the held-out test set, with median API responses under 200 ms under concurrent load.",
    tech: ["Python", "XGBoost", "scikit-learn", "Flask", "PostgreSQL", "pandas", "pytest"],
    githubRepo: "KPandya1903/Credit-Risk-Inference-System",
    highlights: [
      "0.91 AUC-ROC with XGBoost",
      "<200 ms median API latency",
      "Stress-tested at 1,000 requests",
      "End-to-end scikit-learn pipeline"
    ],
    date: "Jan 2026"
  },
  {
    id: "nutrisense",
    title: "NutriSense — Ingredient Recognition & Recipes",
    category: "Computer Vision · Published Research",
    description: "Kitchen assistant that recognizes ingredients from photos and recommends recipes, implementing the system from my paper in Library Progress International (2024).",
    problem: "Busy people waste food because they don't know what to cook with what they already have.",
    solution: "Fine-tuned MobileNetV2 on 36 fruit and vegetable classes and paired it with a hybrid recommender combining collaborative filtering with TF-IDF content matching. A Streamlit interface adds refrigerator inventory and expiry tracking, dietary filters, and nutrition lookups.",
    impact: "96.41% test accuracy on ingredient recognition. Recommendations draw on 8,269 recipes from 12+ cuisines at 93% precision and 89% recall.",
    tech: ["Python", "TensorFlow", "MobileNetV2", "scikit-learn", "OpenCV", "Streamlit"],
    githubRepo: "KPandya1903/NutriSense",
    highlights: [
      "96.41% test accuracy across 36 classes",
      "Hybrid collaborative + TF-IDF recommender",
      "8,269-recipe catalog",
      "Backed by a peer-reviewed paper"
    ],
    date: "2024"
  },
  {
    id: "quickfill",
    title: "QuickFill — Browser Productivity Extension",
    category: "Browser Extension",
    description: "Keyboard-driven Chrome extension for inserting snippets, autofilling common fields, and launching templates on any site. Published on the Chrome Web Store.",
    problem: "Retyping the same links, answers, and templates into web forms all day is slow and error-prone.",
    solution: "Manifest V3 and vanilla JavaScript with no build step: a command palette (Cmd+Shift+K), a Shadow DOM floating menu, drag-and-drop insertion, and a DOM heuristic engine that detects fields like email, LinkedIn, and GitHub.",
    impact: "19+ active users on the Chrome Web Store. Domain-scoped snippets, JSON import and export, and automatic dark mode.",
    tech: ["JavaScript", "Chrome Extensions (MV3)", "Shadow DOM", "Chrome Storage API"],
    githubRepo: "KPandya1903/Extension",
    highlights: [
      "19+ active users on the Chrome Web Store",
      "Command palette and floating menu",
      "Smart field detection for autofill"
    ],
    date: "Mar 2026"
  },
  {
    id: "passmanager",
    title: "PassManager Server",
    category: "Security & Backend",
    description: "Lightweight password manager server with trust-free architecture, end-to-end encryption, and secure session management.",
    problem: "Deploy a secure password management solution on modest infrastructure without sacrificing cryptographic security standards.",
    solution: "Built a Python-based server implementing trust-free architecture with end-to-end encryption, secure key management, and session-based access control. Designed RESTful API with comprehensive endpoint documentation and standardized response formats.",
    impact: "Lightweight deployment suitable for small-scale infrastructure. Complete cryptographic implementation with secure authentication and encrypted data storage.",
    tech: ["Python", "Cryptography", "REST API", "Session Management", "Database"],
    githubRepo: "KPandya1903/PassManager-Server",
    highlights: [
      "Trust-free architecture design",
      "End-to-end encryption for stored credentials",
      "Secure session management and access control",
      "Comprehensive API documentation",
      "Lightweight deployable server"
    ],
    date: "Jan 2026"
  },
  {
    id: "ventureview-hr",
    title: "VentureViewHR — AI HR Assistant",
    category: "AI & Full-Stack",
    description: "AI-powered HR analytics application built with Gemini AI for intelligent recruitment insights and workforce management.",
    problem: "Streamline HR decision-making with AI-driven analysis of recruitment data and workforce metrics.",
    solution: "Built an AI Studio application powered by Google Gemini API, providing intelligent HR analytics and recruitment insights through a modern TypeScript interface.",
    impact: "AI-driven HR analytics with real-time Gemini-powered insights for recruitment and workforce management decisions.",
    tech: ["TypeScript", "Gemini AI", "React", "Node.js"],
    githubRepo: "KPandya1903/VentureViewHR",
    highlights: [
      "Gemini AI-powered HR analytics",
      "Real-time recruitment insights",
      "Modern TypeScript interface",
      "AI Studio integration"
    ],
    date: "Nov 2025"
  }
];
