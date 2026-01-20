import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STR_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
})

// #region auth
export const firebaseAuth = getAuth(app)
firebaseAuth.useDeviceLanguage()

const firebaseProvider = new GoogleAuthProvider()

export const authWithPopup = () => signInWithPopup(firebaseAuth, firebaseProvider)
// #endregion

// #region storage
export const firebaseStorage = getStorage(app)
// #endregion
