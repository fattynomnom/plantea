import { createDoc, type CollectionConfig, uploadFile, fetchCollection } from '@/modules/firebase'
import {
    QueryDocumentSnapshot,
    type FirestoreDataConverter,
    type WithFieldValue
} from 'firebase/firestore/lite'
import { batchCreatePlants, type AddPlantInput, type PlantSetup } from './plant'

export interface Setup {
    id: string
    imgName: string
    area?: string
}

interface DbSetup {
    id?: string
    imgName: string
    area?: string
}

type AddSetupInput = Pick<Setup, 'imgName' | 'area'>

// #region firebase functions
const SETUP_PATHS = ['setups']

const setupConverter: FirestoreDataConverter<Setup, DbSetup> = {
    toFirestore: (setup: WithFieldValue<Omit<Setup, 'id'>>): DbSetup => ({
        imgName: setup.imgName as string,
        ...(setup.area && { area: setup.area as string })
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbSetup>): Setup => {
        const data = snapshot.data()

        return {
            id: snapshot.id,
            imgName: data.imgName,
            area: data.area
        }
    }
}

const setupCollectionConfig: CollectionConfig<Setup, DbSetup> = {
    paths: SETUP_PATHS,
    converter: setupConverter
}

export const fetchSetups = () => fetchCollection(setupCollectionConfig)

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
    uploadFile(file, onUploading, async (_, imgName) => {
        const setupId = await createSetup({ imgName, area: setup.area })

        const plantsWithImage = plants.map(({ position, ...plant }) => ({
            ...plant,
            setup: { id: setupId, position }
        }))
        await batchCreatePlants(plantsWithImage)

        onComplete()
    })
// #endregion
