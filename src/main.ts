import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'
import { useAuthStore } from './stores/auth'
import { auth } from './services/supabase'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()
auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    authStore.setUser(session?.user || null)
  } else if (event === 'SIGNED_OUT') {
    authStore.setUser(null)
    authStore.exitPasswordRecoveryFlow()
  } else if (event === 'USER_UPDATED') {
    authStore.setUser(session?.user || null)
  } else if (event === 'PASSWORD_RECOVERY') {
    authStore.setUser(session?.user || null)
    authStore.enterPasswordRecoveryFlow()
  }
})

app.use(router)

app.mount('#app') 