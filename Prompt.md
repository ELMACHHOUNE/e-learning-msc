You are the lead senior software engineer responsible for upgrading my existing project into a production-oriented AI-powered e-learning platform.

PROJECT:
E-Learning MSC

REPOSITORY:
ELMACHHOUNE/e-learning-msc

OBJECTIVE:
Transform the existing e-learning platform into an AI-powered e-learning platform suitable for my AI Developer Bootcamp final capstone.

IMPORTANT:
This is an EXISTING, WORKING project.

The project already runs locally with Docker and its existing services are working.

DO NOT rewrite the application from scratch.

DO NOT replace working architecture unnecessarily.

DO NOT break existing functionality.

DO NOT make speculative changes.

First understand the existing architecture completely, then integrate AI cleanly into the existing architecture.

The final result must look like an engineer-designed AI system, not a simple "ChatGPT button".

==================================================
PHASE 0 — PROJECT SAFETY RULES
==============================

Before modifying anything:

1. Inspect the entire repository.

2. Inspect:
   - package.json
   - Dockerfile
   - docker-compose files
   - environment files and .env.example
   - Next.js configuration
   - middleware/proxy configuration if present
   - authentication implementation
   - authorization/RBAC
   - database connection
   - MongoDB models
   - API routes
   - frontend components
   - dashboard architecture
   - course architecture
   - lab/project architecture
   - RustFS/object storage integration
   - certificate system
   - Docker/Nginx configuration
   - existing scripts
   - existing tests
   - GitHub workflows
   - documentation

3. Search for:
   - OpenAI
   - Gemini
   - Ollama
   - LLM
   - AI
   - LangChain
   - embeddings
   - vector
   - RAG
   - prompt
   - chat
   - model
   - inference

4. Confirm what AI functionality currently exists.

IMPORTANT:
Do not assume AI exists because a variable, comment, or dependency exists.

5. Identify the current architecture.

6. Identify all existing user roles and permissions.

7. Identify how students access courses and course content.

8. Identify how instructors manage courses, lab phases, projects, and students.

9. Identify how admins manage the platform.

10. Identify the most appropriate locations where AI functionality should be integrated.

11. Before changing files, produce an internal implementation plan.

Do not stop after the analysis if the architecture is clear enough to proceed.

==================================================
PHASE 1 — CURRENT ARCHITECTURE AUDIT
====================================

Perform a complete technical audit.

Analyze:

### Frontend

Identify:

- Next.js App Router structure
- server components
- client components
- layouts
- dashboards
- navigation
- reusable UI components
- forms
- loading states
- error states
- authentication-dependent UI
- role-dependent UI

### Backend

Identify:

- API routes
- server actions if present
- authentication
- authorization
- validation
- error handling
- database operations
- storage operations
- external service integrations

### Database

Identify:

- User
- Course
- CourseContent
- Guild
- LabPhase
- ProjectApplication
- SessionLog
- Certificate
- Category
- Message
- any other models

Understand their relationships.

### Authentication

Determine:

- how sessions are created
- how users are authenticated
- how current user is retrieved
- how roles are enforced
- how protected API routes work

### Infrastructure

Understand:

- Docker
- Docker Compose
- MongoDB
- RustFS
- Nginx
- networking
- ports
- volumes
- environment variables
- health checks

### Testing

Determine what tests already exist.

Do not remove existing tests.

==================================================
PHASE 2 — DESIGN THE AI ARCHITECTURE
====================================

The target architecture should be:

User
↓
Next.js UI
↓
Next.js API Route
↓
Authentication
↓
Authorization / RBAC
↓
Input Validation
↓
AI Service Layer
↓
Ollama
↓
Local LLM
↓
Structured AI Response
↓
Validation
↓
Application Logic
↓
Database when necessary
↓
Response to UI

The AI provider MUST NOT be called directly from React/browser code.

The Ollama URL and model configuration must remain server-side.

Create a provider abstraction so the application does not become tightly coupled to Ollama.

For example, design something conceptually similar to:

lib/ai/
client.ts
provider.ts
prompts.ts
schemas.ts
assistant.ts
quiz-generator.ts
project-reviewer.ts

Use the project's existing conventions if they differ.

Do not blindly create these exact files if another architecture is more appropriate.

The important requirement is separation of concerns.

==================================================
PHASE 3 — OLLAMA
================

Use Ollama as the local development LLM provider.

First verify whether Ollama is installed/available in the current environment.

Because the application already uses Docker, prefer running Ollama through Docker Compose.

Do NOT unnecessarily require the developer to install Ollama directly on Windows/Linux/macOS if Docker can provide the service.

Add an Ollama service to the existing Docker Compose architecture.

The conceptual architecture should become:

Next.js
MongoDB
RustFS
Mongo Express if already used
Nginx if applicable
Ollama

Use a persistent Docker volume for Ollama models.

Do not store models inside the application container.

Configure Ollama through environment variables.

For example:

OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=<chosen-model>

Do not hard-code the model throughout the source code.

The exact model should be selected based on:

- available RAM
- CPU
- GPU availability
- Docker environment
- expected response quality
- reasonable local development performance

Before choosing the final model, inspect the environment and explain why it was selected.

Prefer a practical instruct model that works reliably with structured output.

Do not automatically download an unnecessarily huge model.

If a model requires excessive resources, choose a smaller model.

The final documentation must explain:

- how Ollama starts
- how the model is pulled
- how to verify Ollama
- how to verify the model
- how the application communicates with Ollama

The setup should be reproducible.

If Docker Compose does not automatically pull the model, provide a documented initialization mechanism.

For example, use an initialization script or documented command.

Do NOT download the model during every application startup.

The model must persist across restarts.

==================================================
PHASE 4 — AI FEATURE #1
AI LEARNING ASSISTANT
=====================

Implement a real AI Learning Assistant.

Purpose:

Students should be able to ask questions about their learning material.

The assistant should receive relevant course context.

Do not build a generic chatbot disconnected from the platform.

The assistant should understand:

- current course
- current lesson/content when available
- student role
- relevant educational context

The system should avoid pretending to know information that is not contained in the supplied context.

Design the API around a structure similar to:

POST /api/ai/assistant

Input should contain only the minimum necessary information.

For example:

{
"message": "...",
"courseId": "...",
"contentId": "..."
}

Do not trust user-provided userId.

Always obtain the authenticated user from the existing authentication system.

Validate all inputs.

Use Zod or the project's existing validation mechanism.

The API must:

1. authenticate the user
2. verify the user is allowed to access the course
3. retrieve relevant course/content information from MongoDB
4. construct a controlled prompt
5. call the AI provider
6. validate the AI response
7. return the result

Do not expose:

- Ollama URL
- internal infrastructure
- API keys
- system prompts
- database credentials

to the browser.

Implement:

- loading state
- empty state
- error state
- retry
- reasonable conversation UX
- clear indication that responses are AI-generated

Do not create a fake streaming experience if streaming is not properly implemented.

==================================================
PHASE 5 — AI FEATURE #2
AI QUIZ GENERATOR
=================

Implement an instructor-facing AI Quiz Generator.

This should be a meaningful AI feature.

An instructor should be able to select:

- course
- lesson/content
- number of questions
- difficulty

The AI should generate structured quiz data.

Example conceptual output:

{
"title": "...",
"questions": [
{
"question": "...",
"options": [
"...",
"...",
"...",
"..."
],
"correctAnswer": "...",
"explanation": "..."
}
]
}

Do NOT trust raw LLM JSON.

Use structured output if supported by the selected Ollama model/API.

Then validate the response with Zod.

If validation fails:

- do not save the result
- return a controlled error
- optionally retry once with a correction prompt

Never blindly persist invalid AI output.

The instructor MUST review generated content before it becomes official.

The AI should generate a draft, not automatically publish it.

This is important for human-in-the-loop AI design.

The UI should allow the instructor to:

- generate
- review
- edit
- regenerate
- approve

before saving/publishing.

==================================================
PHASE 6 — AI FEATURE #3
AI PROJECT FEEDBACK
===================

Implement an AI-assisted project/lab feedback feature.

Use the existing project/lab submission architecture.

The AI should analyze a student's project submission where the existing application already provides relevant information.

The AI can evaluate:

- completeness
- structure
- technical quality
- potential issues
- missing requirements
- improvement suggestions

The output should be structured.

For example:

{
"summary": "...",
"strengths": [],
"issues": [],
"recommendations": [],
"score": {
"value": 0,
"max": 100,
"reasoning": "..."
}
}

IMPORTANT:

Do not allow the AI to become the final authority on student evaluation.

The instructor must remain responsible for final validation.

Clearly label AI-generated feedback.

Do not automatically fail/pass a student based solely on AI output.

If the existing project submission model does not contain enough information to implement this safely, adapt the feature to the existing architecture rather than inventing fake data.

==================================================
PHASE 7 — PROMPT ENGINEERING
============================

Create a centralized prompt architecture.

Do not scatter giant prompt strings throughout API routes.

Create reusable prompt builders/templates.

For example:

- assistant system prompt
- quiz generation prompt
- project review prompt

Prompts should:

1. define the AI role
2. define the educational context
3. define available information
4. define output requirements
5. prevent unsupported claims
6. require concise useful responses
7. protect against prompt injection from course content/user input where possible

Treat course content and student input as untrusted data.

Do not allow user-controlled content to override the system's intended behavior.

Use clear delimiters around retrieved content.

Example conceptual structure:

SYSTEM INSTRUCTIONS

<context>
COURSE CONTENT
</context>

<student_question>
USER INPUT
</student_question>

Do not expose system prompts to users.

Create:

docs/prompt-engineering.md

Document:

- prompt design
- context injection
- structured outputs
- validation
- prompt injection considerations
- human-in-the-loop design

==================================================
PHASE 8 — AI RESPONSE SCHEMAS
=============================

Create strict schemas for AI outputs.

Use Zod or the existing validation library.

Create schemas for:

- assistant response
- quiz response
- project feedback response

AI output must pass validation before application logic uses it.

Handle:

- invalid JSON
- incomplete output
- unexpected fields
- wrong types
- hallucinated structure
- provider errors
- timeouts

Do not allow malformed AI output to crash the application.

==================================================
PHASE 9 — ERROR HANDLING
========================

Implement robust AI error handling.

Handle:

- Ollama unavailable
- Ollama container stopped
- model missing
- request timeout
- malformed response
- validation failure
- database failure
- unauthorized request
- forbidden course access
- rate limiting if implemented
- unexpected exceptions

Return safe API responses.

Do not return:

- stack traces
- internal file paths
- environment variables
- database connection strings
- internal infrastructure details

Use the project's existing error handling conventions.

==================================================
PHASE 10 — SECURITY
===================

Perform a security review specifically for AI.

Requirements:

### Authentication

All AI endpoints must require authentication.

### Authorization

Respect existing roles.

Student:

- learning assistant
- appropriate student AI features

Instructor:

- quiz generation
- project feedback
- appropriate instructor features

Admin:

- only if justified by existing architecture

Do not allow users to access another user's private information.

### Input validation

Validate all incoming fields.

Apply reasonable limits to:

- message length
- context length
- number of quiz questions
- other AI parameters

### Prompt injection

Treat user/course content as untrusted input.

Do not let content override system instructions.

### Secrets

Never expose:

- MongoDB credentials
- Ollama internal URL where unnecessary
- future cloud AI API keys
- authentication secrets

### Rate limiting

Evaluate whether AI endpoints require rate limiting.

If the project has no rate-limiting infrastructure, implement a lightweight appropriate mechanism or clearly document the limitation and provide a clean extension point.

Do not introduce an unnecessarily complex external infrastructure dependency just for this feature.

==================================================
PHASE 11 — DATABASE
===================

Before creating new MongoDB models, determine whether persistence is actually necessary.

Do NOT store every AI request by default.

If conversation history is useful, design a proper model.

If quiz drafts need persistence, use the existing course/content architecture when appropriate.

If AI project feedback should be saved, design it so that:

- AI-generated feedback is distinguishable from instructor feedback
- timestamps exist
- author/source is clear
- instructor approval is clear
- old feedback can be identified

Do not modify existing schemas unnecessarily.

Preserve backward compatibility.

==================================================
PHASE 12 — FRONTEND UX
======================

Integrate AI naturally into the existing UI.

Do not make the application look like a separate AI demo.

Follow the existing:

- Tailwind design
- components
- typography
- spacing
- responsive behavior
- dark/light theme if present
- icons
- loading patterns

Add:

### Student

AI Learning Assistant.

### Instructor

AI Quiz Generator.

AI Project Feedback.

The UI must clearly distinguish:

AI-generated content
vs
human-approved content.

Provide useful states:

- idle
- loading
- success
- error
- retry
- empty
- validation failure

Do not freeze the page while AI requests execute.

==================================================
PHASE 13 — AI SERVICE ABSTRACTION
=================================

Design the AI service so Ollama is the current provider, but the application is not permanently locked to Ollama.

Create a provider abstraction.

Conceptually:

AIProvider
generateText()
generateStructured()
healthCheck()

Then:

OllamaProvider

Later we could add:

OpenAIProvider
GeminiProvider

without changing application-level features.

Do not over-engineer this.

Keep the abstraction small and practical.

==================================================
PHASE 14 — AI HEALTH CHECK
==========================

Implement an internal health check for AI.

The application should be able to determine whether:

- Ollama is reachable
- configured model exists
- AI service is operational

Do not expose sensitive infrastructure information to normal users.

If an admin/system health page already exists, integrate the AI health status there if appropriate.

Otherwise create a small internal health endpoint following the project's existing architecture.

Example conceptual endpoint:

GET /api/ai/health

The endpoint should return safe information such as:

{
"available": true,
"provider": "ollama"
}

Do not expose credentials.

==================================================
PHASE 15 — DOCKER INTEGRATION
=============================

Update Docker Compose carefully.

Existing services must continue working.

Expected architecture:

services:
app
mongo
rustfs
mongo-express if currently used
nginx if currently used
ollama

Add:

- Ollama volume
- appropriate network
- health check if practical
- environment configuration

The Next.js application must communicate with:

http://ollama:11434

inside Docker.

IMPORTANT:

Do not use localhost from the Next.js container to reach Ollama.

Inside Docker:

localhost means the current container.

Use the Docker service name.

Document the difference between:

Docker-to-Docker communication

and

host-to-container communication.

==================================================
PHASE 16 — MODEL INITIALIZATION
===============================

Create a reliable local setup process.

For example:

1. Start infrastructure.
2. Start Ollama.
3. Pull model.
4. Verify model.
5. Start application.

The exact implementation should fit the existing project.

Avoid downloading the model every time docker compose starts.

The model must persist using a named Docker volume.

Provide clear commands in documentation.

For example conceptually:

docker compose up -d ollama

then:

docker compose exec ollama ollama pull <MODEL>

Then verify.

Use the actual model selected for this project.

==================================================
PHASE 17 — TESTING
==================

Add tests for AI functionality.

At minimum test:

### AI assistant

- authenticated request succeeds
- unauthenticated request rejected
- unauthorized course access rejected
- invalid input rejected
- provider failure handled

### Quiz generator

- valid structured output accepted
- invalid output rejected
- instructor-only access
- generated content is not automatically published

### Project feedback

- authorized access
- invalid AI response handled
- instructor approval remains required

### AI provider

Test:

- successful response
- timeout
- unavailable Ollama
- malformed response

Mock Ollama in automated tests.

Do NOT require a real LLM running for every unit test.

Tests should be deterministic.

If the project currently lacks a testing framework, choose an appropriate lightweight setup compatible with the existing Next.js/TypeScript architecture.

Document how to run tests.

==================================================
PHASE 18 — LINT / TYPECHECK / BUILD
===================================

After implementation run:

- lint
- typecheck
- tests
- production build

Fix all errors introduced by the implementation.

Do not suppress TypeScript errors with:

any

unless absolutely necessary.

Do not disable ESLint rules simply to make the build pass.

Do not hide errors.

==================================================
PHASE 19 — ENVIRONMENT VARIABLES
================================

Create/update:

.env.example

Document AI configuration.

For example:

OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=<selected-model>

Use the actual variable naming convention of the project.

Never commit:

.env
.env.local
real secrets
real credentials
real API keys

Do not expose Ollama configuration through NEXT*PUBLIC*\* variables unless there is a legitimate browser-side requirement.

The browser should call our own Next.js API.

==================================================
PHASE 20 — SECURITY AUDIT OF EXISTING PROJECT
=============================================

Because this is a capstone, use this opportunity to perform a broader security audit.

Inspect:

- authentication
- authorization
- API routes
- input validation
- file upload
- object storage
- MongoDB queries
- password handling
- session handling
- secrets
- Docker configuration
- Nginx
- CORS if applicable
- exposed admin functionality
- exposed infrastructure

Identify vulnerabilities.

Fix issues that are clearly safe to fix without breaking functionality.

For larger changes, document them instead of making risky modifications.

Also inspect Git history for accidentally committed secrets.

If secrets are found:

DO NOT print the secret values.

Report only:

- file
- type of secret
- commit/location

Then explain the required remediation.

==================================================
PHASE 21 — DOCUMENTATION
========================

Update README.md professionally.

Add:

## AI Features

Explain:

1. AI Learning Assistant
2. AI Quiz Generator
3. AI Project Feedback

Explain that Ollama is used for local LLM inference.

Add:

## AI Architecture

Explain the flow:

Browser
→ Next.js
→ Auth
→ AI API
→ AI Service
→ Ollama
→ LLM
→ Validation
→ Response

Add:

## Local AI Setup

Explain exactly:

1. install prerequisites
2. clone repository
3. configure environment
4. start Docker
5. start Ollama
6. pull model
7. verify model
8. start application
9. verify AI

Include exact commands based on the final implementation.

Add:

## AI Environment Variables

Document variables without exposing secrets.

Add:

## Testing

Document commands.

==================================================
PHASE 22 — CREATE AI ARCHITECTURE DOCUMENT
==========================================

Create:

docs/ai-architecture.md

Include:

1. Purpose
2. AI use cases
3. Architecture diagram
4. Request lifecycle
5. Authentication
6. Authorization
7. Prompt construction
8. Ollama integration
9. Structured output
10. Validation
11. Error handling
12. Security
13. Human-in-the-loop
14. Future provider abstraction

Include a Mermaid diagram if compatible with the repository documentation.

Example conceptual architecture:

flowchart TD
U[User]
UI[Next.js UI]
API[Next.js API]
AUTH[Authentication]
RBAC[Authorization]
VALIDATE[Input Validation]
AI[AI Service]
OLLAMA[Ollama]
MODEL[Local LLM]
OUTPUT[Output Validation]
DB[(MongoDB)]

```
U --> UI
UI --> API
API --> AUTH
AUTH --> RBAC
RBAC --> VALIDATE
VALIDATE --> AI
AI --> OLLAMA
OLLAMA --> MODEL
MODEL --> OUTPUT
OUTPUT --> API
API --> UI
```

Adapt the diagram to the actual final architecture.

==================================================
PHASE 23 — CREATE PROMPT ENGINEERING DOCUMENT
=============================================

Create:

docs/prompt-engineering.md

Explain:

- system instructions
- user input
- educational context
- delimiters
- prompt injection defense
- structured output
- schema validation
- hallucination mitigation
- human review
- limitations of local LLMs

Include examples of the architecture of prompts, but do not expose sensitive internal prompts if they contain secrets or implementation-sensitive information.

==================================================
PHASE 24 — CREATE AI TESTING DOCUMENT
=====================================

Create:

docs/ai-testing.md

Document:

- unit testing
- API testing
- mocked AI provider
- schema validation
- failure scenarios
- security testing
- prompt injection testing
- Ollama availability testing
- deterministic testing strategy

Explain why tests should not depend on a live LLM.

==================================================
PHASE 25 — FINAL CAPSTONE DOCUMENTATION
=======================================

Update/create:

docs/final-product-review.md
docs/final-release-checklist.md
docs/architecture.md
docs/portfolio-case-study.md

These must reflect the actual AI-powered implementation.

Do not write fictional claims.

The documentation must be based on what was actually implemented.

The project description should evolve toward:

AI-Powered E-Learning Platform

but use a professional name that fits the actual implementation.

==================================================
PHASE 26 — README QUALITY
=========================

The README should contain:

# Project Name

One sentence description.

## Problem

What problem does this platform solve?

## Solution

How does the platform solve it?

## AI Capabilities

What AI features exist?

## Core Features

Existing platform capabilities.

## AI Architecture

High-level architecture.

## Tech Stack

Include:

- Next.js
- TypeScript
- React
- Tailwind
- MongoDB
- Mongoose
- NextAuth
- RustFS
- Docker
- Ollama
- selected LLM

Only mention technologies actually used.

## Requirements

Document:

- Node
- Docker
- Docker Compose
- Ollama only if actually required outside Docker

## Installation

Exact steps.

## Environment Variables

Complete .env.example documentation.

## Running Locally

Exact Docker commands.

## AI Setup

Exact Ollama/model commands.

## Testing

Exact commands.

## API Examples

Include useful AI API examples.

Do not expose secrets.

## Architecture

Link to architecture documentation.

## Security

Link to security documentation if created.

## Screenshots

Add screenshots when available.

## Future Improvements

Include:

- RAG
- embeddings
- vector database
- provider switching
- evaluation framework
- streaming
- observability

Only present these as future work if they are not implemented.

==================================================
PHASE 27 — API DOCUMENTATION
============================

Create:

docs/api.md

Document AI endpoints.

For each endpoint include:

- method
- route
- authentication
- authorization
- request body
- validation
- response
- error responses

Example:

POST /api/ai/assistant

POST /api/ai/quiz

POST /api/ai/project-review

GET /api/ai/health

Use the actual final routes.

==================================================
PHASE 28 — CAPSTONE DEMONSTRATION
=================================

Create:

docs/demo-script.md

Create a 3–5 minute demo.

Structure:

0:00–0:30
Problem and project introduction.

0:30–1:30
Existing platform.

1:30–2:30
AI Learning Assistant.

2:30–3:15
AI Quiz Generator.

3:15–3:45
AI Project Feedback.

3:45–4:30
Architecture/security/testing.

4:30–5:00
Conclusion and future improvements.

The demo should prove that the AI is actually integrated into the application.

==================================================
PHASE 29 — INTERVIEW PREPARATION
================================

Create:

docs/interview-questions.md

Prepare answers for at least:

1. Why did you choose Ollama?
2. Why did you integrate AI into this project instead of creating a separate AI application?
3. How does the application prevent users from calling the LLM directly?
4. How do you protect AI endpoints?
5. How do you validate LLM output?
6. How do you handle hallucinations?
7. How do you handle prompt injection?
8. Why use structured output?
9. Why is human approval required for AI-generated quizzes/project feedback?
10. How would you move from Ollama to OpenAI/Gemini in production?
11. How would you implement RAG?
12. How would you evaluate AI quality?
13. How would you handle thousands of AI requests?
14. How would you reduce AI latency?
15. What are the limitations of your current implementation?

Answers must reflect the actual project.

==================================================
PHASE 30 — LINKEDIN POST
========================

Create:

docs/linkedin-post.md

Write a professional LinkedIn project announcement.

Mention:

- project problem
- engineering solution
- AI integration
- Ollama
- Next.js
- TypeScript
- MongoDB
- Docker
- lessons learned

Do not exaggerate.

==================================================
PHASE 31 — GITHUB QUALITY
=========================

Prepare the repository for public review.

Check:

- repository name
- repository description
- README
- topics
- screenshots
- docs
- .gitignore
- .env.example
- no secrets
- no temporary files
- no unnecessary generated files
- no credentials
- no debugging code
- no console spam
- no TODOs that indicate unfinished critical functionality

Do not delete useful project files without reason.

==================================================
PHASE 32 — PERFORMANCE
======================

Evaluate AI performance.

Consider:

- model size
- response latency
- context size
- timeout
- token/output limits
- concurrent requests
- Docker resources

Do not implement premature optimization.

Document practical limitations.

If streaming is not implemented, document it as a future improvement.

==================================================
PHASE 33 — OPTIONAL FUTURE RAG ARCHITECTURE
===========================================

Do NOT implement RAG unless it is genuinely justified and can be implemented cleanly within the available time/resources.

However, design the architecture so RAG can be added later.

Future architecture:

Course documents
↓
Chunking
↓
Embeddings
↓
Vector Database
↓
Semantic Search
↓
Relevant Context
↓
Ollama
↓
Grounded Answer

Document this as a future improvement unless implemented.

Do not claim that the current assistant is RAG-based if it is not.

==================================================
PHASE 34 — QUALITY GATE
=======================

Before considering the implementation complete, run:

1. TypeScript check
2. ESLint
3. Tests
4. Production build
5. Docker Compose validation
6. Start all services
7. Verify MongoDB
8. Verify RustFS
9. Verify Ollama
10. Verify model
11. Verify Next.js
12. Verify AI health
13. Test AI assistant
14. Test quiz generation
15. Test project feedback
16. Test unauthorized access
17. Test invalid input
18. Test Ollama unavailable
19. Test malformed AI output
20. Test application restart

Do not declare success if critical tests fail.

==================================================
PHASE 35 — FINAL REPORT
=======================

At the end, provide a detailed implementation report.

Include:

### 1. What was analyzed

### 2. Existing architecture

### 3. What was changed

### 4. New files

### 5. Modified files

### 6. AI architecture

### 7. Ollama setup

### 8. Selected model

Explain why it was selected.

### 9. AI features

### 10. Security improvements

### 11. Tests added

### 12. Documentation added

### 13. Commands to run locally

### 14. Known limitations

### 15. Future improvements

### 16. Files that need manual review

### 17. Remaining TODOs

==================================================
CRITICAL ENGINEERING RULES
==========================

1. DO NOT rewrite the project.
2. DO NOT remove working functionality.
3. DO NOT change authentication unnecessarily.
4. DO NOT change database architecture unnecessarily.
5. DO NOT expose secrets.
6. DO NOT put Ollama calls in browser code.
7. DO NOT trust LLM output.
8. DO NOT store unvalidated AI output.
9. DO NOT allow AI to make final academic decisions automatically.
10. DO NOT fabricate project features.
11. DO NOT claim RAG if RAG is not implemented.
12. DO NOT use fake AI responses.
13. DO NOT hard-code the model name everywhere.
14. DO NOT hard-code the Ollama URL throughout the application.
15. DO NOT use localhost for Docker-to-Docker communication.
16. DO NOT make automated tests depend on a running LLM.
17. DO NOT suppress errors just to make builds pass.
18. DO NOT use `any` unnecessarily.
19. DO NOT disable ESLint unnecessarily.
20. DO NOT introduce unnecessary dependencies.
21. Prefer existing project utilities and conventions.
22. Keep the architecture modular.
23. Keep AI provider-specific code isolated.
24. Keep authentication and authorization server-side.
25. Treat all user/course content as untrusted input.
26. Validate both API input and AI output.
27. Keep instructor approval in the loop for generated educational content.
28. Preserve existing Docker services.
29. Preserve existing MongoDB data compatibility.
30. Make the final project understandable to another engineer.

==================================================
IMPORTANT EXECUTION STRATEGY
============================

Do not make all changes blindly in one step.

Work incrementally.

Recommended order:

STEP 1
Audit repository.

STEP 2
Design AI architecture.

STEP 3
Implement Ollama Docker integration.

STEP 4
Verify Ollama independently.

STEP 5
Implement AI provider abstraction.

STEP 6
Implement AI health check.

STEP 7
Implement AI Learning Assistant.

STEP 8
Test assistant.

STEP 9
Implement AI Quiz Generator.

STEP 10
Test quiz generator.

STEP 11
Implement AI Project Feedback.

STEP 12
Test project feedback.

STEP 13
Perform security review.

STEP 14
Add automated tests.

STEP 15
Run lint/typecheck/build.

STEP 16
Update Docker documentation.

STEP 17
Update README.

STEP 18
Create architecture documentation.

STEP 19
Create prompt engineering documentation.

STEP 20
Create AI testing documentation.

STEP 21
Create capstone documentation.

STEP 22
Create demo script.

STEP 23
Create interview questions.

STEP 24
Perform final repository audit.

==================================================
VERY IMPORTANT
==============

Before each major modification:

- inspect the relevant existing code
- understand its conventions
- make the smallest clean change
- verify the change
- continue

If you discover an architectural problem that prevents safe AI integration:

STOP and explain the issue before making a risky change.

If a requirement conflicts with existing architecture:

prefer preserving working functionality and propose the safest integration.

Do not invent missing information.

Use actual file paths and actual project structures.

At the end, provide me with:

- complete list of changed files
- complete list of created files
- exact commands needed to start Ollama
- exact command needed to pull the selected model
- exact Docker Compose commands
- exact test commands
- exact URLs/endpoints to test
- final architecture summary
- known limitations
- recommended next steps

The goal is not simply "add AI".

The goal is to transform this existing e-learning application into a credible AI engineering capstone demonstrating:

- full-stack engineering
- AI integration
- local LLM infrastructure
- prompt engineering
- structured LLM outputs
- validation
- authentication
- authorization
- security
- testing
- Docker
- documentation
- human-in-the-loop AI
- production-oriented architecture
- engineering decision making

Do the work carefully and professionally.
