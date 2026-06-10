import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { useFirebaseUser } from './useFirebaseUser'
import { computed, isRef, type ComputedRef } from 'vue'
import { getFileDownloadUrl } from '@/modules/firebase'

export const useDownloadUrlQuery = (fileName?: ComputedRef<string | undefined> | string) => {
    const { user } = useFirebaseUser()

    const queryClient = useQueryClient()

    return {
        ...useQuery({
            queryKey: ['download-url', fileName],
            enabled: computed(() => Boolean(user.value && fileName)),
            queryFn: () => {
                const value = isRef(fileName) ? fileName.value : fileName
                if (!value) {
                    throw new Error('filename is required to execute useDownloadUrlQuery.')
                }

                return getFileDownloadUrl(value)
            }
        }),
        invalidateDownloadUrls: () =>
            queryClient.invalidateQueries({
                queryKey: ['download-url']
            })
    }
}
