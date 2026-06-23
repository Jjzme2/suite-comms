import { doc, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'

export function useTyping(contextId: MaybeRefOrGetter<string>) {
  const db = useFirestore()
  const user = useCurrentUser()
  let typingTimer: ReturnType<typeof setTimeout> | null = null

  const userTypingRef = computed(() =>
    user.value
      ? doc(db, 'comms_typing', toValue(contextId), 'users', user.value.uid)
      : null
  )

  const typingDocs = useCollection<{ uid: string; displayName: string; timestamp: { toMillis(): number } }>(
    computed(() => {
      const id = toValue(contextId)
      return id ? collection(db, 'comms_typing', id, 'users') : null
    })
  )

  const typingUsers = computed(() => {
    const uid = user.value?.uid
    const now = Date.now()
    return (typingDocs.value ?? [])
      .filter(d => d.uid !== uid && d.timestamp?.toMillis && now - d.timestamp.toMillis() < 6000)
      .map(d => d.displayName)
  })

  function startTyping() {
    if (!user.value || !userTypingRef.value) return
    setDoc(userTypingRef.value, {
      uid: user.value.uid,
      displayName: user.value.displayName || 'Someone',
      timestamp: serverTimestamp()
    })
    if (typingTimer) clearTimeout(typingTimer)
    typingTimer = setTimeout(stopTyping, 3500)
  }

  function stopTyping() {
    if (userTypingRef.value) deleteDoc(userTypingRef.value).catch(() => {})
    if (typingTimer) {
      clearTimeout(typingTimer)
      typingTimer = null
    }
  }

  onUnmounted(stopTyping)

  return { typingUsers, startTyping, stopTyping }
}
