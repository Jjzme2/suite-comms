import type { AIModel } from '~/types'
import { createLogger } from '~/server/utils/logger'

// ── Helpers ──────────────────────────────────────────────────────────────────

function ollamaSupportsTools(name: string): boolean {
  const n = name.toLowerCase()
  return (
    /llama3\.[1-9]/.test(n) ||
    n.includes('llama3.3') ||
    n.includes('mistral') ||
    n.includes('mixtral') ||
    n.includes('qwen2.5') ||
    n.includes('qwen3') ||
    n.includes('phi3') ||
    n.includes('phi4') ||
    n.includes('command-r') ||
    n.includes('hermes') ||
    n.includes('firefunction') ||
    n.includes('nexusraven')
  )
}

function ollamaSupportsVision(name: string): boolean {
  const n = name.toLowerCase()
  return (
    n.includes('llava') ||
    n.includes('bakllava') ||
    n.includes('minicpm-v') ||
    n.includes('moondream') ||
    n.includes('llama3.2-vision') ||
    n.includes('vision') ||
    n.includes('gemma3') ||
    n.includes('phi3-vision')
  )
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default defineEventHandler(async () => {
  const log = createLogger('api/ai/models')
  const config = useRuntimeConfig()
  const models: AIModel[] = []

  // ── Anthropic — always shown, greyed without key ──────────────────────────
  const hasAnthropic = !!config.anthropicApiKey
  models.push(
    {
      id: 'claude-sonnet-4-6',
      name: 'Claude Sonnet 4.6',
      provider: 'anthropic',
      hosting: 'cloud',
      description: 'Balanced intelligence and speed',
      contextLength: 200000,
      available: hasAnthropic,
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      provider: 'anthropic',
      hosting: 'cloud',
      description: 'Fast and efficient',
      contextLength: 200000,
      available: hasAnthropic,
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    },
    {
      id: 'claude-opus-4-8',
      name: 'Claude Opus 4.8',
      provider: 'anthropic',
      hosting: 'cloud',
      description: 'Most capable Claude model',
      contextLength: 200000,
      available: hasAnthropic,
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    }
  )

  // ── Google Gemini — always shown, greyed without key ──────────────────────
  const hasGemini = !!config.geminiApiKey
  models.push(
    {
      id: 'gemini:gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      hosting: 'cloud',
      description: 'Advanced reasoning and deep thinking',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    },
    {
      id: 'gemini:gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      hosting: 'cloud',
      description: 'Best price-performance for low-latency tasks',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    },
    {
      id: 'gemini:gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'google',
      hosting: 'cloud',
      description: 'Fastest and most budget-friendly Gemini',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set',
      supportsTools: true,
      supportsVision: true
    }
  )

  // ── OpenRouter — dynamic model list, only when key present ────────────────
  if (config.openRouterApiKey) {
    try {
      const res = await $fetch<{
        data: {
          id: string
          name: string
          context_length: number
          description?: string
          supported_parameters?: string[]
          architecture?: {
            input_modalities?: string[]
            output_modalities?: string[]
          }
        }[]
      }>('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${config.openRouterApiKey}` },
        timeout: 5000
      })
      for (const m of res.data ?? []) {
        const supportsTools = m.supported_parameters?.includes('tools') ?? false
        const supportsVision = m.architecture?.input_modalities?.includes('image') ?? false
        // Known image generation models via OpenRouter
        const supportsImageGen = m.architecture?.output_modalities?.includes('image') ?? false
        models.push({
          id: `openrouter:${m.id}`,
          name: m.name || m.id,
          provider: 'openrouter',
          hosting: 'cloud',
          description: m.description,
          contextLength: m.context_length,
          available: true,
          supportsTools,
          supportsVision,
          supportsImageGen
        })
      }
      log.info('OpenRouter models fetched', { count: res.data?.length ?? 0 })
    } catch (err) {
      log.warn('OpenRouter model fetch failed', { error: String(err) })
    }
  }

  // ── Ollama — dynamic, only when running ──────────────────────────────────
  try {
    const res = await $fetch<{ models: { name: string; details?: { families?: string[] } }[] }>(
      'http://localhost:11434/api/tags',
      { timeout: 2000 }
    )
    for (const m of res.models ?? []) {
      models.push({
        id: `ollama:${m.name}`,
        name: m.name,
        provider: 'ollama',
        hosting: 'local',
        description: 'Local model via Ollama',
        available: true,
        supportsTools: ollamaSupportsTools(m.name),
        supportsVision: ollamaSupportsVision(m.name)
      })
    }
    log.info('Ollama models fetched', { count: res.models?.length ?? 0 })
  } catch {
    // Ollama not running — silent
  }

  // ── LM Studio — dynamic, only when running ────────────────────────────────
  try {
    const res = await $fetch<{ data: { id: string }[] }>(
      'http://localhost:1234/v1/models',
      { timeout: 2000 }
    )
    for (const m of res.data ?? []) {
      models.push({
        id: `lmstudio:${m.id}`,
        name: m.id,
        provider: 'lmstudio',
        hosting: 'local-cloud',
        description: 'Model via LM Studio',
        available: true,
        // LM Studio doesn't expose capability metadata — assume tools if name matches known patterns
        supportsTools: ollamaSupportsTools(m.id),
        supportsVision: ollamaSupportsVision(m.id)
      })
    }
    log.info('LM Studio models fetched', { count: res.data?.length ?? 0 })
  } catch {
    // LM Studio not running — silent
  }

  log.info('Model list assembled', { total: models.length })
  return models
})
