import {
    createDoc,
    fetchCollection,
    updateDoc,
    type CollectionConfig,
    genAi
} from '@/modules/firebase'
import dayjs, { Dayjs } from 'dayjs'
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
    frequencyDays?: number
    nextWateringDate?: Dayjs
}

interface DbPlant {
    name: string
    dates: Timestamp[]
    area?: string
    frequencyDays?: number
}

export type AddPlantInput = Pick<Plant, 'name' | 'datetimes' | 'area' | 'frequencyDays'>

export type UpdatePlantInput = Omit<Plant, 'nextWateringDate'>

// #region firebase functions
const PLANT_PATHS = ['plants']

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    toFirestore: (plant: WithFieldValue<AddPlantInput>): DbPlant => ({
        name: plant.name as string,
        dates: (plant.datetimes as number[]).map(datetime => Timestamp.fromMillis(datetime)),
        ...(plant.area && { area: plant.area as string }),
        ...(typeof plant.frequencyDays === 'number' && {
            frequencyDays: plant.frequencyDays as number
        })
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()
        const datetimes = data.dates.map(({ seconds }) => seconds * 1000).sort((a, b) => b - a)

        return {
            id: snapshot.id,
            name: data.name,
            datetimes,
            area: data.area,
            frequencyDays: data.frequencyDays,
            nextWateringDate:
                datetimes[0] && data.frequencyDays
                    ? dayjs(datetimes[0]).add(data.frequencyDays, 'days')
                    : undefined
        }
    }
}

const plantCollectionConfig: CollectionConfig<Plant, DbPlant> = {
    paths: PLANT_PATHS,
    converter: plantConverter
}

export const fetchPlants = () => fetchCollection(plantCollectionConfig)

export const createPlant = (data: AddPlantInput) => createDoc(plantCollectionConfig, data)

export const updatePlant = (data: UpdatePlantInput) => updateDoc(plantCollectionConfig, data)
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

    if (plant.nextWateringDate) {
        const nextWateringDatetime = plant.nextWateringDate.unix() * 1000
        if (nextWateringDatetime !== todayDateTime) {
            await genPlantAnalysis(plant)
        }
    }
}

export const genPlantAnalysis = async (plant: UpdatePlantInput) => {
    const prompt = `The following is the user's inputted plant name and their logged historical watering dates.
Plant name: ${plant.name}
Dates: ${plant.datetimes.map(datetime => dayjs(datetime).format('DD/MM/YYYY')).join(', ')}
Analyse the dates and generate a recommended watering frequency schedule.
Your output should be a number to indicate the days, example: If your recommendation is to water the plant every 7 days, your output should be just be "7".
Some things to consider:
- Plant name may not be accurate and may contain descriptive words like "Tall", "White" etc.
- The user may have missed logging some watering dates.`

    const result = await genAi(prompt)
    const days = Number(result)

    if (isNaN(days)) {
        console.log('GenAi error', result)
        throw new Error('Error generating plant analysis.')
    } else {
        await updatePlant({
            ...plant,
            frequencyDays: days
        })
        console.log(1, result)
    }
}
// #endregion
