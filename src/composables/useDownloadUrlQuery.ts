import { useQuery } from '@tanstack/vue-query'
import { useFirebaseUser } from './useFirebaseUser'
import { computed, type ComputedRef, type Ref } from 'vue'
import { getFileDownloadUrl } from '@/modules/firebase'

export const useDownloadUrlQuery = (
    fileName: Ref<string | undefined> | ComputedRef<string | undefined>
) => {
    const { user } = useFirebaseUser()

    return useQuery({
        queryKey: ['download-url', fileName.value],
        enabled: computed(() => Boolean(user.value && fileName.value)),
        queryFn: () => getFileDownloadUrl(fileName.value!)
    })
}
