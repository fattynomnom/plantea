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

// #region firebase functions
const PLANT_PATHS = ['plants']

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    // TODO: test this converter with addPlant
    toFirestore: (plant: WithFieldValue<Omit<Plant, 'id'>>): DbPlant => {
        console.log('toFirestore', plant)
        return {
            name: plant.name as string,
            dates: (plant.datetimes as number[]).map(datetime => Timestamp.fromMillis(datetime))
        }
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()
        console.log('fromFirestore', data)

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

export const createPlant = (data: Omit<Plant, 'id'>) => createDoc(plantCollectionConfig, data)

const updatePlant = (data: Plant) => updateDoc(plantCollectionConfig, data)
// #endregion

// #region logical functions
export const markPlantWatered = async (plant: Plant) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDateTime = today.getTime()

    if (plant.datetimes.includes(todayDateTime)) {
        return
    }

    await updatePlant({ ...plant, datetimes: [...plant.datetimes, todayDateTime] })
}
// #endregion
