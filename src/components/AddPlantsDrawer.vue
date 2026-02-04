<template>
    <Drawer
        v-model:visible="visible"
        header="Add new plant"
        position="bottom"
        :class="{ dark: isDark }"
    >
        <form class="space-y-7" @submit.prevent="onSubmit">
            <div class="flex flex-col space-y-2">
                <label for="name-input">Name</label>
                <InputText id="name-input" v-model="name" type="text" name="Name" />
            </div>

            <div class="flex justify-end">
                <CustomButton type="submit" variant="accent">
                    <span>Create</span>
                    <ArrowRightCircleIcon />
                </CustomButton>
            </div>
        </form>
    </Drawer>
</template>

<script setup lang="ts">
import { ArrowRightCircleIcon } from '@heroicons/vue/24/outline'
import CustomButton from '@/components/CustomButton.vue'
import Drawer from 'primevue/drawer'
import { ref } from 'vue'
import { useDark } from '@vueuse/core'
import { InputText } from 'primevue'
import { createPlant } from '@/models/plant'

const emit = defineEmits<{
    (e: 'submitted'): void
}>()

const isDark = useDark()

const visible = defineModel<boolean>('visible', { required: true })

const name = ref<string>('')

const onSubmit = async () => {
    if (name.value) {
        await createPlant({ name: name.value, dates: [] })
        visible.value = false
        emit('submitted')
    }
}
</script>
