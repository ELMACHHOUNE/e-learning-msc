# Demo Script — AI-Powered E-Learning Platform

## Duration: 3-5 minutes

---

### 0:00–0:30 — Problem & Introduction

**Script:**
"This is an AI-powered e-learning platform built for my AI Developer Bootcamp capstone. The problem: traditional e-learning platforms are static — students can't interact with course content, instructors spend hours creating quizzes, and project feedback is subjective.

My solution: integrate local AI capabilities directly into the platform using Ollama, giving students a learning assistant, instructors an AI quiz generator, and project feedback automation — all while keeping humans in the loop."

---

### 0:30–1:30 — Existing Platform

**Script:**
"Let me show you the existing platform first. It's a full-stack application built with Next.js 16, TypeScript, MongoDB, and Docker.

[Show the dashboard]
Here's the role-based dashboard. Admins see analytics, instructors see their guilds, students see their progress.

[Show course detail]
Students navigate through modules, chapters, and lessons. The content is stored in MongoDB with a nested curriculum structure.

[Show lab phases]
Lab phases let instructors create hands-on projects. Students submit their work through a 3-step validation pipeline."

---

### 1:30–2:30 — AI Learning Assistant

**Script:**
"Now let me show the AI features. I'll go to a course and click the AI Assistant tab.

[Open AI Assistant]
Students can ask questions about the course material. The assistant receives the course context from MongoDB and responds based on that content.

[Type a question]
Notice the confidence rating — it shows whether the AI is confident in its answer. The suggested follow-up questions help students explore deeper.

The key architectural points:
- All AI calls go through our Next.js API routes
- Authentication is verified server-side
- The course content is fetched from MongoDB
- The prompt is constructed with delimiters to prevent injection
- The AI response is validated with Zod schemas before returning to the client"

---

### 2:30–3:15 — AI Quiz Generator

**Script:**
"For instructors, we have the AI Quiz Generator.

[Open Teach → AI Quiz Generator]
Instructors select a course and lesson, choose the number of questions and difficulty level.

[Generate a quiz]
The AI generates structured quiz data — questions, options, correct answers, and explanations.

But this is just a draft. Instructors can edit questions, change answers, regenerate, and save as a draft. The quiz is never automatically published. This is the human-in-the-loop design.

[Show the draft with edit controls]"

---

### 3:15–3:45 — AI Project Feedback

**Script:**
"Finally, AI Project Feedback.

[Open LabPhase → Student Projects]
When an instructor expands a student's project submission, they can generate AI feedback.

[Click Generate AI Feedback]
The AI analyzes the submission — presentation, git repo, and deployment URLs — and provides structured feedback: summary, strengths, issues, recommendations, and a score.

This is advisory only. The instructor makes the final evaluation."

---

### 3:45–4:30 — Architecture, Security, Testing

**Script:**
"Let me show the architecture.

[Show the health endpoint]
The AI health endpoint shows Ollama is running with the phi3:mini model.

The architecture follows a clean separation:
- Provider abstraction — we can swap Ollama for OpenAI later
- Centralized prompts — no scattered prompt strings
- Input validation — Zod schemas on both input and output
- Error handling — custom error types for different failure modes

Security:
- All AI endpoints require authentication
- Role-based access — students only get the assistant
- Ollama URL is server-side only
- User input is escaped in prompts

The model runs locally in Docker — no external API calls, no data leaves the server."

---

### 4:30–5:00 — Conclusion & Future

**Script:**
"In summary, this platform demonstrates:
- Full-stack engineering with Next.js and TypeScript
- AI integration with a local LLM via Ollama
- Structured output validation with Zod
- Prompt engineering with injection defense
- Human-in-the-loop AI design
- Docker containerization
- Comprehensive documentation

Future improvements would include RAG for better context retrieval, conversation history, streaming responses, and an evaluation framework for response quality.

Thank you."
