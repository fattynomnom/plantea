import { reactive, ref } from 'vue'
import { type Plant } from '@/models/plant'
import dayjs from 'dayjs'

interface PlantInput extends Pick<Plant, 'name' | 'area'> {
    id?: string
    dates: Array<string | null>
}

const isPlantsDrawerVisible = ref(false)

const plant = reactive<PlantInput>({
    id: undefined,
    name: '',
    dates: [],
    area: undefined
})

const originalDatetimes = ref<Plant['datetimes']>()

export const usePlantsDrawer = () => {
    const editPlant = (data: Pick<Plant, 'id' | 'name' | 'area' | 'datetimes'>) => {
        plant.id = data.id
        plant.name = data.name
        plant.dates = data.datetimes.sort().map(datetime => dayjs(datetime).format('DD/MM/YYYY'))
        plant.area = data.area

        originalDatetimes.value = data.datetimes

        isPlantsDrawerVisible.value = true
    }

    const resetPlant = () => {
        plant.id = undefined
        plant.name = ''
        plant.dates = []
        plant.area = undefined

        originalDatetimes.value = undefined
    }

    return { isPlantsDrawerVisible, plant, originalDatetimes, editPlant, resetPlant }
}
