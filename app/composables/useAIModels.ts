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
  async function fetchModels() {
    loading.value = true
    try {
      const discovered = await $fetch<AIModel[]>('/api/ai/models')
      models.value = discovered
    } catch {
      // Keep fallback models already in place
    } finally {
      loading.value = false
    }
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
