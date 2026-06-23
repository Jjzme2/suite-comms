import type { AIModel } from '~/types'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const models: AIModel[] = []

  // ── Anthropic (Claude) — always shown, greyed without key ──────────────────
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
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set'
    },
    {
      id: 'claude-haiku-4-5-20251001',
      name: 'Claude Haiku 4.5',
      provider: 'anthropic',
      hosting: 'cloud',
      description: 'Fast and efficient',
      contextLength: 200000,
      available: hasAnthropic,
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set'
    },
    {
      id: 'claude-opus-4-8',
      name: 'Claude Opus 4.8',
      provider: 'anthropic',
      hosting: 'cloud',
      description: 'Most capable Claude model',
      contextLength: 200000,
      available: hasAnthropic,
      unavailableReason: hasAnthropic ? undefined : 'ANTHROPIC_API_KEY not set'
    }
  )

  // ── Google Gemini — always shown, greyed without key ──────────────────────
  const hasGemini = !!config.geminiApiKey
  models.push(
    {
      id: 'gemini:gemini-3.5-flash',
      name: 'Gemini 3.5 Flash',
      provider: 'google',
      hosting: 'cloud',
      description: 'Most capable Gemini — fastest for agentic and coding tasks',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set'
    },
    {
      id: 'gemini:gemini-2.5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      hosting: 'cloud',
      description: 'Advanced reasoning and deep thinking',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set'
    },
    {
      id: 'gemini:gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      provider: 'google',
      hosting: 'cloud',
      description: 'Best price-performance for low-latency tasks',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set'
    },
    {
      id: 'gemini:gemini-2.5-flash-lite',
      name: 'Gemini 2.5 Flash Lite',
      provider: 'google',
      hosting: 'cloud',
      description: 'Fastest and most budget-friendly Gemini',
      contextLength: 1048576,
      available: hasGemini,
      unavailableReason: hasGemini ? undefined : 'GEMINI_API_KEY not set'
    }
  )

  // ── OpenRouter — dynamic model list, only when key present ────────────────
  if (config.openRouterApiKey) {
    try {
      const res = await $fetch<{
        data: { id: string; name: string; context_length: number; description?: string }[]
      }>('https://openrouter.ai/api/v1/models', {
        headers: { Authorization: `Bearer ${config.openRouterApiKey}` },
        timeout: 5000
      })
      for (const m of res.data ?? []) {
        models.push({
          id: `openrouter:${m.id}`,
          name: m.name || m.id,
          provider: 'openrouter',
          hosting: 'cloud',
          description: m.description,
          contextLength: m.context_length,
          available: true
        })
      }
    } catch { /* OpenRouter unreachable */ }
  }

  // ── Ollama (local) — dynamic, only when running ───────────────────────────
  try {
    const res = await $fetch<{ models: { name: string }[] }>(
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
        available: true
      })
    }
  } catch { /* Ollama not running */ }

  // ── LM Studio (local-cloud) — dynamic, only when running ─────────────────
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
        available: true
      })
    }
  } catch { /* LM Studio not running */ }

  return models
})
