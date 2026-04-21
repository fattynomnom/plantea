import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useFirebaseUser } from './useFirebaseUser'
import { computed } from 'vue'
import { getFileDownloadUrl } from '@/modules/firebase'

export const useDownloadUrlQuery = (fileName?: string) => {
    const { user } = useFirebaseUser()

    const queryClient = useQueryClient()

    return {
        ...useQuery({
            queryKey: ['download-url', fileName],
            enabled: computed(() => Boolean(user.value && fileName)),
            queryFn: () => {
                if (!fileName) {
                    throw new Error('filename is required to execute useDownloadUrlQuery.')
                }

                return getFileDownloadUrl(fileName)
            }
        }),
        invalidateDownloadUrls: () =>
            queryClient.invalidateQueries({
                queryKey: ['download-url']
            })
    }
}
