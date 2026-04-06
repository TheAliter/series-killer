import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: () => import('../views/SignUpView.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/app',
    name: 'App',
    component: () => import('../views/AppView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/app/series'
      },
      {
        path: 'series',
        name: 'Series',
        component: () => import('../views/SeriesView.vue')
      },
      {
        path: 'series/add',
        name: 'SeriesAdd',
        component: () => import('../views/SeriesFormView.vue')
      },
      {
        path: 'series/edit/:id',
        name: 'SeriesEdit',
        component: () => import('../views/SeriesFormView.vue')
      },
      {
        path: 'series/:seriesId/add-book',
        name: 'BookAddToSeries',
        component: () => import('../views/BookAddToSeriesView.vue')
      },
      {
        path: 'book/add',
        name: 'BookAdd',
        component: () => import('../views/BookFormView.vue')
      },
      {
        path: 'book/edit/:bookId',
        name: 'BookEdit',
        component: () => import('../views/BookFormView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }
    
    // If navigating to series view from a book form, preserve scroll position
    if (to.name === 'Series' && (from.name === 'BookAdd' || from.name === 'BookEdit' || from.name === 'BookAddToSeries')) {
      // Return false to prevent automatic scrolling
      return false
    }
    
    // Default behavior: scroll to top
    return { top: 0 }
  }
})

// Navigation guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for auth to be initialized if it's still loading
  if (authStore.loading) {
    await authStore.initializeAuth()
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' })
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'App' })
  } else {
    next()
  }
})

export default router 