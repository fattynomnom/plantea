import { reactive, ref } from 'vue'
import { updatePlantWithRecommendation, type Plant, createPlant } from '@/models/plant'
import dayjs from 'dayjs'
import { usePlantsQuery } from './usePlantsQuery'
import { useToast } from './useToast'
import type { PlantInput, PlantOutput } from '@/components/PlantsDrawer.vue'

export const usePlantsDrawer = () => {
    const isPlantsDrawerVisible = ref(false)
    const isLoading = ref(false)
    const originalDatetimes = ref<Plant['datetimes']>()
    const plant = reactive<PlantInput>({
        id: undefined,
        name: '',
        dates: [null],
        area: undefined
    })

    const { invalidatePlantsQuery } = usePlantsQuery()

    const { displayGenericError } = useToast()

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
        plant.dates = [null]
        plant.area = undefined

        originalDatetimes.value = undefined

        isPlantsDrawerVisible.value = false
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
        editPlant,
        onSubmitPlantForm
    }
}
