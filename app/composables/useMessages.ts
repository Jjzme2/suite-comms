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
  arrayRemove,
  increment
} from 'firebase/firestore'
import { useCollection, useDocument } from 'vuefire'
import type { Conversation, Message } from '~/types'

export function useConversations() {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitNotification } = useSuiteEvents()

  const conversations = useCollection<Conversation>(
    computed(() => user.value
      ? query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', user.value.uid),
          orderBy('updatedAt', 'desc')
        )
      : null
    )
  )

  async function createConversation(otherUid: string, otherName: string, otherPhoto = '') {
    const uid = user.value!.uid
    const participantIds = [uid, otherUid].sort()
    const id = participantIds.join('_')
    const ref = doc(db, 'conversations', id)
    await updateDoc(ref, {}).catch(async () => {
      await addDoc(collection(db, 'conversations'), {
        id,
        participantIds,
        participantNames: { [uid]: user.value!.displayName || '', [otherUid]: otherName },
        participantPhotos: { [uid]: user.value!.photoURL || '', [otherUid]: otherPhoto },
        lastMessage: null,
        unreadCount: { [uid]: 0, [otherUid]: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    })
    return id
  }

  return { conversations, createConversation }
}

export function useConversation(conversationId: MaybeRefOrGetter<string>) {
  const db = useFirestore()
  const user = useCurrentUser()
  const { emitNotification } = useSuiteEvents()

  const convRef = computed(() => doc(db, 'conversations', toValue(conversationId)))
  const conversation = useDocument<Conversation>(convRef)

  const messages = useCollection<Message>(
    computed(() => query(
      collection(db, 'conversations', toValue(conversationId), 'messages'),
      orderBy('createdAt', 'asc')
    ))
  )

  async function sendMessage(text: string) {
    if (!user.value || !text.trim()) return
    const uid = user.value.uid
    await addDoc(
      collection(db, 'conversations', toValue(conversationId), 'messages'),
      { senderId: uid, text: text.trim(), createdAt: serverTimestamp(), edited: false }
    )
    const conv = conversation.value
    const otherIds = conv?.participantIds.filter(id => id !== uid) ?? []
    const unreadUpdate = Object.fromEntries(
      otherIds.map(id => [`unreadCount.${id}`, increment(1)])
    )
    await updateDoc(convRef.value, {
      lastMessage: { text: text.trim(), senderId: uid, createdAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
      ...unreadUpdate
    })
    for (const otherId of otherIds) {
      emitNotification(
        'message.received',
        `New message from ${user.value.displayName || 'someone'}`,
        text.trim().slice(0, 100),
        { conversationId: toValue(conversationId), senderId: uid }
      )
    }
  }

  async function markRead() {
    if (!user.value) return
    await updateDoc(convRef.value, {
      [`unreadCount.${user.value.uid}`]: 0
    })
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!user.value) return
    const uid = user.value.uid
    const msgRef = doc(db, 'conversations', toValue(conversationId), 'messages', messageId)
    const msg = messages.value?.find(m => m.id === messageId)
    const reactors = msg?.reactions?.[emoji] ?? []
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: reactors.includes(uid) ? arrayRemove(uid) : arrayUnion(uid)
    })
  }

  return { conversation, messages, sendMessage, markRead, toggleReaction }
}
