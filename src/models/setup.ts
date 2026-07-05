import {
    createDoc,
    type CollectionConfig,
    uploadFile,
    fetchCollection,
    deleteFile,
    updateDoc
} from '@/modules/firebase'
import {
    QueryDocumentSnapshot,
    type FirestoreDataConverter,
    type WithFieldValue
} from 'firebase/firestore/lite'
import {
    batchCreatePlants,
    type AddPlantInput,
    type PlantSetup,
    batchUpdatePlants,
    type UpdatePlantInput
} from './plant'

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

const updateSetup = (data: Setup) => updateDoc<Setup, DbSetup>(setupCollectionConfig, data)
// #endregion

// #region logical functions
interface AddSetupInputWithFile extends Pick<AddSetupInput, 'area'> {
    file: File
}

interface AddSetupPlantInput extends AddPlantInput {
    position: PlantSetup['position']
}

interface UpdateSetupInputWithFile extends Setup {
    file?: File
}

interface UpdateSetupPlantInput extends UpdatePlantInput {
    position: PlantSetup['position']
}

export const uploadAndCreateSetup = (
    setup: AddSetupInputWithFile,
    plants: AddSetupPlantInput[],
    onUploading: (progressPercent: number) => void,
    onComplete: () => void
) =>
    uploadFile(setup.file, onUploading, async (_, imgName) => {
        const setupId = await createSetup({ imgName, area: setup.area })

        const plantsWithImage = plants.map(({ position, ...plant }) => ({
            ...plant,
            setup: { id: setupId, position }
        }))
        await batchCreatePlants(plantsWithImage)

        onComplete()
    })

export const updateSetupAndPlants = async (
    setup: UpdateSetupInputWithFile,
    plants: UpdateSetupPlantInput[],
    onUploading: (progressPercent: number) => void,
    onComplete: () => void
) => {
    const update = async (uploadedImgName?: string) => {
        await updateSetup({
            id: setup.id,
            imgName: uploadedImgName ?? setup.imgName,
            area: setup.area
        })

        const plantsWithImage = plants.map(({ position, ...plant }) => ({
            ...plant,
            setup: { id: setup.id, position }
        }))
        // TODO: use originalDatetimes to see if frequency needs to be regenerated
        await batchUpdatePlants(plantsWithImage)

        onComplete()
    }

    if (setup.file) {
        // delete previous file if there is a new file
        await deleteFile(setup.imgName)

        return uploadFile(setup.file, onUploading, (_, imgName) => update(imgName))
    }

    return update()
}
// #endregion
