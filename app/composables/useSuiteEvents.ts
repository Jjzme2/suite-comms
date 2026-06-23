import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import type { SuiteEventType } from '~/types'

export function useSuiteEvents() {
  const db = useFirestore()
  const user = useCurrentUser()

  async function emitActivity(
    type: SuiteEventType,
    summary: string,
    data: Record<string, unknown> = {}
  ) {
    if (!user.value) return
    await addDoc(collection(db, 'users', user.value.uid, 'activity'), {
      type,
      source: 'comms',
      summary,
      data,
      createdAt: serverTimestamp()
    })
  }

  async function emitNotification(
    type: SuiteEventType,
    title: string,
    body: string,
    data: Record<string, unknown> = {}
  ) {
    if (!user.value) return
    await addDoc(collection(db, 'users', user.value.uid, 'notifications'), {
      type,
      source: 'comms',
      title,
      body,
      data,
      read: false,
      createdAt: serverTimestamp()
    })
  }

  return { emitActivity, emitNotification }
}
