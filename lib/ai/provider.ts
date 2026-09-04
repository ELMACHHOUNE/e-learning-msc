import { ollamaGenerate, ollamaHealthCheck, getOllamaModel } from './client'
import { AIProviderUnavailableError } from './errors'

export interface AIGenerateOptions {
  prompt: string
  system?: string
  format?: 'json'
  timeout?: number
}

export interface AIGenerateResult {
  response: string
  model: string
  totalDuration: number
  evalCount: number
}

export interface AIHealthResult {
  available: boolean
  provider: string
  model: string
  modelLoaded: boolean
}

export interface AIProvider {
  generate(options: AIGenerateOptions): Promise<AIGenerateResult>
  healthCheck(): Promise<AIHealthResult>
  readonly name: string
}

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama'

  async generate(options: AIGenerateOptions): Promise<AIGenerateResult> {
    const model = getOllamaModel()
    return ollamaGenerate({
      model,
      prompt: options.prompt,
      system: options.system,
      format: options.format,
      timeout: options.timeout,
    })
  }

  async healthCheck(): Promise<AIHealthResult> {
    const result = await ollamaHealthCheck()
    return {
      ...result,
      provider: this.name,
    }
  }
}

let defaultProvider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (!defaultProvider) {
    const providerName = process.env.AI_PROVIDER ?? 'ollama'
    switch (providerName) {
      case 'ollama':
        defaultProvider = new OllamaProvider()
        break
      default:
        defaultProvider = new OllamaProvider()
    }
  }
  return defaultProvider
}

export function resetAIProvider(): void {
  defaultProvider = null
}

export async function generateText(options: AIGenerateOptions): Promise<string> {
  const provider = getAIProvider()
  const result = await provider.generate(options)
  return result.response
}

export async function generateStructured<T>(options: AIGenerateOptions): Promise<T> {
  const provider = getAIProvider()
  const result = await provider.generate({ ...options, format: 'json' })

  let parsed: unknown
  try {
    parsed = JSON.parse(result.response)
  } catch {
    throw new AIProviderUnavailableError(provider.name, 'Response was not valid JSON')
  }

  return parsed as T
}
