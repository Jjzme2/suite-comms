interface GenerateImageRequest {
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export default defineEventHandler(async (event) => {
  const log = createLogger('api/ai/generate-image')
  const body = await readBody<GenerateImageRequest>(event)
  const { prompt, size = '1024x1024', quality = 'standard' } = body
  const config = useRuntimeConfig()

  if (!prompt?.trim()) {
    throw createError({ statusCode: 400, message: 'prompt is required' })
  }

  // Try OpenAI DALL-E 3 first
  if (config.openaiApiKey) {
    const res = await $fetch<{ data: { url: string }[] }>(
      'https://api.openai.com/v1/images/generations',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.openaiApiKey}` },
        body: { model: 'dall-e-3', prompt, n: 1, size, quality }
      }
    )
    const imageUrl = res.data?.[0]?.url
    if (!imageUrl) throw createError({ statusCode: 500, message: 'No image URL returned from OpenAI' })
    log.info('Image generated via OpenAI', { size, quality })
    return { imageUrl }
  }

  // Fallback: OpenRouter (routes to DALL-E 3)
  if (config.openRouterApiKey) {
    const res = await $fetch<{ data: { url: string }[] }>(
      'https://openrouter.ai/api/v1/images/generations',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          'HTTP-Referer': 'https://ilytat.com',
          'X-Title': 'ILYTAT Comms'
        },
        body: { model: 'openai/dall-e-3', prompt, n: 1, size, quality }
      }
    )
    const imageUrl = res.data?.[0]?.url
    if (!imageUrl) throw createError({ statusCode: 500, message: 'No image URL returned from OpenRouter' })
    log.info('Image generated via OpenRouter', { size, quality })
    return { imageUrl }
  }

  throw createError({ statusCode: 503, message: 'No image generation API key configured (set OPENAI_API_KEY)' })
})
