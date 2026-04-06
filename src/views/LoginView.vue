<template>
  <div class="mobile-container flex flex-col min-h-screen justify-center items-center">
    <h1 class="font-serif text-2xl font-semibold text-ink mb-6">Sign In</h1>
    <form @submit.prevent="onSubmit" class="w-full space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-ink mb-1">Email</label>
        <input v-model="email" id="email" type="email" class="input" required autocomplete="email" />
      </div>
      <div>
        <div class="flex items-center justify-between gap-2 mb-1">
          <label for="password" class="block text-sm font-medium text-ink">Password</label>
          <router-link
            to="/forgot-password"
            class="text-sm font-medium text-editorial-accent hover:opacity-90"
          >
            Forgot password?
          </router-link>
        </div>
        <input v-model="password" id="password" type="password" class="input" required autocomplete="current-password" />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading">Signing in...</span>
        <span v-else>Sign In</span>
      </button>
    </form>
    <p class="mt-4 text-sm text-center text-ink-muted">
      Don't have an account?
      <router-link to="/signup" class="font-medium text-editorial-accent hover:opacity-90">Sign Up</router-link>
    </p>
    <p v-if="error" class="text-red-600 mt-2 text-sm">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const onSubmit = async () => {
  error.value = ''
  loading.value = true
  const { error: signInError } = await authStore.signIn(email.value, password.value)
  loading.value = false
  if (signInError) {
    error.value = signInError.message || 'Failed to sign in.'
  } else {
    router.push('/')
  }
}
</script> 