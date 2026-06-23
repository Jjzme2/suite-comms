import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { useCollection } from 'vuefire'
import type { HubUser } from '~/types'

export function useHubUsers() {
  const db = useFirestore()
  const user = useCurrentUser()

  const allUsers = useCollection<HubUser>(
    computed(() => user.value ? collection(db, 'hub_users') : null)
  )

  async function registerProfile() {
    if (!user.value) return
    await setDoc(
      doc(db, 'hub_users', user.value.uid),
      {
        uid: user.value.uid,
        displayName: user.value.displayName || '',
        email: user.value.email || '',
        photoURL: user.value.photoURL || '',
        updatedAt: serverTimestamp()
      },
      { merge: true }
    )
  }

  function searchUsers(query: string): HubUser[] {
    const users = allUsers.value ?? []
    const q = query.trim().toLowerCase()
    const currentUid = user.value?.uid
    if (!q) return users.filter(u => u.uid !== currentUid)
    return users.filter(u =>
      u.uid !== currentUid &&
      (u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  }

  return { allUsers, registerProfile, searchUsers }
}
