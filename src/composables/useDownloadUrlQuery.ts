import { useQuery } from '@tanstack/vue-query'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'
import { getFileDownloadUrl } from '@/modules/firebase'

export const useDownloadUrlQuery = (fileName: string) => {
    const { user } = useFirebaseUser()

    return useQuery({
        queryKey: ['download-url', fileName],
        enabled: computed(() => Boolean(user.value)),
        queryFn: () => getFileDownloadUrl(fileName)
    })
}
