export { getAIProvider, generateText, generateStructured, resetAIProvider } from './provider'
export type { AIProvider, AIGenerateOptions, AIGenerateResult, AIHealthResult } from './provider'
export { OllamaProvider } from './provider'
export { ollamaGenerate, ollamaHealthCheck, ollamaListModels, getOllamaModel } from './client'
export { buildAssistantPrompt, buildQuizPrompt, buildProjectReviewPrompt } from './prompts'
export {
  AssistantResponseSchema,
  QuizOutputSchema,
  QuizQuestionSchema,
  ProjectFeedbackSchema,
  ProjectFeedbackScoreSchema,
  AssistantRequestSchema,
  QuizRequestSchema,
  ProjectReviewRequestSchema,
} from './schemas'
export type {
  AssistantResponse,
  QuizOutput,
  QuizQuestion,
  ProjectFeedback,
  ProjectFeedbackScore,
  AssistantRequest,
  QuizRequest,
  ProjectReviewRequest,
} from './schemas'
export { processAssistantRequest } from './assistant'
export { processQuizRequest } from './quiz-generator'
export { processProjectReview } from './project-reviewer'
export {
  AIServiceError,
  AITimeoutError,
  AIProviderUnavailableError,
  AIResponseValidationError,
  AIModelError,
} from './errors'
