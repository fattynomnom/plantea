import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
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
    setDoc
} from '@firebase/firestore/lite'

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

export const getUserId = () => firebaseAuth.currentUser?.uid
// #endregion

// #region storage
export const firebaseStorage = getStorage(app)
// #endregion

// #region database
interface BaseAppModelType {
    id: string
}

export interface CollectionConfig<
    AppModelType extends BaseAppModelType,
    DbModelType extends DocumentData
> {
    paths: string[]
    converter: FirestoreDataConverter<AppModelType, DbModelType>
}

const firestore = getFirestore(app)

const getBasePath = (): [Firestore, string, string] | null => {
    const user = firebaseAuth.currentUser
    return user ? [firestore, 'users', user.uid] : null
}

const getCollectionRef = <AppModelType extends BaseAppModelType, DbModelType extends DocumentData>({
    paths,
    converter
}: CollectionConfig<AppModelType, DbModelType>) => {
    const basePath = getBasePath()
    return basePath ? collection(...basePath, ...paths).withConverter(converter) : null
}

export const fetchCollection = async <
    AppModelType extends BaseAppModelType,
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

export const createDoc = async <
    AppModelType extends BaseAppModelType,
    DbModelType extends DocumentData
>(
    collectionConfig: CollectionConfig<AppModelType, DbModelType>,
    data: Omit<AppModelType, 'id'>
): Promise<void> => {
    const ref = getCollectionRef(collectionConfig)
    if (ref) {
        await addDoc(ref, data)
    }
}

export const updateDoc = async <
    AppModelType extends BaseAppModelType,
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
// #endregion
