import './assets/main.css'
import 'cropperjs/dist/cropper.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import { ToastService } from 'primevue'
import Lara from '@primeuix/themes/lara'
import Tooltip from 'primevue/tooltip'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'
import VueCropper from 'vue-cropperjs'

const app = createApp(App)

const persister = experimental_createQueryPersister({
    storage: window.localStorage
})

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            persister: persister.persisterFn
        }
    }
})

app.use(router)
    .use(PrimeVue, {
        theme: {
            preset: Lara
        }
    })
    .use(VueQueryPlugin, { queryClient })
    .use(ToastService)
    .directive('tooltip', Tooltip)
    .component('VueCropper', VueCropper)

app.mount('#app')

window.__TANSTACK_QUERY_CLIENT__ = queryClient
