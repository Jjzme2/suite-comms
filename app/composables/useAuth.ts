import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth'

export function useAuth() {
  const auth = useFirebaseAuth()!

  async function loginWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    return signInWithPopup(auth, provider)
  }

  async function logout() {
    await signOut(auth)
  }

  return { loginWithEmail, loginWithGoogle, logout }
}
