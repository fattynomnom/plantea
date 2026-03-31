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
    isWateredToday: boolean
    shouldBeWatered: boolean
}

interface DbPlant {
    name: string
    dates: Timestamp[]
    area?: string
    frequencyDays?: number
}

export type AddPlantInput = Pick<Plant, 'name' | 'datetimes' | 'area' | 'frequencyDays'>

export type UpdatePlantInput = Pick<Plant, 'id' | 'name' | 'datetimes' | 'area' | 'frequencyDays'>

// #region firebase functions
const PLANT_PATHS = ['plants']

const today = new Date()
today.setHours(0, 0, 0, 0)
const todayDateTime = today.getTime()

const shouldBeWatered = (nextWateringDate: Plant['nextWateringDate']) => {
    if (!nextWateringDate) {
        return false
    }

    const nextWateringDatetime = nextWateringDate.unix() * 1000
    return nextWateringDatetime <= todayDateTime
}

const plantConverter: FirestoreDataConverter<Plant, DbPlant> = {
    toFirestore: (plant: WithFieldValue<AddPlantInput>): DbPlant => ({
        name: plant.name as string,
        dates: (plant.datetimes as number[])
            .sort((a, b) => b - a)
            .map(datetime => Timestamp.fromMillis(datetime)),
        ...(plant.area && { area: plant.area as string }),
        ...(typeof plant.frequencyDays === 'number' && {
            frequencyDays: plant.frequencyDays as number
        })
    }),
    fromFirestore: (snapshot: QueryDocumentSnapshot<DbPlant>): Plant => {
        const data = snapshot.data()

        const datetimes = data.dates.map(({ seconds }) => seconds * 1000).sort((a, b) => b - a)
        const nextWateringDate =
            datetimes[0] && data.frequencyDays
                ? dayjs(datetimes[0]).add(data.frequencyDays, 'days')
                : undefined

        const isWateredToday = datetimes.includes(todayDateTime)

        return {
            id: snapshot.id,
            name: data.name,
            datetimes,
            area: data.area,
            frequencyDays: data.frequencyDays,
            nextWateringDate,
            isWateredToday,
            shouldBeWatered: shouldBeWatered(nextWateringDate)
        }
    }
}

const plantCollectionConfig: CollectionConfig<Plant, DbPlant> = {
    paths: PLANT_PATHS,
    converter: plantConverter
}

export const fetchPlants = () => fetchCollection(plantCollectionConfig)

export const createPlant = (data: AddPlantInput) =>
    createDoc<AddPlantInput, DbPlant>(plantCollectionConfig, data)

export const updatePlant = (data: UpdatePlantInput) => updateDoc(plantCollectionConfig, data)
// #endregion

// #region logical functions
export const markPlantWatered = async (plant: Omit<Plant, 'shouldBeWatered'>) => {
    if (plant.isWateredToday) {
        return
    }

    let frequencyDays: number | undefined = undefined
    const updatedPlant: Omit<Plant, 'shouldBeWatered'> = {
        ...plant,
        datetimes: [...plant.datetimes, todayDateTime]
    }

    // regenerate recommendation when logged date is different from recommended date
    if (plant.nextWateringDate) {
        const nextWateringDatetime = plant.nextWateringDate.unix() * 1000
        if (nextWateringDatetime !== todayDateTime) {
            frequencyDays = await genPlantAnalysis(updatedPlant)
        }
    } else {
        // generate recommendation if there is none generated yet
        frequencyDays = await genPlantAnalysis(updatedPlant)
    }

    await updatePlant({ ...updatedPlant, frequencyDays })
}

export const updatePlantWithRecommendation = async (
    originalPlant: Pick<Plant, 'datetimes'>,
    updatedPlant: UpdatePlantInput
) => {
    // regenerate recommendation if some datetimes have been updated
    const originalDatetimes = originalPlant.datetimes.sort()
    const updatedDatetimes = updatedPlant.datetimes.sort()
    let frequencyDays: number | undefined = updatedPlant.frequencyDays
    if (
        originalDatetimes.some(
            (originalDatetime, index) => originalDatetime !== updatedDatetimes[index]
        )
    ) {
        frequencyDays = await genPlantAnalysis(updatedPlant)
    }

    await updatePlant({ ...updatedPlant, frequencyDays })
}

export const genPlantAnalysis = async (
    plant: Pick<Plant, 'name' | 'datetimes'>
): Promise<number> => {
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
    }

    return days
}
// #endregion
