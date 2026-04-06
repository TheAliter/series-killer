<template>
  <div id="app">
    <div v-if="authStore.loading" class="flex min-h-screen items-center justify-center">
      <div class="flex flex-col items-center gap-3 text-ink">
        <div
          class="h-8 w-8 animate-spin rounded-full border-2 border-paper-dark border-t-editorial-accent"
        />
        <span class="text-sm font-medium text-ink-muted">Loading…</span>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { auth } from './services/supabase'

const authStore = useAuthStore()

onMounted(async () => {
  // Initialize auth state first
  await authStore.initializeAuth()
  
  // Listen for auth state changes
  const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      authStore.setUser(session?.user || null)
    } else if (event === 'SIGNED_OUT') {
      authStore.setUser(null)
    } else if (event === 'USER_UPDATED') {
      authStore.setUser(session?.user || null)
    }
  })

  // Cleanup subscription on component unmount
  return () => {
    subscription?.unsubscribe()
  }
})
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
