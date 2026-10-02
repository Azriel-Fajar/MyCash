import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase } from 'firebase/database'

const env = import.meta.env
if (!env.VITE_FIREBASE_API_KEY) throw new Error('Firebase config missing: copy .env.example to .env.local and fill it in.')

const host = location.hostname
// On Firebase Hosting the auth handler lives on the same origin; using it avoids
// third-party storage problems with redirect sign-in inside the installed PWA.
const onHosting = host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')

// Web config is public by design; access is enforced by the database rules.
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: onHosting ? location.host : env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})

export const auth = getAuth(app)
export const db = getDatabase(app)

if (import.meta.env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectDatabaseEmulator(db, '127.0.0.1', 9000)
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider()
  try {
    await signInWithPopup(auth, provider)
  } catch (e) {
    const code = (e as { code?: string }).code
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider)
    } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
      throw e
    }
  }
}
