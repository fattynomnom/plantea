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
    dates: Date[]
}

interface DbPlant {
    name: string
    dates: Timestamp[]
}

const PLANT_PATHS = ['plants']

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    // TODO: test this converter with addPlant
    toFirestore: (plant: WithFieldValue<Omit<Plant, 'id'>>): DbPlant => {
        console.log('toFirestore', plant)
        return {
            name: plant.name as string,
            dates: (plant.dates as Date[]).map(date => Timestamp.fromDate(date))
        }
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()
        console.log('fromFirestore', data)

        return {
            id: snapshot.id,
            name: data.name,
            dates: data.dates.map(({ seconds }) => new Date(seconds * 1000))
        }
    }
}

const plantCollectionConfig: CollectionConfig<Plant, DbPlant> = {
    paths: PLANT_PATHS,
    converter: plantConverter
}

export const fetchPlants = () => fetchCollection(plantCollectionConfig)

export const createPlant = (data: Omit<Plant, 'id'>) => createDoc(plantCollectionConfig, data)

export const updatePlant = (data: Plant) => updateDoc(plantCollectionConfig, data)
