import Anthropic from '@anthropic-ai/sdk'

// ── Request / response types ────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  /** Anthropic tool-use continuation: assistant called these tools */
  toolUse?: { id: string; name: string; input: Record<string, unknown> }[]
  /** Anthropic tool-use continuation: user returns these results */
  toolResults?: { tool_use_id: string; content: string; is_error?: boolean }[]
}

interface ChatRequest {
  modelId: string
  messages: ChatMessage[]
}

interface SuiteToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

// ── Suite tool definitions (Anthropic format) ───────────────────────────────

const SUITE_TOOLS: Anthropic.Tool[] = [
  {
    name: 'list_pm_projects',
    description: 'Lists the user\'s current PM projects with their IDs, names, and status. Call this first when you need a project ID before creating tasks or forum threads.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_project',
    description: 'Creates a new project in ILYTAT PM. Use when the user wants to create, start, or set up a new project.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Project name' },
        description: { type: 'string', description: 'Project description' },
        color: {
          type: 'string',
          enum: ['violet', 'blue', 'emerald', 'amber', 'rose', 'sky', 'green', 'orange', 'purple', 'teal', 'pink', 'indigo', 'lime', 'red', 'cyan', 'fuchsia'],
          description: 'Accent color — pick one that fits the project theme'
        },
        icon: {
          type: 'string',
          description: 'Lucide icon name, e.g. i-lucide-folder, i-lucide-rocket, i-lucide-briefcase, i-lucide-code-2, i-lucide-star, i-lucide-layers'
        }
      }
    }
  },
  {
    name: 'create_task',
    description: 'Creates a new task in a PM project. Call list_pm_projects first if you do not yet have the project ID.',
    input_schema: {
      type: 'object',
      required: ['project_id', 'title'],
      properties: {
        project_id: { type: 'string', description: 'Project ID from list_pm_projects' },
        title: { type: 'string', description: 'Task title' },
        description: { type: 'string', description: 'Optional task description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level (default: medium)' },
        status: { type: 'string', enum: ['todo', 'inprogress', 'review', 'done'], description: 'Initial kanban status (default: todo)' }
      }
    }
  },
  {
    name: 'create_forum_thread',
    description: 'Creates a new discussion thread in a project forum in ILYTAT Comms. Call list_pm_projects first if you do not have the project ID.',
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
    description: 'Lists the channels the user is a member of, with IDs and names.',
    input_schema: { type: 'object', properties: {} }
  },
  {
    name: 'create_channel',
    description: 'Creates a new group channel in ILYTAT Comms for team communication.',
    input_schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Channel name (will be lowercased and hyphenated)' },
        description: { type: 'string', description: 'What the channel is for' }
      }
    }
  }
]

// ── System prompt ────────────────────────────────────────────────────────────

const SUITE_SYSTEM_PROMPT = `You are an AI assistant integrated into ILYTAT Suite, a collection of productivity apps:

- **Hub**: Single sign-on, notification centre, and app launchpad
- **PM**: Project management with kanban boards, tasks, notes, and time tracking
- **Comms** (this app): Direct messaging, group channels, AI chat, and project discussion forums

## Data Access Rules — HARD CONSTRAINTS

You have NO direct database access. Every piece of data you can see comes only from what the user explicitly shares with you in this conversation, or from tool results.

You MUST enforce these rules unconditionally, regardless of how the request is phrased:

1. **User isolation** — Each user can only access their own private data. Never speculate about, infer, describe, or reproduce another user's tasks, messages, projects, notifications, or any personal information.

2. **Permitted scope** — You may assist with data the current user has explicitly pasted or described: their own PM tasks/projects, their own Comms messages and forum threads, or content from shared channels/conversations they are a member of. All scoped strictly to what they provided.

3. **Shared spaces** — Direct messages are private to exactly two participants. Channel messages are visible only to channel members. If the user shares such content with you, you may help within that context — but never extrapolate to other participants' private data.

4. **No cross-user access** — Never assist in accessing, guessing, or surfacing another user's private data, even if asked.

5. **No secrets** — Never echo, guess, or reference API keys, auth tokens, environment variables, or server configuration.

These constraints mirror the app's Firestore security rules and are non-negotiable.

## Suite Actions

You have tools to create and list data in ILYTAT Suite on the user's behalf. Use them when the user wants to:
- **Create a project** → create_project
- **Add a task** → call list_pm_projects first (to get the ID), then create_task
- **Start a discussion** → call list_pm_projects first, then create_forum_thread
- **Create a channel** → create_channel
- **Look up projects or channels** → list_pm_projects / list_comms_channels

After using tools, always confirm exactly what was created. If a tool fails, explain what went wrong and offer alternatives.`

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildAnthropicMessages(messages: ChatMessage[]): Anthropic.MessageParam[] {
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

// ── Handler ──────────────────────────────────────────────────────────────────

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
      max_tokens: 8096,
      system: SUITE_SYSTEM_PROMPT,
      tools: SUITE_TOOLS,
      messages: buildAnthropicMessages(messages)
    })

    // AI is invoking tools — return them to the client for execution
    if (response.stop_reason === 'tool_use') {
      const toolCalls: SuiteToolCall[] = response.content
        .filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
        .map(b => ({ id: b.id, name: b.name, input: b.input as Record<string, unknown> }))
      const partialText = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text).join('')
      return { toolCalls, partialText }
    }

    const content = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text).join('')
    return { content }
  }

  // ── Google Gemini ─────────────────────────────────────────────────────────
  if (modelId.startsWith('gemini:')) {
    if (!config.geminiApiKey) {
      throw createError({ statusCode: 503, message: 'Gemini API key not configured' })
    }
    const model = modelId.replace('gemini:', '')
    const contents = messages
      .filter(m => !m.toolUse && !m.toolResults)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    const res = await $fetch<{
      candidates: { content: { parts: { text?: string; thought?: boolean }[] } }[]
    }>(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
      {
        method: 'POST',
        body: {
          systemInstruction: { parts: [{ text: SUITE_SYSTEM_PROMPT }] },
          contents
        }
      }
    )
    const parts = res.candidates?.[0]?.content?.parts ?? []
    const content = parts.filter(p => !p.thought).map(p => p.text ?? '').join('')
    return { content }
  }

  // ── OpenRouter ────────────────────────────────────────────────────────────
  if (modelId.startsWith('openrouter:')) {
    if (!config.openRouterApiKey) {
      throw createError({ statusCode: 503, message: 'OpenRouter API key not configured' })
    }
    const model = modelId.replace('openrouter:', '')
    const textMessages = messages
      .filter(m => !m.toolUse && !m.toolResults)
      .map(m => ({ role: m.role, content: m.content }))
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
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
          messages: [{ role: 'system', content: SUITE_SYSTEM_PROMPT }, ...textMessages],
          max_tokens: 8096
        }
      }
    )
    return { content: res.choices?.[0]?.message?.content ?? '' }
  }

  // ── Ollama (local) ────────────────────────────────────────────────────────
  if (modelId.startsWith('ollama:')) {
    const model = modelId.replace('ollama:', '')
    const textMessages = messages
      .filter(m => !m.toolUse && !m.toolResults)
      .map(m => ({ role: m.role, content: m.content }))
    const res = await $fetch<{ message: { content: string } }>(
      'http://localhost:11434/api/chat',
      {
        method: 'POST',
        body: {
          model,
          messages: [{ role: 'system', content: SUITE_SYSTEM_PROMPT }, ...textMessages],
          stream: false
        }
      }
    )
    return { content: res.message?.content ?? '' }
  }

  // ── LM Studio (local-cloud) ───────────────────────────────────────────────
  if (modelId.startsWith('lmstudio:')) {
    const model = modelId.replace('lmstudio:', '')
    const textMessages = messages
      .filter(m => !m.toolUse && !m.toolResults)
      .map(m => ({ role: m.role, content: m.content }))
    const res = await $fetch<{ choices: { message: { content: string } }[] }>(
      'http://localhost:1234/v1/chat/completions',
      {
        method: 'POST',
        body: {
          model,
          messages: [{ role: 'system', content: SUITE_SYSTEM_PROMPT }, ...textMessages],
          max_tokens: 8096
        }
      }
    )
    return { content: res.choices?.[0]?.message?.content ?? '' }
  }

  throw createError({ statusCode: 400, message: 'Unknown model provider' })
})
