# Portfolio Case Study — AI-Powered E-Learning Platform

## Project Summary

A full-stack e-learning platform with integrated AI capabilities, built as an AI Developer Bootcap capstone project. The platform serves three user roles (Admin, Instructor, Student) and uses local LLM inference via Ollama to provide students with a learning assistant, instructors with quiz generation, and project feedback automation.

**Live URL:** [e-teaching.tech](https://e-teaching.tech)
**Repository:** [GitHub](https://github.com/ELMACHHOUNE/e-learning-msc)

## Problem

Traditional e-learning platforms are passive content delivery systems. Students consume material without interaction, instructors spend hours creating assessments manually, and project feedback varies between evaluators. There is no tooling to bridge the gap between static content and active learning.

## Target User

| Role              | Need                                                                          |
| ----------------- | ----------------------------------------------------------------------------- |
| **Student**       | On-demand help understanding course material without waiting for office hours |
| **Instructor**    | Efficient quiz creation and consistent, structured project feedback           |
| **Administrator** | Centralized management of courses, users, cohorts, and graduation records     |

## Solution

I built a full-stack e-learning platform and integrated local AI capabilities using Ollama. The AI features are designed as additive enhancements with human-in-the-loop oversight — AI generates drafts, humans make decisions.

### Key Technical Decisions

1. **Provider abstraction layer** — The `AIProvider` interface allows swapping Ollama for OpenAI/Gemini without changing application code
2. **Structured output validation** — Every AI response is validated against Zod schemas before reaching the client
3. **Prompt injection defense** — User input is escaped and wrapped in XML-style delimiters
4. **Human-in-the-loop** — Quiz drafts require instructor approval; project feedback is advisory only
5. **Local inference** — All AI runs in Docker via Ollama; no data leaves the server

## Features

### Core Platform

- Three-role architecture with role-based dashboards and RBAC
- Course management with nested curriculum (modules → chapters → lessons)
- Guild/cohort system with session-by-session progression tracking
- Lab phases with 3-step project submission pipeline
- Automated graduation detection and PDF certificate generation
- Attendance tracking, support chat, and public program catalog

### AI Integration

- **AI Learning Assistant** — Context-aware student Q&A grounded in course material
- **AI Quiz Generator** — Structured quiz creation with editable drafts
- **AI Project Feedback** — Advisory analysis of student submissions with scoring

### Infrastructure

- Docker Compose with 6 services (app, MongoDB, Ollama, RustFS, nginx, mongo-express)
- Nginx reverse proxy with SSL/TLS termination
- RustFS (S3-compatible) for media storage
- Automated seed scripts with demo data

## Personal Role

This is a solo capstone project. I designed the architecture, implemented all features, wrote the AI integration layer, set up the Docker infrastructure, configured the production deployment on Oracle Cloud, and created all documentation.

## Tech Stack

| Layer          | Technology                                                       |
| -------------- | ---------------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend        | Next.js API Routes, NextAuth v5, Zod                             |
| Database       | MongoDB 7, Mongoose 9                                            |
| AI             | Ollama, phi4-mini (3.8B), custom prompt engineering              |
| Storage        | RustFS (S3-compatible), pdf-lib for certificates                 |
| Infrastructure | Docker Compose, nginx, Oracle Cloud                              |
| DevOps         | GitHub, ESLint, TypeScript strict mode                           |

## Challenges

### 1. Structured Output from LLMs

**Challenge:** LLMs produce unpredictable output formats. The UI needs consistent data structures.
**Solution:** Zod schemas validate every AI response. Ollama's `format: 'json'` parameter constrains output at the model level. Malformed responses are rejected with controlled errors.

### 2. Prompt Injection

**Challenge:** Users could include instructions in their questions to manipulate the AI.
**Solution:** User input is escaped (`<` → `[LT]`, `>` → `[GT]`, `&` → `[AMP]`) and wrapped in XML-style delimiters. System prompts instruct the AI to ignore instructions in user content.

### 3. CPU-Only Inference

**Challenge:** No GPU available in the development environment. LLM inference is 5-10x slower on CPU.
**Solution:** Selected phi4-mini (3.8B params) — small enough for CPU, good JSON output quality. Response times are acceptable for educational use (5-15 seconds).

### 4. Docker Model Persistence

**Challenge:** Ollama models are 2+ GB. Re-downloading on every container rebuild wastes time.
**Solution:** Named Docker volume (`ollama_data`) persists downloaded models across container rebuilds.

## Learning Outcomes

1. **AI Integration** — Learned that prompt engineering is as important as model selection. Structured output requires careful schema design.
2. **Provider Abstraction** — The interface pattern paid off immediately when switching from phi3:mini to phi4-mini.
3. **Validation is Critical** — LLMs produce unpredictable output. Without Zod validation, the UI would break on malformed responses.
4. **Docker Orchestration** — Managing 6 services with health checks, volumes, and environment variables taught me production-grade containerization.
5. **Human-in-the-Loop** — AI in education must be advisory, not autonomous. The design reflects this principle.

## Future Improvements

1. **RAG** — Replace full-content injection with semantic search over chunked documents
2. **Conversation memory** — Multi-turn chat with context persistence
3. **Streaming responses** — Server-Sent Events for token-by-token output
4. **Evaluation framework** — Automated quality metrics for AI responses
5. **Rate limiting** — Per-user request limits to prevent abuse
6. **Multi-language** — Extend AI prompts for non-English courses
