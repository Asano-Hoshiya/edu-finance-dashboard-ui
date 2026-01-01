// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import FinanceOverview from '@/views/FinanceOverview.vue'
import ClassManagement from '@/views/ClassManagement.vue'
import TeacherPerformance from '@/views/TeacherPerformance.vue'
import PaymentDetails from '@/views/PaymentDetails.vue'
import RefundDetails from '@/views/RefundDetails.vue'
import PivotTable from '@/views/PivotTable.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Layout',
    component: Dashboard,
    redirect: '/finance-overview',
    children: [
      {
        path: 'finance-overview',
        name: 'FinanceOverview',
        component: FinanceOverview
      },
      {
        path: 'class-management',
        name: 'ClassManagement',
        component: ClassManagement
      },
      {
        path: 'teacher-performance',
        name: 'TeacherPerformance',
        component: TeacherPerformance
      },
      {
        path: 'payment-details',
        name: 'PaymentDetails',
        component: PaymentDetails
      },
      {
        path: 'refund-details',
        name: 'RefundDetails',
        component: RefundDetails
      },
      {
        path: 'pivot-table',
        name: 'PivotTable',
        component: PivotTable
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router