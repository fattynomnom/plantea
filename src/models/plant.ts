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
}

interface DbPlant {
    name: string
    dates: Timestamp[]
}

export type PlantInput = Omit<Plant, 'id'>

// #region firebase functions
const PLANT_PATHS = ['plants']

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    toFirestore: (plant: WithFieldValue<Omit<Plant, 'id'>>): DbPlant => ({
        name: plant.name as string,
        dates: (plant.datetimes as number[]).map(datetime => Timestamp.fromMillis(datetime))
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()

        return {
            id: snapshot.id,
            name: data.name,
            datetimes: data.dates.map(({ seconds }) => seconds * 1000)
        }
    }
}

const plantCollectionConfig: CollectionConfig<Plant, DbPlant> = {
    paths: PLANT_PATHS,
    converter: plantConverter
}

export const fetchPlants = () => fetchCollection(plantCollectionConfig)

export const createPlant = (data: PlantInput) => createDoc(plantCollectionConfig, data)

const updatePlant = (data: Plant) => updateDoc(plantCollectionConfig, data)
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
