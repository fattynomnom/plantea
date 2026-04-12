import { initializeApp } from 'firebase/app'
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut as signOutFirebase
} from 'firebase/auth'
import { getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage'
import {
    type DocumentReference,
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
import { getFileExtension } from '@/utils/file.utils'
import { v4 } from 'uuid'

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

const getUserId = (): string => {
    const id = firebaseAuth.currentUser?.uid
    if (!id) {
        throw new Error('No authenticated Firebase user found.')
    }

    return id
}

export const signOut = () => signOutFirebase(firebaseAuth)
// #endregion

// #region storage
export const firebaseStorage = getStorage(app)

export const uploadFile = (
    file: File,
    onUploading: (progressPercent: number) => void,
    onComplete: (url: string, fileName: string) => void
) => {
    const userId = getUserId()
    const fileName = `${v4()}.${getFileExtension(file)}`
    const strRef = ref(firebaseStorage, `users/${userId}/${fileName}`)

    const uploadTask = uploadBytesResumable(strRef, file)
    uploadTask.on(
        'state_changed',
        snapshot => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            console.log('Upload is ' + progress + '% done')
            onUploading(progress)
        },
        error => {
            throw error
        },
        async () => {
            try {
                const url = await getDownloadURL(uploadTask.snapshot.ref)
                console.log('File available at', url)
                onComplete(url, fileName)
            } catch (error) {
                console.log('Get download url error', error)
                throw error
            }
        }
    )
}

export const getFileDownloadUrl = (fileName: string) => {
    console.log('Fetching download URL', fileName)

    const userId = getUserId()
    const strRef = ref(firebaseStorage, `users/${userId}/${fileName}`)

    return getDownloadURL(strRef)
}
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

const getBasePath = (): [Firestore, string, string] => [firestore, 'users', getUserId()]

const getCollectionRef = <AppModelType extends object, DbModelType extends DocumentData>({
    paths,
    converter
}: CollectionConfig<AppModelType, DbModelType>) => {
    const basePath = getBasePath()
    return collection(...basePath, ...paths).withConverter(converter)
}

const getDocRef = <AppModelType extends object, DbModelType extends DocumentData>(
    { paths, converter }: CollectionConfig<AppModelType, DbModelType>,
    docId: string
) => {
    const basePath = getBasePath()
    return doc(...basePath, ...paths, docId).withConverter(converter)
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
    const q = query<AppModelType, DbModelType>(ref, ...queryConstraints)
    const querySnapshot = await getDocs<AppModelType, DbModelType>(q)
    querySnapshot.forEach(doc => {
        items.push(doc.data())
    })

    return items
}

export const createDoc = async <AppModelType extends object, DbModelType extends DocumentData>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: Omit<AppModelType, 'id'>
): Promise<string> => {
    const ref = getCollectionRef(collectionConfig)
    const result = await addDoc(ref, data)

    return result.id
}

export const updateDoc = async <
    AppModelType extends UpdateAppModelType,
    DbModelType extends DocumentData
>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: AppModelType
) => {
    console.log('Update doc:', data)

    const ref = getDocRef(collectionConfig, data.id)
    await setDoc(ref, data)
}

const batchSetDocs = async <AppModelType extends object, DbModelType extends DocumentData>(
    data: AppModelType[],
    getDocumentRef: (docId?: string) => DocumentReference<AppModelType, DbModelType>
): Promise<void> => {
    if (!data.length) {
        return
    }

    const batch = writeBatch(firestore)
    data.forEach(item => {
        const docRef = getDocumentRef('id' in item && item.id === 'string' ? item.id : undefined)
        batch.set(docRef, item)
    })

    await batch.commit()
}

export const batchCreateDocs = async <
    AppModelType extends object,
    DbModelType extends DocumentData
>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: Array<Omit<AppModelType, 'id'>>
): Promise<void> => {
    const collectionRef = getCollectionRef(collectionConfig)
    return batchSetDocs(data, () => doc(collectionRef))
}

export const batchUpdateDocs = async <
    AppModelType extends UpdateAppModelType,
    DbModelType extends DocumentData
>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: AppModelType[]
): Promise<void> =>
    batchSetDocs(data, docId => {
        if (!docId) {
            throw new Error('Document ID is required for batchUpdateDocs.')
        }

        return getDocRef(collectionConfig, docId)
    })
// #endregion
