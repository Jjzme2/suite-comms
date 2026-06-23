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
import type { AIChat, AIMessage } from '~/types'

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
  const { markModelUnavailable } = useAIModels()

  async function sendMessage(userText: string, modelId: string) {
    if (!user.value || !userText.trim()) return

    error.value = null

    const userMsg = await addDoc(messagesRef(), {
      role: 'user',
      content: userText.trim(),
      createdAt: serverTimestamp()
    })

    const history = (messages.value ?? []).map(m => ({ role: m.role, content: m.content }))

    streaming.value = true
    streamingContent.value = ''

    try {
      const res = await $fetch<{ content: string }>('/api/ai/chat', {
        method: 'POST',
        body: {
          modelId,
          messages: [...history, { role: 'user', content: userText.trim() }]
        }
      })

      streamingContent.value = res.content

      await addDoc(messagesRef(), {
        role: 'assistant',
        content: res.content,
        createdAt: serverTimestamp()
      })

      const chatRef = doc(db, 'users', user.value.uid, 'comms_ai_chats', toValue(chatId))
      const isFirst = (messages.value?.length ?? 0) <= 1
      const update: Record<string, unknown> = { updatedAt: serverTimestamp() }
      if (isFirst) {
        update.title = userText.trim().slice(0, 60)
      }
      await updateDoc(chatRef, update)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to get AI response'
      error.value = msg
      // Auto-grey models that report key/token exhaustion errors
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
