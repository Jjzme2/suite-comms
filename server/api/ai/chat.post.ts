import Anthropic from '@anthropic-ai/sdk'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequest {
  modelId: string
  messages: ChatMessage[]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)
  const { modelId, messages } = body
  const config = useRuntimeConfig()

  if (!modelId || !messages?.length) {
    throw createError({ statusCode: 400, message: 'modelId and messages are required' })
  }

  // ── Anthropic (Claude) ────────────────────────────────────────────────────
  if (
    !modelId.startsWith('ollama:') &&
    !modelId.startsWith('lmstudio:') &&
    !modelId.startsWith('gemini:') &&
    !modelId.startsWith('openrouter:')
  ) {
    if (!config.anthropicApiKey) {
      throw createError({ statusCode: 503, message: 'Anthropic API key not configured' })
    }
    const client = new Anthropic({ apiKey: config.anthropicApiKey })
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 4096,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
    const content = response.content[0]?.type === 'text' ? response.content[0].text : ''
    return { content }
  }

  // ── Google Gemini ─────────────────────────────────────────────────────────
  if (modelId.startsWith('gemini:')) {
    if (!config.geminiApiKey) {
      throw createError({ statusCode: 503, message: 'Gemini API key not configured' })
    }
    const model = modelId.replace('gemini:', '')
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
    const res = await $fetch<{
      candidates: { content: { parts: { text: string }[] } }[]
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
      { method: 'POST', body: { contents } }
    )
    const content = res.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    return { content }
  }

  // ── OpenRouter ────────────────────────────────────────────────────────────
  if (modelId.startsWith('openrouter:')) {
    if (!config.openRouterApiKey) {
      throw createError({ statusCode: 503, message: 'OpenRouter API key not configured' })
    }
    const model = modelId.replace('openrouter:', '')
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          'HTTP-Referer': 'https://ilytat.com',
          'X-Title': 'ILYTAT Comms'
        },
        body: { model, messages, max_tokens: 4096 }
      }
    )
    return { content: res.choices?.[0]?.message?.content ?? '' }
  }

  // ── Ollama (local) ────────────────────────────────────────────────────────
  if (modelId.startsWith('ollama:')) {
    const model = modelId.replace('ollama:', '')
    const res = await $fetch<{ message: { content: string } }>(
      'http://localhost:11434/api/chat',
      { method: 'POST', body: { model, messages, stream: false } }
    )
    return { content: res.message?.content ?? '' }
  }

  // ── LM Studio (local-cloud) ───────────────────────────────────────────────
  if (modelId.startsWith('lmstudio:')) {
    const model = modelId.replace('lmstudio:', '')
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
      'http://localhost:1234/v1/chat/completions',
      { method: 'POST', body: { model, messages, max_tokens: 4096 } }
    )
    return { content: res.choices?.[0]?.message?.content ?? '' }
  }

  throw createError({ statusCode: 400, message: 'Unknown model provider' })
})
