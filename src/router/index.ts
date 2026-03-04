import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import CreateAgent from '../views/CreateAgent.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/create',
    name: 'CreateAgent',
    component: CreateAgent
  },
  {
    path:'/demo',
    name:'Demo',
    component: () => import('../views/demo.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router