import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { getPlantsToWaterOnDate, type Plant } from './plant'

const createPlant = (
    id: string,
    nextWateringDate: ReturnType<typeof dayjs> | undefined,
    frequencyDays?: number
): Plant => ({
    id,
    name: `Plant ${id}`,
    datetimes: [],
    nextWateringDate: nextWateringDate ? nextWateringDate?.unix() * 1000 : undefined,
    frequencyDays,
    isWateredToday: false,
    shouldBeWatered: false
})

describe('getPlantsToWaterOnDate', () => {
    it('returns plants whose next watering date matches the target date', () => {
        const plants: Plant[] = [
            createPlant('a', dayjs('2026-04-10'), 3),
            createPlant('b', dayjs('2026-04-11'), 3)
        ]
        const result = getPlantsToWaterOnDate(plants, new Date('2026-04-10T14:30:00.000Z'))

        expect(result.map(plant => plant.id)).toEqual(['a'])
    })

    it('returns plants whose recurring schedule lands on the target date', () => {
        const plants: Plant[] = [
            createPlant('a', dayjs('2026-04-01'), 3),
            createPlant('b', dayjs('2026-04-01'), 4)
        ]
        const result = getPlantsToWaterOnDate(plants, new Date('2026-04-10T08:00:00.000Z'))

        expect(result.map(plant => plant.id)).toEqual(['a'])
    })

    it('ignores plants without enough scheduling data', () => {
        const plants: Plant[] = [
            createPlant('a', undefined, 3),
            createPlant('b', dayjs('2026-04-10')),
            createPlant('c', dayjs('2026-04-11'), 2)
        ]
        const result = getPlantsToWaterOnDate(plants, new Date('2026-04-10T09:00:00.000Z'))

        expect(result).toEqual([])
    })
})
