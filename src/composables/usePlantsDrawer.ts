import { reactive, ref } from 'vue'
import { type Plant } from '@/models/plant'

interface PlantInput extends Omit<Plant, 'id' | 'datetimes' | 'nextWateringDate'> {
    id?: string
    dates: Array<Date | null>
}

const isPlantsDrawerVisible = ref(false)

const plant = reactive<PlantInput>({
    id: undefined,
    name: '',
    dates: [],
    area: undefined,
    frequencyDays: undefined
})

const originalDatetimes = ref<Plant['datetimes']>()

export const usePlantsDrawer = () => {
    const editPlant = (data: Plant) => {
        plant.id = data.id
        plant.name = data.name
        plant.dates = data.datetimes.map(datetime => new Date(datetime))
        plant.area = data.area
        plant.frequencyDays = data.frequencyDays

        originalDatetimes.value = data.datetimes

        isPlantsDrawerVisible.value = true
    }

    const resetPlant = () => {
        plant.id = undefined
        plant.name = ''
        plant.dates = []
        plant.area = undefined
        plant.frequencyDays = undefined

        originalDatetimes.value = undefined
    }

    return { isPlantsDrawerVisible, plant, originalDatetimes, editPlant, resetPlant }
}
