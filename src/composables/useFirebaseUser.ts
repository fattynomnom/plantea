import { firebaseAuth } from '@/modules/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { ref } from 'vue'

const user = ref<User | null>()

onAuthStateChanged(firebaseAuth, fbUser => {
    user.value = fbUser
})

export const useFirebaseUser = () => ({ user })
