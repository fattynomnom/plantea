import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('../views/PlantsView.vue')
        },
        {
            path: '/create',
            name: 'create',
            component: () => import('../views/CreatePlantsView.vue')
        },
        {
            path: '/login',
            name: 'login',
            meta: { title: 'Login' },
            component: () => import('../views/LoginView.vue')
        }
    ]
})

export default router
