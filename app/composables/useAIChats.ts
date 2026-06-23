import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'
import { useCollection } from 'vuefire'
import type { AIChat, AIMessage, AIToolCall } from '~/types'
import { toolDisplayLabel } from './useAISuiteTools'

// Types used only for building API call payloads (not stored in Firestore)
interface ToolChatMessage {
  role: 'user' | 'assistant'
  content: string
  toolUse?: { id: string; name: string; input: Record<string, unknown> }[]
  toolResults?: { tool_use_id: string; content: string; is_error?: boolean }[]
}

interface SuiteToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

interface ChatApiResponse {
  content?: string
  toolCalls?: SuiteToolCall[]
  partialText?: string
}

export function useAIChats() {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitActivity } = useSuiteEvents()

  function chatsRef() {
    return collection(db, 'users', user.value!.uid, 'comms_ai_chats')
  }

  const chats = useCollection<AIChat>(
    computed(() => user.value
      ? query(chatsRef(), orderBy('updatedAt', 'desc'))
      : null
    )
  )

  async function createChat(modelId: string, title = 'New Chat') {
    const ref = await addDoc(chatsRef(), {
      modelId,
      title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    emitActivity('ai.chat.created', `Started AI chat: ${title}`, { modelId, chatId: ref.id })
    return ref.id
  }

  async function renameChat(chatId: string, title: string) {
    await updateDoc(doc(db, 'users', user.value!.uid, 'comms_ai_chats', chatId), {
      title,
      updatedAt: serverTimestamp()
    })
  }

  async function deleteChat(chatId: string) {
    await deleteDoc(doc(db, 'users', user.value!.uid, 'comms_ai_chats', chatId))
  }

  return { chats, createChat, renameChat, deleteChat }
}

export function useAIChatSession(chatId: MaybeRefOrGetter<string>) {
  const db = useFirestore()
  const user = useCurrentUser()
  const { markModelUnavailable } = useAIModels()
  const { executeTool } = useAISuiteTools()

  function messagesRef() {
    return collection(
      db, 'users', user.value!.uid, 'comms_ai_chats', toValue(chatId), 'messages'
    )
  }

  const messages = useCollection<AIMessage>(
    computed(() => user.value
      ? query(messagesRef(), orderBy('createdAt', 'asc'))
      : null
    )
  )

  const streaming = ref(false)
  const streamingContent = ref('')
  const error = ref<string | null>(null)

  const isAnthropicModel = (modelId: string) =>
    !modelId.startsWith('ollama:') &&
    !modelId.startsWith('lmstudio:') &&
    !modelId.startsWith('gemini:') &&
    !modelId.startsWith('openrouter:')

  async function sendMessage(userText: string, modelId: string) {
    if (!user.value || !userText.trim()) return

    error.value = null

    // Persist user message
    await addDoc(messagesRef(), {
      role: 'user',
      content: userText.trim(),
      createdAt: serverTimestamp()
    })

    // Build simple text history (tool metadata is not carried across sessions)
    const textHistory: ToolChatMessage[] = (messages.value ?? []).map(m => ({
      role: m.role,
      content: m.content
    }))

    streaming.value = true
    streamingContent.value = ''

    try {
      let currentMessages: ToolChatMessage[] = [
        ...textHistory,
        { role: 'user', content: userText.trim() }
      ]
      const allToolCalls: AIToolCall[] = []
      const MAX_ROUNDS = 6

      for (let round = 0; round < MAX_ROUNDS; round++) {
        const res = await $fetch<ChatApiResponse>('/api/ai/chat', {
          method: 'POST',
          body: { modelId, messages: currentMessages }
        })

        if (res.toolCalls?.length && isAnthropicModel(modelId)) {
          // Show per-tool progress in the streaming bubble
          const labels = res.toolCalls.map(tc => toolDisplayLabel(tc.name)).join(', ')
          streamingContent.value = `Using: ${labels}…`

          const toolResults: { tool_use_id: string; content: string; is_error?: boolean }[] = []

          for (const tc of res.toolCalls) {
            const { result, isError } = await executeTool(tc.name, tc.input)
            allToolCalls.push({ id: tc.id, name: tc.name, input: tc.input, result, isError })
            toolResults.push({ tool_use_id: tc.id, content: result, ...(isError ? { is_error: true } : {}) })
          }

          // Append the tool_use assistant turn + tool_result user turn for next call
          currentMessages = [
            ...currentMessages,
            {
              role: 'assistant',
              content: res.partialText ?? '',
              toolUse: res.toolCalls.map(tc => ({ id: tc.id, name: tc.name, input: tc.input }))
            },
            { role: 'user', content: '', toolResults }
          ]
        } else {
          // Final text response — persist and break
          const finalContent = res.content ?? ''
          streamingContent.value = finalContent

          await addDoc(messagesRef(), {
            role: 'assistant',
            content: finalContent,
            ...(allToolCalls.length ? { toolCalls: allToolCalls } : {}),
            createdAt: serverTimestamp()
          })

          const chatRef = doc(db, 'users', user.value!.uid, 'comms_ai_chats', toValue(chatId))
          const isFirst = (messages.value?.length ?? 0) <= 1
          const update: Record<string, unknown> = { updatedAt: serverTimestamp() }
          if (isFirst) update.title = userText.trim().slice(0, 60)
          await updateDoc(chatRef, update)
          break
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get AI response'
      error.value = msg
      if (msg.includes('not configured') || msg.includes('429') || msg.includes('quota')) {
        markModelUnavailable(modelId, msg)
      }
    } finally {
      streaming.value = false
      streamingContent.value = ''
    }
  }

  return { messages, streaming, streamingContent, error, sendMessage }
}
