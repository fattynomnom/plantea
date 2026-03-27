import { createDoc, fetchCollection, updateDoc, type CollectionConfig } from '@/modules/firebase'
import {
    QueryDocumentSnapshot,
    Timestamp,
    type FirestoreDataConverter,
    type WithFieldValue
} from 'firebase/firestore/lite'

export interface Plant {
    id: string
    name: string
    datetimes: number[]
    area?: string
}

interface DbPlant {
    name: string
    dates: Timestamp[]
    area?: string
}

export type AddPlantInput = Omit<Plant, 'id'>

// #region firebase functions
const PLANT_PATHS = ['plants']

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    toFirestore: (plant: WithFieldValue<AddPlantInput>): DbPlant => ({
        name: plant.name as string,
        dates: (plant.datetimes as number[]).map(datetime => Timestamp.fromMillis(datetime)),
        ...(plant.area && { area: plant.area as string })
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()

        return {
            id: snapshot.id,
            name: data.name,
            datetimes: data.dates.map(({ seconds }) => seconds * 1000),
            area: data.area
        }
    }
}

const plantCollectionConfig: CollectionConfig<Plant, DbPlant> = {
    paths: PLANT_PATHS,
    converter: plantConverter
}

export const fetchPlants = () => fetchCollection(plantCollectionConfig)

export const createPlant = (data: AddPlantInput) => createDoc(plantCollectionConfig, data)

export const updatePlant = (data: Plant) => updateDoc(plantCollectionConfig, data)
// #endregion

// #region logical functions
const today = new Date()
today.setHours(0, 0, 0, 0)
const todayDateTime = today.getTime()

export const isPlantWateredToday = (plant: Pick<Plant, 'datetimes'>) =>
    plant.datetimes.includes(todayDateTime)

export const markPlantWatered = async (plant: Plant) => {
    if (isPlantWateredToday(plant)) {
        return
    }

    await updatePlant({ ...plant, datetimes: [...plant.datetimes, todayDateTime] })
}
// #endregion
