import { firebaseStorage } from '@/modules/firebase'
import { getDownloadURL, ref as strRef, uploadBytesResumable } from 'firebase/storage'
import { ref } from 'vue'

export const useFileUpload = (file: File | Blob) => {
    const progressPercent = ref<number>(0)
    const uploadedUrl = ref<string>()

    const storageRef = strRef(firebaseStorage, 'plant-setups')
    const uploadTask = uploadBytesResumable(storageRef, file)
    uploadTask.on(
        'state_changed',
        snapshot => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            console.log('Upload is ' + progress + '% done')
            progressPercent.value = progress
        },
        undefined,
        async () => {
            uploadedUrl.value = await getDownloadURL(uploadTask.snapshot.ref)
        }
    )

    return { progressPercent, uploadedUrl }
}
