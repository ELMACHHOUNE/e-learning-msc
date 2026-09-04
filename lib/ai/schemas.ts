import { z } from 'zod'

export const AssistantResponseSchema = z.object({
  answer: z.string().min(1).max(4000),
  confidence: z.enum(['high', 'medium', 'low']),
  relevantTopics: z.array(z.string()).max(5),
  suggestedFollowUp: z.array(z.string()).max(5),
})

export type AssistantResponse = z.infer<typeof AssistantResponseSchema>

export const QuizQuestionSchema = z.object({
  question: z.string().min(10).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(6),
  correctAnswer: z.string().min(1).max(200),
  explanation: z.string().min(5).max(500),
})

export const QuizOutputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(500),
  questions: z.array(QuizQuestionSchema).min(1).max(20),
})

export type QuizOutput = z.infer<typeof QuizOutputSchema>
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>

export const ProjectFeedbackScoreSchema = z.object({
  value: z.number().min(0).max(100),
  max: z.literal(100),
  reasoning: z.string().min(10).max(500),
})

export const ProjectFeedbackSchema = z.object({
  summary: z.string().min(20).max(1000),
  strengths: z.array(z.string().min(5).max(300)).min(1).max(10),
  issues: z.array(z.string().min(5).max(300)).min(0).max(10),
  recommendations: z.array(z.string().min(5).max(300)).min(1).max(10),
  score: ProjectFeedbackScoreSchema,
})

export type ProjectFeedback = z.infer<typeof ProjectFeedbackSchema>
export type ProjectFeedbackScore = z.infer<typeof ProjectFeedbackScoreSchema>

export const AssistantRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  courseId: z.string().min(1),
  contentId: z.string().optional(),
})

export type AssistantRequest = z.infer<typeof AssistantRequestSchema>

export const QuizRequestSchema = z.object({
  courseId: z.string().min(1),
  contentId: z.string().optional(),
  questionCount: z.number().int().min(1).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
})

export type QuizRequest = z.infer<typeof QuizRequestSchema>

export const ProjectReviewRequestSchema = z.object({
  projectApplicationId: z.string().min(1),
})

export type ProjectReviewRequest = z.infer<typeof ProjectReviewRequestSchema>
