import Anthropic from '@anthropic-ai/sdk'
// ── Request / response types ────────────────────────────────────────────────

interface ToolUseItem {
  id: string
  name: string
  input: Record<string, unknown>
}

interface ToolResultItem {
  tool_use_id: string
  name?: string   // function name — required for Gemini's functionResponse
  content: string
  is_error?: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolUse?: ToolUseItem[]
  toolResults?: ToolResultItem[]
}

interface UserContext {
  displayName?: string
  email?: string
}

interface ChatRequest {
  modelId: string
  messages: ChatMessage[]
  useTools?: boolean  // client sets true when the selected model supports tools
  userContext?: UserContext
}

interface SuiteToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

// ── Suite tool definitions (Anthropic native format — source of truth) ───────

const SUITE_TOOLS_ANTHROPIC: Anthropic.Tool[] = [
  {
    name: 'list_pm_projects',
    description: 'Lists the user\'s PM projects with IDs, names, and status. Call this first when you need a project ID before creating tasks or threads.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_project',
    description: 'Creates a new project in ILYTAT PM.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        color: {
          type: 'string',
          enum: ['violet', 'blue', 'emerald', 'amber', 'rose', 'sky', 'green', 'orange', 'purple', 'teal', 'pink', 'indigo', 'lime', 'red', 'cyan', 'fuchsia'],
          description: 'Accent color'
        },
        icon: { type: 'string', description: 'Lucide icon name, e.g. i-lucide-folder, i-lucide-rocket, i-lucide-briefcase' }
      }
    }
  },
  {
    name: 'create_task',
    description: 'Creates a new task in a PM project. Call list_pm_projects first if you don\'t have the project ID.',
    input_schema: {
      type: 'object',
      required: ['project_id', 'title'],
      properties: {
        project_id: { type: 'string', description: 'Project ID from list_pm_projects' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority (default: medium)' },
        status: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'], description: 'Initial status (default: todo)' }
      }
    }
  },
  {
    name: 'create_forum_thread',
    description: 'Creates a discussion thread in a project forum. Call list_pm_projects first if you don\'t have the project ID.',
    input_schema: {
      type: 'object',
      required: ['project_id', 'title', 'content'],
      properties: {
        project_id: { type: 'string', description: 'Project ID from list_pm_projects' },
        title: { type: 'string', description: 'Thread title' },
        content: { type: 'string', description: 'Thread body' }
      }
    }
  },
  {
    name: 'list_comms_channels',
    description: 'Lists channels the user is a member of, with IDs and names.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_channel',
    description: 'Creates a new group channel in ILYTAT Comms.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Channel name (will be lowercased and hyphenated)' },
        description: { type: 'string', description: 'What the channel is for' }
      }
    }
  },
  {
    name: 'list_pm_tasks',
    description: 'Lists the user\'s PM tasks. Filter by project_id to see tasks for a specific project, or by status to find todo/inprogress/review/done tasks.',
    input_schema: {
      type: 'object',
      properties: {
        project_id: { type: 'string', description: 'Only return tasks for this project (from list_pm_projects)' },
        status: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'], description: 'Filter by task status' }
      }
    }
  },
  {
    name: 'create_note',
    description: 'Creates a new note in ILYTAT PM. Notes can be standalone or attached to a project.',
    input_schema: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note body (plain text or markdown)' },
        project_id: { type: 'string', description: 'Attach to this project (optional, from list_pm_projects)' }
      }
    }
  },
  {
    name: 'update_task',
    description: 'Updates an existing PM task\'s status, priority, or title. Call list_pm_tasks first to get the task ID.',
    input_schema: {
      type: 'object',
      required: ['task_id'],
      properties: {
        task_id: { type: 'string', description: 'Task ID from list_pm_tasks' },
        status: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'], description: 'New status' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'New priority' },
        title: { type: 'string', description: 'New title' }
      }
    }
  },
  {
    name: 'get_user_context',
    description: 'Returns the current user\'s profile and a summary of their projects and tasks. Call this when the user asks about "my projects", "my tasks", wants a summary, or when you need context about who you\'re talking to.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'generate_image',
    description: 'Generates an image from a text description using AI. Use when the user asks to create, draw, illustrate, or visualize something.',
    input_schema: {
      type: 'object',
      required: ['prompt'],
      properties: {
        prompt: { type: 'string', description: 'Detailed description of the image to generate' },
        size: {
          type: 'string',
          enum: ['1024x1024', '1792x1024', '1024x1792'],
          description: 'Image dimensions (default: 1024x1024)'
        },
        quality: {
          type: 'string',
          enum: ['standard', 'hd'],
          description: 'Image quality — hd for more detail (default: standard)'
        }
      }
    }
  }
]

// OpenAI-compatible format (OpenRouter, Ollama, LM Studio)
const SUITE_TOOLS_OPENAI = SUITE_TOOLS_ANTHROPIC.map(t => ({
  type: 'function' as const,
  function: {
    name: t.name,
    description: t.description ?? '',
    parameters: t.input_schema
  }
}))

// Gemini format
const SUITE_TOOLS_GEMINI = [{
  functionDeclarations: SUITE_TOOLS_ANTHROPIC.map(t => ({
    name: t.name,
    description: t.description ?? '',
    parameters: t.input_schema
  }))
}]

// ── System prompt ─────────────────────────────────────────────────────────────

const SUITE_SYSTEM_PROMPT_BASE = `You are an AI assistant integrated into ILYTAT Suite, a collection of productivity apps:

- **Hub**: Single sign-on, notification centre, and app launchpad
- **PM**: Project management with kanban boards, tasks, notes, and time tracking
- **Comms** (this app): Direct messaging, group channels, AI chat, and project discussion forums

## Data Access Rules — HARD CONSTRAINTS

You have NO direct database access. Every piece of data you can see comes only from what the user explicitly shares with you in this conversation, or from tool results.

1. **User isolation** — Each user can only access their own private data. Never speculate about, infer, describe, or reproduce another user's data.
2. **Permitted scope** — You may assist with data the user has explicitly pasted, described, or that tool results have returned.
3. **No secrets** — Never echo, guess, or reference API keys, auth tokens, or environment variables.

## Suite Actions

When you have tools available, use them proactively:
- **Summarise work / "my projects" / "my tasks"** → get_user_context (always call this first when the user asks about their data without specifying IDs)
- **List projects** → list_pm_projects
- **List tasks** → list_pm_tasks (filter by project_id and/or status; call list_pm_projects first if you need a project ID)
- **Create a project** → create_project
- **Add a task** → list_pm_projects first if you don't have the project ID, then create_task
- **Create a note** → create_note (attach to a project with project_id, or leave standalone)
- **Update a task's status or priority** → list_pm_tasks first to get the task ID, then update_task
- **Start a discussion** → list_pm_projects first, then create_forum_thread
- **Create a channel** → create_channel
- **Generate an image** → generate_image

Always confirm exactly what was created or updated. If a tool fails, explain what went wrong and suggest an alternative.`

function buildSystemPrompt(userCtx?: UserContext): string {
  if (!userCtx?.displayName) return SUITE_SYSTEM_PROMPT_BASE
  const who = userCtx.email
    ? `${userCtx.displayName} (${userCtx.email})`
    : userCtx.displayName
  return `You are speaking with **${who}**. Address them by name when natural.\n\n${SUITE_SYSTEM_PROMPT_BASE}`
}

// ── Message converters ────────────────────────────────────────────────────────

function toAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
  return messages.map(m => {
    if (m.toolUse?.length) {
      const content: Anthropic.ContentBlockParam[] = []
      if (m.content) content.push({ type: 'text', text: m.content })
      for (const tu of m.toolUse) {
        content.push({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input })
      }
      return { role: 'assistant' as const, content }
    }
    if (m.toolResults?.length) {
      return {
        role: 'user' as const,
        content: m.toolResults.map(tr => ({
          type: 'tool_result' as const,
          tool_use_id: tr.tool_use_id,
          content: tr.content,
          ...(tr.is_error ? { is_error: true } : {})
        })) as Anthropic.ToolResultBlockParam[]
      }
    }
    return { role: m.role, content: m.content }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGeminiContents(messages: ChatMessage[]): any[] {
  return messages.map(m => {
    if (m.toolUse?.length) {
      return {
        role: 'model',
        parts: [
          ...(m.content ? [{ text: m.content }] : []),
          ...m.toolUse.map(tu => ({ functionCall: { name: tu.name, args: tu.input } }))
        ]
      }
    }
    if (m.toolResults?.length) {
      return {
        role: 'user',
        parts: m.toolResults.map(tr => ({
          functionResponse: {
            name: tr.name || tr.tool_use_id,
            response: { output: tr.content }
          }
        }))
      }
    }
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toOpenAIMessages(messages: ChatMessage[], systemPrompt: string): any[] {
  const result: unknown[] = [{ role: 'system', content: systemPrompt }]
  for (const m of messages) {
    if (m.toolUse?.length) {
      result.push({
        role: 'assistant',
        content: m.content || null,
        tool_calls: m.toolUse.map(tu => ({
          id: tu.id,
          type: 'function',
          function: { name: tu.name, arguments: JSON.stringify(tu.input) }
        }))
      })
    } else if (m.toolResults?.length) {
      for (const tr of m.toolResults) {
        result.push({ role: 'tool', tool_call_id: tr.tool_use_id, content: tr.content })
      }
    } else {
      result.push({ role: m.role, content: m.content })
    }
  }
  return result
}

// Parse tool calls from OpenAI-compatible response
function parseOpenAIToolCalls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCallsRaw: any[]
): SuiteToolCall[] {
  return toolCallsRaw.map((tc, i) => ({
    id: tc.id ?? `tool-${i}`,
    name: tc.function?.name ?? tc.name ?? '',
    input: typeof tc.function?.arguments === 'string'
      ? (() => { try { return JSON.parse(tc.function.arguments) } catch { return {} } })()
      : (tc.function?.arguments ?? tc.arguments ?? {})
  }))
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const log = createLogger('api/ai/chat')
  const body = await readBody<ChatRequest>(event)
  const { modelId, messages, useTools = false, userContext } = body
  const systemPrompt = buildSystemPrompt(userContext)
  const config = useRuntimeConfig()

  if (!modelId || !messages?.length) {
    throw createError({ statusCode: 400, message: 'modelId and messages are required' })
  }

  log.info('Chat request', { modelId, messages: messages.length, useTools })
  const t = log.elapsed()

  try {
    // ── Anthropic (Claude) ──────────────────────────────────────────────────
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
        max_tokens: 8096,
        system: systemPrompt,
        tools: useTools ? SUITE_TOOLS_ANTHROPIC : undefined,
        messages: toAnthropicMessages(messages)
      })

      if (response.stop_reason === 'tool_use') {
        const toolCalls: SuiteToolCall[] = response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
          .map(b => ({ id: b.id, name: b.name, input: b.input as Record<string, unknown> }))
        const partialText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map(b => b.text).join('')
        log.info('Anthropic tool use', { tools: toolCalls.map(t => t.name), ms: log.elapsed() })
        return { toolCalls, partialText }
      }

      const content = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text).join('')
      log.info('Anthropic response', { chars: content.length, ms: log.elapsed() })
      return { content }
    }

    // ── Google Gemini ─────────────────────────────────────────────────────
    if (modelId.startsWith('gemini:')) {
      if (!config.geminiApiKey) {
        throw createError({ statusCode: 503, message: 'Gemini API key not configured' })
      }
      const model = modelId.replace('gemini:', '')
      const res = await $fetch<{
        candidates: {
          content: {
            parts: {
              text?: string
              thought?: boolean
              functionCall?: { name: string; args: Record<string, unknown> }
            }[]
            role?: string
          }
          finishReason?: string
        }[]
      }>(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
        {
          method: 'POST',
          body: {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            ...(useTools ? { tools: SUITE_TOOLS_GEMINI } : {}),
            contents: toGeminiContents(messages)
          }
        }
      )

      const parts = res.candidates?.[0]?.content?.parts ?? []
      const fnCallParts = parts.filter(p => p.functionCall)

      if (fnCallParts.length && useTools) {
        const toolCalls: SuiteToolCall[] = fnCallParts.map((p, i) => ({
          id: `gemini-${i}`,
          name: p.functionCall!.name,
          input: p.functionCall!.args ?? {}
        }))
        const partialText = parts.filter(p => p.text && !p.thought).map(p => p.text!).join('')
        log.info('Gemini tool use', { tools: toolCalls.map(t => t.name), ms: log.elapsed() })
        return { toolCalls, partialText }
      }

      const content = parts.filter(p => !p.thought).map(p => p.text ?? '').join('')
      log.info('Gemini response', { chars: content.length, ms: log.elapsed() })
      return { content }
    }

    // ── OpenRouter ────────────────────────────────────────────────────────
    if (modelId.startsWith('openrouter:')) {
      if (!config.openRouterApiKey) {
        throw createError({ statusCode: 503, message: 'OpenRouter API key not configured' })
      }
      const model = modelId.replace('openrouter:', '')
      const res = await $fetch<{
        choices: {
          message: {
            content: string | null
            tool_calls?: unknown[]
          }
          finish_reason?: string
        }[]
      }>(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.openRouterApiKey}`,
            'HTTP-Referer': 'https://ilytat.com',
            'X-Title': 'ILYTAT Comms'
          },
          body: {
            model,
            messages: toOpenAIMessages(messages, systemPrompt),
            max_tokens: 8096,
            ...(useTools ? { tools: SUITE_TOOLS_OPENAI } : {})
          }
        }
      )

      const choice = res.choices?.[0]
      if (choice?.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length && useTools) {
        const toolCalls = parseOpenAIToolCalls(choice.message.tool_calls as unknown[])
        const partialText = choice.message.content ?? ''
        log.info('OpenRouter tool use', { tools: toolCalls.map(t => t.name), ms: log.elapsed() })
        return { toolCalls, partialText }
      }

      const content = choice?.message?.content ?? ''
      log.info('OpenRouter response', { model, chars: content.length, ms: log.elapsed() })
      return { content }
    }

    // ── Ollama (local) ────────────────────────────────────────────────────
    if (modelId.startsWith('ollama:')) {
      const model = modelId.replace('ollama:', '')
      const res = await $fetch<{
        message: {
          content: string
          tool_calls?: unknown[]
        }
      }>(
        'http://localhost:11434/api/chat',
        {
          method: 'POST',
          body: {
            model,
            messages: toOpenAIMessages(messages, systemPrompt),
            stream: false,
            ...(useTools ? { tools: SUITE_TOOLS_OPENAI } : {})
          }
        }
      )

      const msg = res.message
      if (msg?.tool_calls?.length && useTools) {
        const toolCalls = parseOpenAIToolCalls(msg.tool_calls as unknown[])
        const partialText = msg.content ?? ''
        log.info('Ollama tool use', { model, tools: toolCalls.map(t => t.name), ms: log.elapsed() })
        return { toolCalls, partialText }
      }

      const content = msg?.content ?? ''
      log.info('Ollama response', { model, chars: content.length, ms: log.elapsed() })
      return { content }
    }

    // ── LM Studio (local-cloud) ───────────────────────────────────────────
    if (modelId.startsWith('lmstudio:')) {
      const model = modelId.replace('lmstudio:', '')
      const res = await $fetch<{
        choices: {
          message: {
            content: string | null
            tool_calls?: unknown[]
          }
          finish_reason?: string
        }[]
      }>(
        'http://localhost:1234/v1/chat/completions',
        {
          method: 'POST',
          body: {
            model,
            messages: toOpenAIMessages(messages, systemPrompt),
            max_tokens: 8096,
            ...(useTools ? { tools: SUITE_TOOLS_OPENAI } : {})
          }
        }
      )

      const choice = res.choices?.[0]
      if (choice?.finish_reason === 'tool_calls' && choice.message?.tool_calls?.length && useTools) {
        const toolCalls = parseOpenAIToolCalls(choice.message.tool_calls as unknown[])
        const partialText = choice.message.content ?? ''
        log.info('LM Studio tool use', { model, tools: toolCalls.map(t => t.name), ms: log.elapsed() })
        return { toolCalls, partialText }
      }

      const content = choice?.message?.content ?? ''
      log.info('LM Studio response', { model, chars: content.length, ms: log.elapsed() })
      return { content }
    }

    throw createError({ statusCode: 400, message: 'Unknown model provider' })
  } catch (err: unknown) {
    if ((err as { statusCode?: number })?.statusCode) throw err  // re-throw H3 errors
    log.error('Chat request failed', err, { modelId, ms: t })
    throw createError({ statusCode: 500, message: err instanceof Error ? err.message : 'AI request failed' })
  }
})
