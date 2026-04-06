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
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
</script>

<style>
#app {
  min-height: 100vh;
}
</style>
