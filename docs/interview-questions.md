# Interview Questions — AI Integration

## 1. Why did you choose Ollama?

Ollama provides local LLM inference without external API dependencies. For a capstone project, this means:
- No API costs or rate limits
- Data stays on the server (privacy)
- Works offline / in air-gapped environments
- Easy Docker integration
- Can swap models without changing application code

The phi4-mini model was chosen because it runs reliably with 4-8GB RAM, has good structured output quality, and is fast enough for interactive use.

## 2. Why integrate AI into this project instead of creating a separate AI application?

The e-learning platform already had the infrastructure — authentication, course content, user roles, project submissions. Adding AI as features within the existing platform is more valuable than a standalone chatbot because:
- AI responses are grounded in actual course content
- Role-based access control is already in place
- The AI enhances existing workflows (quiz creation, project evaluation)
- It demonstrates integration skills, not just AI usage

## 3. How does the application prevent users from calling the LLM directly?

The Ollama URL and model configuration are server-side environment variables only. The browser never sees these. All AI calls go through Next.js API routes (`/api/ai/*`) which:
1. Verify authentication via NextAuth
2. Check role-based authorization
3. Validate input with Zod
4. Call Ollama server-side
5. Validate AI output before returning

There's no way for the browser to bypass the API and call Ollama directly.

## 4. How do you protect AI endpoints?

Multi-layer protection:
- **Authentication**: `requireRole()` from NextAuth verifies the user is logged in
- **Authorization**: Students → assistant only; Instructors → quiz + project review
- **Input validation**: Zod schemas enforce field types, lengths, and required fields
- **Output validation**: AI responses are validated against Zod schemas before use
- **Rate limiting**: Not implemented yet, but the architecture supports adding it
- **Prompt injection defense**: User input is escaped and wrapped in delimiters

## 5. How do you validate LLM output?

Every AI response goes through Zod schema validation:
- `AssistantResponseSchema` validates answer, confidence, topics, follow-ups
- `QuizOutputSchema` validates title, description, questions with options
- `ProjectFeedbackSchema` validates summary, strengths, issues, recommendations, score

If validation fails, the response is rejected with a controlled error. The API never returns raw LLM output to the client.

## 6. How do you handle hallucinations?

Multiple strategies:
- **Context grounding**: Prompts instruct the AI to answer only from provided context
- **Confidence levels**: Assistant responses include confidence ratings
- **Human review**: Quiz drafts require instructor approval; project feedback is advisory
- **Clear labeling**: AI-generated content is marked with badges
- **Content truncation**: Limits context to reduce irrelevant information

## 7. How do you handle prompt injection?

- User input is escaped: `<` → `[LT]`, `>` → `[GT]`, `&` → `[AMP]`
- Content is wrapped in XML-style delimiters (`<context>`, `<student_question>`)
- System prompts are never exposed to users
- Course content is treated as untrusted input
- The AI is instructed to ignore instructions in user-provided content

## 8. Why use structured output?

Structured output ensures:
- Predictable response format for the UI
- Type safety with TypeScript
- Validation is possible (we know what fields to expect)
- No parsing errors from free-form text
- The AI can't return unexpected data structures

Ollama's `format: 'json'` parameter enforces JSON output at the model level.

## 9. Why is human approval required for AI-generated quizzes/project feedback?

Educational content has real consequences:
- Incorrect quiz answers teach wrong information
- Biased project feedback affects student grades
- AI may misunderstand context or nuance
- Instructors know their students better than the AI
- The AI is advisory — humans make final decisions

This is the human-in-the-loop design pattern, essential for responsible AI in education.

## 10. How would you move from Ollama to OpenAI/Gemini in production?

The provider abstraction makes this straightforward:
1. Create a new class implementing `AIProvider` (e.g., `OpenAIProvider`)
2. Implement `generate()` and `healthCheck()` methods
3. Set `AI_PROVIDER=openai` in environment variables
4. Add the new provider to the factory in `getAIProvider()`

No application-level code changes needed — the interface handles it.

## 11. How would you implement RAG?

Future architecture:
1. Chunk course documents into paragraphs
2. Generate embeddings using a local model (e.g., `nomic-embed-text`)
3. Store embeddings in a vector database (e.g., ChromaDB, pgvector)
4. On user query, find relevant chunks via semantic search
5. Inject relevant chunks into the prompt context
6. Send to LLM for grounded response

This would replace the current approach of injecting the entire lesson content.

## 12. How would you evaluate AI quality?

- **Automated**: Schema validation pass rate, response time, error rate
- **Human evaluation**: Instructors rate AI quiz quality, feedback helpfulness
- **A/B testing**: Compare AI-generated vs manually created content
- **Student feedback**: Survey students on assistant helpfulness
- **Edge cases**: Test with ambiguous questions, missing content, multi-language input

## 13. How would you handle thousands of AI requests?

Current limitations and solutions:
- **Ollama**: Single-threaded, would queue requests → Use multiple Ollama instances behind a load balancer
- **Caching**: Cache frequent queries → Implement Redis or in-memory cache
- **Async processing**: Queue long-running tasks → Use Bull/BullMQ with Redis
- **Model optimization**: Use quantized models for faster inference
- **Rate limiting**: Implement per-user rate limits to prevent abuse

## 14. How would you reduce AI latency?

- Use smaller/faster models (phi3:mini is already optimized)
- Implement streaming for better perceived performance
- Cache responses for identical queries
- Pre-fetch model into GPU memory (Ollama keeps models loaded)
- Use a dedicated inference server instead of Docker
- Reduce prompt size by selecting relevant content chunks

## 15. What are the limitations of your current implementation?

- No conversation memory (stateless)
- No streaming responses
- No RAG for better context retrieval
- Local model quality is lower than cloud models
- Context window limits content to ~6000 characters
- No automated testing with real LLM (mocked only)
- No rate limiting implemented
- No A/B testing framework for prompt optimization
