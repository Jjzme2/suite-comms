import type { AIModel } from '~/types'

// Module-level singleton — all component instances share the same reactive state
const models = ref<AIModel[]>([
  {
    id: 'claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'anthropic',
    hosting: 'cloud',
    description: 'Balanced intelligence and speed',
    contextLength: 200000,
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
    supportsTools: true,
    supportsVision: true
  },
  {
    id: 'gemini:gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    hosting: 'cloud',
    description: 'Advanced reasoning and deep thinking',
    contextLength: 1048576,
    available: false,
    unavailableReason: 'GEMINI_API_KEY not set',
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
    available: false,
    unavailableReason: 'GEMINI_API_KEY not set',
    supportsTools: true,
    supportsVision: true
  }
])

const loading = ref(false)

// Runtime unavailability — persists for the page session
const runtimeUnavailable = reactive<Record<string, string>>({})

export function useAIModels() {
  async function fetchLocalModels(): Promise<AIModel[]> {
    const local: AIModel[] = []

    try {
      const res = await $fetch<{ models: { name: string }[] }>(
        'http://localhost:11434/api/tags',
        { timeout: 2000 }
      )
      for (const m of res.models ?? []) {
        local.push({
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
    } catch {}

    try {
      const res = await $fetch<{ data: { id: string }[] }>(
        'http://localhost:1234/v1/models',
        { timeout: 2000 }
      )
      for (const m of res.data ?? []) {
        local.push({
          id: `lmstudio:${m.id}`,
          name: m.id,
          provider: 'lmstudio',
          hosting: 'local-cloud',
          description: 'Model via LM Studio',
          available: true,
          supportsTools: ollamaSupportsTools(m.id),
          supportsVision: ollamaSupportsVision(m.id)
        })
      }
    } catch {}

    return local
  }

  async function fetchModels() {
    loading.value = true
    const [cloudResult, localResult] = await Promise.allSettled([
      $fetch<AIModel[]>('/api/ai/models'),
      fetchLocalModels()
    ])
    const cloud = cloudResult.status === 'fulfilled' ? cloudResult.value : null
    const local = localResult.status === 'fulfilled' ? localResult.value : []
    if (cloud !== null) {
      models.value = [...cloud, ...local]
    } else if (local.length) {
      const existingIds = new Set(models.value.map(m => m.id))
      models.value.push(...local.filter(m => !existingIds.has(m.id)))
    }
    loading.value = false
  }

  function markModelUnavailable(modelId: string, reason: string) {
    runtimeUnavailable[modelId] = reason
  }

  function clearModelUnavailable(modelId: string) {
    delete runtimeUnavailable[modelId]
  }

  function isAvailable(model: AIModel): boolean {
    if (runtimeUnavailable[model.id]) return false
    return model.available !== false
  }

  function getUnavailableReason(model: AIModel): string | undefined {
    return runtimeUnavailable[model.id] ?? model.unavailableReason
  }

  function modelIcon(hosting: AIModel['hosting']) {
    if (hosting === 'cloud') return 'i-lucide-server'
    if (hosting === 'local') return 'i-lucide-key'
    return 'i-lucide-cloud'
  }

  function modelIconColor(hosting: AIModel['hosting']) {
    if (hosting === 'cloud') return 'text-blue-500'
    if (hosting === 'local') return 'text-emerald-500'
    return 'text-amber-500'
  }

  function modelIconLabel(hosting: AIModel['hosting']) {
    if (hosting === 'cloud') return 'Cloud'
    if (hosting === 'local') return 'Local'
    return 'Local-Cloud'
  }

  return {
    models,
    loading,
    fetchModels,
    markModelUnavailable,
    clearModelUnavailable,
    isAvailable,
    getUnavailableReason,
    modelIcon,
    modelIconColor,
    modelIconLabel
  }
}
