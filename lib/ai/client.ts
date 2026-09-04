import { AITimeoutError, AIProviderUnavailableError, AIModelError } from './errors'

const DEFAULT_TIMEOUT = 60_000

export interface OllamaGenerateOptions {
  model: string
  prompt: string
  system?: string
  format?: 'json'
  timeout?: number
}

export interface OllamaGenerateResult {
  response: string
  model: string
  totalDuration: number
  evalCount: number
}

export interface OllamaModelInfo {
  name: string
  modifiedAt: string
  size: number
}

function getOllamaBaseUrl(): string {
  const url = process.env.OLLAMA_BASE_URL
  if (!url) throw new AIProviderUnavailableError('ollama', 'OLLAMA_BASE_URL not configured')
  return url.replace(/\/$/, '')
}

function getOllamaModel(): string {
  const model = process.env.OLLAMA_MODEL
  if (!model) throw new AIProviderUnavailableError('ollama', 'OLLAMA_MODEL not configured')
  return model
}

export async function ollamaGenerate(options: OllamaGenerateOptions): Promise<OllamaGenerateResult> {
  const baseUrl = getOllamaBaseUrl()
  const timeout = options.timeout ?? DEFAULT_TIMEOUT
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model,
        prompt: options.prompt,
        system: options.system,
        format: options.format,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error')
      throw new AIModelError(options.model, `HTTP ${response.status}: ${text}`)
    }

    const data = await response.json() as {
      response: string
      model: string
      total_duration?: number
      eval_count?: number
    }

    return {
      response: data.response,
      model: data.model,
      totalDuration: data.total_duration ?? 0,
      evalCount: data.eval_count ?? 0,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AITimeoutError('ollama', timeout)
    }
    if (error instanceof AIModelError || error instanceof AITimeoutError || error instanceof AIProviderUnavailableError) {
      throw error
    }
    throw new AIProviderUnavailableError('ollama', String(error))
  } finally {
    clearTimeout(timer)
  }
}

export async function ollamaHealthCheck(): Promise<{ available: boolean; model: string; modelLoaded: boolean }> {
  const baseUrl = getOllamaBaseUrl()
  const model = getOllamaModel()

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      return { available: false, model, modelLoaded: false }
    }

    const data = await response.json() as { models?: Array<{ name: string }> }
    const models = data.models ?? []
    const modelLoaded = models.some(
      (m) => m.name === model || m.name.startsWith(model + ':'),
    )

    return { available: true, model, modelLoaded }
  } catch {
    return { available: false, model, modelLoaded: false }
  }
}

export async function ollamaListModels(): Promise<OllamaModelInfo[]> {
  const baseUrl = getOllamaBaseUrl()

  try {
    const response = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) return []

    const data = await response.json() as { models?: Array<{ name: string; modified_at: string; size: number }> }
    return (data.models ?? []).map((m) => ({
      name: m.name,
      modifiedAt: m.modified_at,
      size: m.size,
    }))
  } catch {
    return []
  }
}

export { getOllamaModel }
