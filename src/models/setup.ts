import { createDoc, type CollectionConfig, uploadFile } from '@/modules/firebase'
import {
    QueryDocumentSnapshot,
    type FirestoreDataConverter,
    type WithFieldValue
} from 'firebase/firestore/lite'
import { type AddPlantInput, batchSetPlants, type PlantSetup } from './plant'

export interface Setup {
    id: string
    imgId: string
    area?: string
}

interface DbSetup {
    id?: string
    imgId: string
    area?: string
}

type AddSetupInput = Pick<Setup, 'imgId' | 'area'>

// #region firebase functions
const SETUP_PATHS = ['setups']

const setupConverter: FirestoreDataConverter<Setup, DbSetup> = {
    toFirestore: (setup: WithFieldValue<Omit<Setup, 'id'>>): DbSetup => ({
        imgId: setup.imgId as string,
        ...(setup.area && { area: setup.area as string })
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbSetup>): Setup => {
        const data = snapshot.data()

        return {
            id: snapshot.id,
            imgId: data.imgId,
            area: data.area
        }
    }
}

const setupCollectionConfig: CollectionConfig<Setup, DbSetup> = {
    paths: SETUP_PATHS,
    converter: setupConverter
}

const createSetup = (data: AddSetupInput) =>
    createDoc<AddSetupInput, DbSetup>(setupCollectionConfig, data)
// #endregion

// #region logical functions
interface SetupPlantInput extends Omit<AddPlantInput, 'image'> {
    position: PlantSetup['position']
}

export const uploadAndCreateSetup = (
    file: File,
    setup: Pick<Setup, 'area'>,
    plants: SetupPlantInput[],
    onUploading: (progressPercent: number) => void,
    onComplete: () => void
) =>
    uploadFile(file, onUploading, async (_, imgId) => {
        const setupId = await createSetup({ imgId, area: setup.area })

        const plantsWithImage = plants.map(({ position, ...plant }) => ({
            ...plant,
            setup: { id: setupId, position }
        }))
        await batchSetPlants(plantsWithImage)

        onComplete()
    })
// #endregion
