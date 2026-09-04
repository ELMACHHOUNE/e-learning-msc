# AI Testing

## Overview

Tests for AI functionality are designed to be deterministic and do not require a running LLM. The Ollama provider is mocked in automated tests.

## Testing Strategy

### Unit Tests

Test individual functions in isolation:
- Schema validation (Zod schemas)
- Prompt builders (output format)
- Error handling (custom error types)
- Provider abstraction (interface compliance)

### API Tests

Test API routes with mocked AI responses:
- Authentication/authorization
- Input validation
- Error responses
- Response format

### Integration Tests

Test with a real Ollama instance (optional):
- End-to-end AI flow
- Model response quality
- Timeout handling

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- lib/ai/schemas.test.ts
```

## Mocking Ollama

In tests, the AI provider is mocked to return predictable responses:

```typescript
import { resetAIProvider } from '@/lib/ai'

// Reset provider before each test
beforeEach(() => {
  resetAIProvider()
})

// Mock the provider
jest.mock('@/lib/ai/client', () => ({
  ollamaGenerate: jest.fn().mockResolvedValue({
    response: JSON.stringify({
      answer: 'Test answer',
      confidence: 'high',
      relevantTopics: ['test'],
      suggestedFollowUp: [],
    }),
    model: 'test-model',
    totalDuration: 100,
    evalCount: 50,
  }),
}))
```

## Test Cases

### AI Assistant

| Test | Description |
|------|-------------|
| Auth required | Unauthenticated requests return 401 |
| Student only | Non-student roles return 403 |
| Course access | Students not in course return 403 |
| Valid input | Valid request returns structured response |
| Invalid input | Missing fields return 400 |
| Provider failure | Ollama errors return 503 |
| Invalid AI output | Malformed JSON returns 502 |

### Quiz Generator

| Test | Description |
|------|-------------|
| Auth required | Unauthenticated requests return 401 |
| Instructor only | Student role returns 403 |
| Valid output | Structured quiz data returned |
| Invalid output | Schema validation failure returns 502 |
| Draft save | Quiz saved as draft status |

### Project Feedback

| Test | Description |
|------|-------------|
| Auth required | Unauthenticated requests return 401 |
| Instructor only | Student role returns 403 |
| Project exists | Missing project returns 404 |
| Valid output | Structured feedback returned |
| Invalid output | Schema validation failure returns 502 |

### AI Provider

| Test | Description |
|------|-------------|
| Successful response | Returns parsed result |
| Timeout | AITimeoutError thrown |
| Unavailable | AIProviderUnavailableError thrown |
| Malformed response | JSON parse error handled |

## Why Tests Don't Require LLM

1. **Determinism** — LLMs produce different outputs each time
2. **Speed** — Mocked tests run in milliseconds
3. **CI/CD** — No need to install Ollama in CI
4. **Reliability** — No network dependencies
5. **Cost** — No GPU/CPU usage for tests

## Security Testing

Test prompt injection defense:
- Verify user input is escaped in prompts
- Verify system prompts are not exposed
- Verify role-based access control
- Verify input length limits

## Future Improvements

- Property-based testing for schemas
- Fuzz testing for API inputs
- Contract testing for AI responses
- Evaluation framework for response quality
