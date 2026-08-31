import { reactive, ref } from 'vue'
import { updatePlantWithRecommendation, type Plant, createPlant } from '@/models/plant'
import dayjs from 'dayjs'
import { usePlantsQuery } from './usePlantsQuery'
import { useToast } from './useToast'
import type { PlantInput, PlantOutput } from '@/components/PlantsDrawer.vue'

const isPlantsDrawerVisible = ref(false)
const plant = reactive<PlantInput>({
    id: undefined,
    name: '',
    dates: [null],
    area: undefined
})

export const usePlantsDrawer = () => {
    const isLoading = ref(false)
    const originalDatetimes = ref<Plant['datetimes']>()

    const { invalidatePlantsQuery } = usePlantsQuery()

    const { displayGenericError } = useToast()

    const openCreateDrawer = () => {
        resetPlant()
        isPlantsDrawerVisible.value = true
    }

    const openEditDrawer = (data: Pick<Plant, 'id' | 'name' | 'area' | 'datetimes' | 'setup'>) => {
        plant.id = data.id
        plant.name = data.name
        plant.dates = data.datetimes.sort().map(datetime => dayjs(datetime).format('DD/MM/YYYY'))
        plant.area = data.area
        plant.setup = data.setup

        originalDatetimes.value = data.datetimes

        isPlantsDrawerVisible.value = true
    }

    const resetPlant = () => {
        plant.id = undefined
        plant.name = ''
        plant.dates = [null]
        plant.area = undefined

        originalDatetimes.value = undefined
    }

    const onSubmitPlantForm = async (data: PlantOutput) => {
        isLoading.value = true

        try {
            const datetimes = data.dates.map(date => date.getTime())

            if (data.id) {
                if (!originalDatetimes.value) {
                    throw new Error('Missing original datetimes.')
                }

                await updatePlantWithRecommendation(
                    { datetimes: originalDatetimes.value ?? [] },
                    {
                        ...data,
                        id: data.id,
                        datetimes
                    }
                )
            } else {
                await createPlant({
                    ...data,
                    datetimes
                })
            }

            await invalidatePlantsQuery()
            resetPlant()
            isPlantsDrawerVisible.value = false
        } catch {
            displayGenericError()
        } finally {
            isLoading.value = false
        }
    }

    return {
        isPlantsDrawerVisible,
        isLoading,
        plant,
        openCreateDrawer,
        openEditDrawer,
        onSubmitPlantForm
    }
}
