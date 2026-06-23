import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { useCollection, useDocument } from 'vuefire'
import type { Channel, ChannelMessage } from '~/types'

export function useChannels() {
  const db = useFirestore()
  const user = useCurrentUser()

  const channels = useCollection<Channel>(
    computed(() => user.value
      ? query(
          collection(db, 'comms_channels'),
          where('memberIds', 'array-contains', user.value.uid),
          orderBy('updatedAt', 'desc')
        )
      : null
    )
  )

  async function createChannel(opts: { name: string; description?: string; aiModel?: string }) {
    if (!user.value) return null
    const uid = user.value.uid
    const ref = await addDoc(collection(db, 'comms_channels'), {
      name: opts.name.trim().toLowerCase().replace(/\s+/g, '-'),
      description: (opts.description ?? '').trim(),
      createdBy: uid,
      memberIds: [uid],
      aiModel: opts.aiModel ?? '',
      lastMessage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return ref.id
  }

  return { channels, createChannel }
}

export function useChannel(channelId: MaybeRefOrGetter<string>) {
  const db = useFirestore()
  const user = useCurrentUser()

  const channelRef = computed(() => doc(db, 'comms_channels', toValue(channelId)))
  const channel = useDocument<Channel>(channelRef)

  const messagesRef = computed(() =>
    query(
      collection(db, 'comms_channels', toValue(channelId), 'messages'),
      orderBy('createdAt', 'asc')
    )
  )
  const messages = useCollection<ChannelMessage>(messagesRef)

  const aiThinking = ref(false)

  async function sendMessage(text: string) {
    if (!user.value || !text.trim()) return
    const uid = user.value.uid
    const senderName = user.value.displayName || 'Unknown'
    await addDoc(
      collection(db, 'comms_channels', toValue(channelId), 'messages'),
      {
        senderId: uid,
        senderName,
        senderPhoto: user.value.photoURL || '',
        text: text.trim(),
        role: 'user',
        reactions: {},
        createdAt: serverTimestamp(),
        edited: false
      }
    )
    await updateDoc(channelRef.value, {
      lastMessage: { text: text.trim(), senderId: uid, senderName, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp()
    })
  }

  async function sendAIMessage(prompt: string) {
    if (!user.value || !prompt.trim() || !channel.value?.aiModel) return
    const uid = user.value.uid
    const senderName = user.value.displayName || 'Unknown'
    const modelId = channel.value.aiModel

    // Build context before adding the new message so history is consistent
    const history: { role: 'user' | 'assistant'; content: string }[] = [
      ...(messages.value ?? []).slice(-14).map(m => ({
        role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.role === 'ai' ? m.text : `${m.senderName}: ${m.text}`
      })),
      { role: 'user' as const, content: `${senderName}: ${prompt.trim()}` }
    ]

    // Post user message
    await addDoc(
      collection(db, 'comms_channels', toValue(channelId), 'messages'),
      {
        senderId: uid,
        senderName,
        senderPhoto: user.value.photoURL || '',
        text: prompt.trim(),
        role: 'user',
        reactions: {},
        createdAt: serverTimestamp(),
        edited: false
      }
    )
    await updateDoc(channelRef.value, {
      lastMessage: { text: prompt.trim(), senderId: uid, senderName, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp()
    })

    // AI placeholder message
    const aiRef = await addDoc(
      collection(db, 'comms_channels', toValue(channelId), 'messages'),
      {
        senderId: 'ai',
        senderName: modelId,
        senderPhoto: '',
        text: '',
        role: 'ai',
        modelId,
        reactions: {},
        createdAt: serverTimestamp(),
        edited: false
      }
    )

    aiThinking.value = true
    try {
      const { content } = await $fetch<{ content: string }>('/api/ai/chat', {
        method: 'POST',
        body: { modelId, messages: history }
      })
      await updateDoc(aiRef, { text: content })
      await updateDoc(channelRef.value, {
        lastMessage: {
          text: content.slice(0, 120),
          senderId: 'ai',
          senderName: modelId,
          createdAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      })
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message || 'AI failed to respond'
      await updateDoc(aiRef, { text: `⚠️ ${msg}` })
    } finally {
      aiThinking.value = false
    }
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!user.value) return
    const uid = user.value.uid
    const msgRef = doc(db, 'comms_channels', toValue(channelId), 'messages', messageId)
    const msg = messages.value?.find(m => m.id === messageId)
    const reactors = msg?.reactions?.[emoji] ?? []
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: reactors.includes(uid) ? arrayRemove(uid) : arrayUnion(uid)
    })
  }

  return { channel, messages, aiThinking, sendMessage, sendAIMessage, toggleReaction }
}
