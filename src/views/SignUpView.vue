<template>
  <div class="mobile-container flex flex-col min-h-screen justify-center items-center">
    <h1 class="font-serif text-2xl font-semibold text-ink mb-6">Sign Up</h1>
    <form @submit.prevent="onSubmit" class="w-full space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-ink mb-1">Email</label>
        <input v-model="email" id="email" type="email" class="input" required autocomplete="email" />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium text-ink mb-1">Password</label>
        <input v-model="password" id="password" type="password" class="input" required autocomplete="new-password" />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading">Signing up...</span>
        <span v-else>Sign Up</span>
      </button>
    </form>
    <p class="mt-4 text-sm text-center text-ink-muted">
      Already have an account?
      <router-link to="/login" class="font-medium text-editorial-accent hover:opacity-90">Sign In</router-link>
    </p>
    <p v-if="error" class="text-red-600 mt-2 text-sm">{{ error }}</p>
    <p v-if="success" class="text-green-600 mt-2 text-sm">{{ success }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const onSubmit = async () => {
  error.value = ''
  success.value = ''
  loading.value = true
  const { error: signUpError } = await authStore.signUp(email.value, password.value)
  loading.value = false
  if (signUpError) {
    error.value = signUpError.message || 'Failed to sign up.'
  } else {
    success.value = 'Check your email for a confirmation link.'
    setTimeout(() => router.push('/login'), 2000)
  }
}
</script> 