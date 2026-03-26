import { reactive, ref } from 'vue'
import { type Plant } from '@/models/plant'

interface PlantInput extends Omit<Plant, 'id' | 'datetimes'> {
    id?: string
    dates: Array<Date | null>
}

const isPlantsDrawerVisible = ref(false)

const plant = reactive<PlantInput>({
    id: undefined,
    name: '',
    dates: []
})

export const usePlantsDrawer = () => {
    const editPlant = (data: Plant) => {
        plant.id = data.id
        plant.name = data.name
        plant.dates = data.datetimes.map(datetime => new Date(datetime))
        isPlantsDrawerVisible.value = true
    }

    const resetPlant = () => {
        plant.id = undefined
        plant.name = ''
        plant.dates = []
    }

    return { isPlantsDrawerVisible, plant, editPlant, resetPlant }
}
