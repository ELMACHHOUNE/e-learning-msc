# Prompt Engineering

## Overview

All prompts are centralized in `lib/ai/prompts.ts`. No prompt strings are scattered across API routes. Each prompt builder follows a consistent structure: system instructions, context injection, and user input.

## Prompt Architecture

### Structure

```
SYSTEM INSTRUCTIONS (role, rules, output format)
    ↓
<context>
COURSE CONTENT (escaped, delimited)
</context>
    ↓
<student_question>
USER INPUT (escaped, delimited)
</student_question>
```

### Components

1. **System Instructions** — Define the AI's role, capabilities, and constraints
2. **Context** — Course content retrieved from MongoDB, wrapped in XML-style delimiters
3. **User Input** — Student question or generation parameters, escaped and delimited

## Prompt Builders

### `buildAssistantPrompt()`

Used by: AI Learning Assistant

- Injects course title, description, and optional lesson content
- Truncates content to 6000 chars to stay within model context limits
- Escapes `<`, `>`, `&` characters in user/content to prevent delimiter injection
- Requires JSON output with: answer, confidence, relevantTopics, suggestedFollowUp

### `buildQuizPrompt()`

Used by: AI Quiz Generator

- Injects course title and optional lesson content
- Specifies question count and difficulty level
- Requires JSON output with: title, description, questions[]

### `buildProjectReviewPrompt()`

Used by: AI Project Feedback

- Injects lab phase details, student name, and submission URLs/scores
- Requires JSON output with: summary, strengths, issues, recommendations, score

## Prompt Injection Defense

### Delimiters

All user-controlled content is wrapped in XML-style tags:
```xml
<context>...</context>
<student_question>...</student_question>
```

### Escaping

Characters that could break delimiters are escaped:
- `<` → `[LT]`
- `>` → `[GT]`
- `&` → `[AMP]`

### Content Truncation

Course content is truncated to 6000 characters to:
1. Stay within model context limits
2. Reduce attack surface
3. Maintain response quality

### System Prompt Isolation

System prompts are never sent to the client. They exist only in `lib/ai/prompts.ts` and are constructed server-side.

## Structured Output

All prompts request JSON output. The `format: 'json'` parameter is passed to Ollama to enforce JSON mode.

## Schema Validation

Every AI response is validated against a Zod schema before use:
- `AssistantResponseSchema` — validates assistant responses
- `QuizOutputSchema` — validates quiz generation output
- `ProjectFeedbackSchema` — validates project feedback output

Invalid responses are rejected with controlled error messages.

## Hallucination Mitigation

1. **Context grounding** — Prompts explicitly instruct the AI to answer only from provided context
2. **Confidence levels** — Assistant responses include confidence ratings (high/medium/low)
3. **Source attribution** — Prompts reference specific course content
4. **Human review** — All generated content requires instructor approval
5. **Clear disclaimers** — AI-generated content is labeled as such

## Limitations

- Local LLMs (phi3:mini) have lower quality than cloud models
- Context window limits content to ~6000 characters
- No streaming — responses are generated synchronously
- No conversation memory across requests (stateless)
- Response quality depends on course content quality

## Future Improvements

- RAG with embeddings for better context retrieval
- Conversation history for multi-turn interactions
- Streaming responses for better UX
- Evaluation framework for prompt quality
