import { defineStore } from 'pinia'
import { signOut } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = useCurrentUser()
  const auth = useFirebaseAuth()!

  async function logout() {
    await signOut(auth)
  }

  return { currentUser, logout }
})
