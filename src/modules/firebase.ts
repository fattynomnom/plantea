import { initializeApp } from 'firebase/app'
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as signOutFirebase
} from 'firebase/auth'
import { getStorage } from 'firebase/storage'
import {
    getFirestore,
    collection,
    query,
    getDocs,
    addDoc,
    QueryConstraint,
    doc,
    type DocumentData,
    type FirestoreDataConverter,
    Firestore,
    setDoc,
    writeBatch
} from '@firebase/firestore/lite'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAI, getGenerativeModel, GoogleAIBackend } from 'firebase/ai'

const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STR_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
})

// #region app check
initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(import.meta.env.VITE_FIREBASE_RECAPTCHA_SITE_KEY),

    // Optional argument. If true, the SDK automatically refreshes App Check
    // tokens as needed.
    isTokenAutoRefreshEnabled: true
})
// #endregion

// #region auth
export const firebaseAuth = getAuth(app)
firebaseAuth.useDeviceLanguage()

const firebaseProvider = new GoogleAuthProvider()

export const authWithPopup = () => signInWithPopup(firebaseAuth, firebaseProvider)

export const getUserId = () => firebaseAuth.currentUser?.uid

export const signOut = () => signOutFirebase(firebaseAuth)
// #endregion

// #region storage
export const firebaseStorage = getStorage(app)
// #endregion

// #region genai
const ai = getAI(app, { backend: new GoogleAIBackend() })
const model = getGenerativeModel(ai, { model: 'gemini-3.1-flash-lite-preview' })

export const genAi = async (prompt: string) => {
    const { response } = await model.generateContent(prompt)
    const text = response.text()

    return text
}
// #endregion

// #region database
interface UpdateAppModelType {
    id: string
}

export interface CollectionConfig<AppModelType extends object, DbModelType extends DocumentData> {
    paths: string[]
    converter: FirestoreDataConverter<AppModelType, DbModelType>
}

const firestore = getFirestore(app)

const getBasePath = (): [Firestore, string, string] | null => {
    const user = firebaseAuth.currentUser
    return user ? [firestore, 'users', user.uid] : null
}

const getCollectionRef = <AppModelType extends object, DbModelType extends DocumentData>({
    paths,
    converter
}: CollectionConfig<AppModelType, DbModelType>) => {
    const basePath = getBasePath()
    return basePath ? collection(...basePath, ...paths).withConverter(converter) : null
}

export const fetchCollection = async <
    AppModelType extends object,
    DbModelType extends DocumentData
>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    queryConstraints: QueryConstraint[] = []
): Promise<AppModelType[]> => {
    console.log(`Fetching paths: ${collectionConfig.paths.join(', ')}`)

    const items: AppModelType[] = []
    const ref = getCollectionRef(collectionConfig)
    if (ref) {
        const q = query<AppModelType, DbModelType>(ref, ...queryConstraints)
        const querySnapshot = await getDocs<AppModelType, DbModelType>(q)
        querySnapshot.forEach(doc => {
            items.push(doc.data())
        })
    }

    return items
}

export const createDoc = async <AppModelType extends object, DbModelType extends DocumentData>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: Omit<AppModelType, 'id'>
): Promise<void> => {
    const ref = getCollectionRef(collectionConfig)
    if (ref) {
        await addDoc(ref, data)
    }
}

export const updateDoc = async <
    AppModelType extends UpdateAppModelType,
    DbModelType extends DocumentData
>(
    { paths, converter }: CollectionConfig<AppModelType, DbModelType>,
    data: AppModelType
) => {
    console.log('Update doc:', data)

    const basePath = getBasePath()
    if (basePath) {
        await setDoc(doc(...basePath, ...paths, data.id).withConverter(converter), data)
    }
}

export const batchUpdateDocs = async <
    AppModelType extends UpdateAppModelType,
    DbModelType extends DocumentData
>(
    { paths, converter }: CollectionConfig<AppModelType, DbModelType>,
    data: AppModelType[]
): Promise<void> => {
    if (!data.length) {
        return
    }

    const basePath = getBasePath()
    if (basePath) {
        const batch = writeBatch(firestore)
        data.forEach(item => {
            const docRef = doc(...basePath, ...paths, item.id).withConverter(converter)
            batch.set(docRef, item)
        })

        await batch.commit()
    }
}
// #endregion
