import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'
import { ToastService } from 'primevue'
import Lara from '@primeuix/themes/lara'
import Tooltip from 'primevue/tooltip'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

const app = createApp(App)
const queryClient = new QueryClient()

app.use(router)
    .use(PrimeVue, {
        theme: {
            preset: Lara
        }
    })
    .use(VueQueryPlugin, { queryClient })
    .use(ToastService)
    .directive('tooltip', Tooltip)

app.mount('#app')
