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
    type UpdatePlantInput,
    updatePlantsWithRecommendation
} from './plant'
import { v4 } from 'uuid'

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
interface SetupFile {
    extension: string
    croppedImgBlob: Blob
}

interface AddSetupInputWithFile extends Pick<AddSetupInput, 'area'> {
    file: SetupFile
}

interface AddSetupPlantInput extends AddPlantInput {
    positionPercentage: PlantSetup['positionPercentage']
}

interface UpdateSetupInputWithFile extends Setup {
    replacementFile?: SetupFile
}

interface UpdateSetupPlantInput extends Omit<UpdatePlantInput, 'setup'> {
    positionPercentage: PlantSetup['positionPercentage']
    originalDatetimes: number[]
}

export const uploadAndCreateSetup = (
    setup: AddSetupInputWithFile,
    plants: AddSetupPlantInput[],
    onUploading: (progressPercent: number) => void,
    onComplete: () => void
) => {
    const fileName = `${v4()}.${setup.file.extension}`

    return uploadFile(fileName, setup.file.croppedImgBlob, onUploading, async (_, imgName) => {
        const setupId = await createSetup({ imgName, area: setup.area })

        const plantsWithImage = plants.map(({ positionPercentage, ...plant }) => ({
            ...plant,
            setup: { id: setupId, positionPercentage }
        }))
        await batchCreatePlants(plantsWithImage)

        onComplete()
    })
}

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

        const data = plants.map(({ positionPercentage, ...plant }) => ({
            originalPlant: {
                datetimes: plant.originalDatetimes
            },
            updatedPlant: {
                ...plant,
                setup: { id: setup.id, positionPercentage }
            }
        }))
        await updatePlantsWithRecommendation(data)

        onComplete()
    }

    if (setup.replacementFile) {
        // delete previous file if there is a new file
        await deleteFile(setup.imgName)

        const fileName = `${v4()}.${setup.replacementFile.extension}`
        return uploadFile(
            fileName,
            setup.replacementFile.croppedImgBlob,
            onUploading,
            (_, imgName) => update(imgName)
        )
    }

    return update()
}
// #endregion
