import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
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
    path: '/',
    component: () => import('../views/AppView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
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
      },
      {
        path: 'account/password',
        name: 'ChangePassword',
        component: () => import('../views/ChangePasswordView.vue')
      }
    ]
  },
  {
    path: '/app/:pathMatch(.*)*',
    redirect: (to) => {
      const raw = to.params.pathMatch
      const segment =
        raw === undefined || raw === ''
          ? ''
          : Array.isArray(raw)
            ? raw.filter(Boolean).join('/')
            : String(raw)
      if (!segment || segment === 'series') {
        return { path: '/' }
      }
      return { path: `/${segment}` }
    }
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
    if (
      to.name === 'Series' &&
      (from.name === 'BookAdd' || from.name === 'BookEdit' || from.name === 'BookAddToSeries')
    ) {
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
    next({ path: '/' })
  } else {
    next()
  }
})

export default router
