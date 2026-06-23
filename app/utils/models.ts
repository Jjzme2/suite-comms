export function formatModelId(modelId: string): string {
  if (!modelId) return 'AI'

  if (modelId.startsWith('gemini:')) {
    const m = modelId.replace('gemini:', '') // e.g. "gemini-2.5-pro"
    // Turn "gemini-2.5-pro" → "Gemini 2.5 Pro"
    return m
      .replace(/^gemini-/, 'Gemini ')
      .replace(/-(\d)/g, ' $1')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  if (modelId.startsWith('ollama:')) return `Ollama / ${modelId.replace('ollama:', '')}`

  if (modelId.startsWith('openrouter:')) {
    const slug = modelId.replace('openrouter:', '').split('/').pop() || 'OpenRouter'
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (modelId.startsWith('lmstudio:')) return `LM Studio / ${modelId.replace('lmstudio:', '')}`

  // Claude: "claude-sonnet-4-6" → "Claude Sonnet 4.6"
  return modelId
    .replace(/^claude-/, 'Claude ')
    .replace(/-(\d)/g, ' $1')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export const QUICK_MODEL_OPTIONS = [
  { label: 'None (no AI)', value: '' },
  { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6' },
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
  { label: 'Claude Opus 4.8', value: 'claude-opus-4-8' },
  { label: 'Gemini 2.5 Pro', value: 'gemini:gemini-2.5-pro' },
  { label: 'Gemini 2.5 Flash', value: 'gemini:gemini-2.5-flash' }
]
