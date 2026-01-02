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
import MainLayout from '@/layouts/MainLayout.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Layout',
    component: MainLayout,
    redirect: '/dashboard',  // 改为跳转到 dashboard
    children: [
      {
        path: 'dashboard',  // 添加 dashboard 路由
        name: 'Dashboard',
        component: Dashboard,
        meta: { title: '数据看板' }
      },
      {
        path: 'finance-overview',
        name: 'FinanceOverview',
        component: FinanceOverview,
        meta: { title: '财务总览' }
      },
      {
        path: 'class-management',
        name: 'ClassManagement',
        component: ClassManagement,
        meta: { title: '班级管理' }
      },
      {
        path: 'teacher-performance',
        name: 'TeacherPerformance',
        component: TeacherPerformance,
        meta: { title: '班主任绩效' }
      },
      {
        path: 'payment-details',
        name: 'PaymentDetails',
        component: PaymentDetails,
        meta: { title: '缴费明细' }
      },
      {
        path: 'refund-details',
        name: 'RefundDetails',
        component: RefundDetails,
        meta: { title: '退费明细' }
      },
      {
        path: 'pivot-table',
        name: 'PivotTable',
        component: PivotTable,
        meta: { title: '透视表' }
      }
    ]
  },
  // 404 重定向
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')

  if (to.path !== '/login' && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router