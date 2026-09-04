export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

export class AITimeoutError extends AIServiceError {
  constructor(provider: string, timeoutMs: number) {
    super(`AI request timed out after ${timeoutMs}ms (${provider})`, 'AI_TIMEOUT', 504)
    this.name = 'AITimeoutError'
  }
}

export class AIProviderUnavailableError extends AIServiceError {
  constructor(provider: string, reason?: string) {
    super(`AI provider "${provider}" is unavailable${reason ? `: ${reason}` : ''}`, 'AI_PROVIDER_UNAVAILABLE', 503)
    this.name = 'AIProviderUnavailableError'
  }
}

export class AIResponseValidationError extends AIServiceError {
  constructor(details: string) {
    super(`AI response failed validation: ${details}`, 'AI_VALIDATION_ERROR', 502)
    this.name = 'AIResponseValidationError'
  }
}

export class AIModelError extends AIServiceError {
  constructor(model: string, reason: string) {
    super(`AI model "${model}" error: ${reason}`, 'AI_MODEL_ERROR', 502)
    this.name = 'AIModelError'
  }
}
