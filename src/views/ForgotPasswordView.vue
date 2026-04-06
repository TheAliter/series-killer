<template>
  <div class="mobile-container flex flex-col min-h-screen justify-center items-center">
    <h1 class="font-serif text-2xl font-semibold text-ink mb-6">Forgot password</h1>
    <p v-if="success" class="mb-4 w-full text-sm text-ink-muted text-center">
      If an account exists for that email, you will receive a link to reset your password.
    </p>
    <form v-else @submit.prevent="onSubmit" class="w-full space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-ink mb-1">Email</label>
        <input v-model="email" id="email" type="email" class="input" required autocomplete="email" />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading">Sending…</span>
        <span v-else>Send reset link</span>
      </button>
    </form>
    <p class="mt-4 text-sm text-center text-ink-muted">
      <router-link to="/login" class="font-medium text-editorial-accent hover:opacity-90">Back to sign in</router-link>
    </p>
    <p v-if="error" class="text-red-600 mt-2 text-sm">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)
const authStore = useAuthStore()

const onSubmit = async () => {
  error.value = ''
  loading.value = true
  const { error: resetError } = await authStore.requestPasswordReset(email.value.trim())
  loading.value = false
  if (resetError) {
    error.value = resetError.message || 'Could not send reset email.'
    return
  }
  success.value = true
}
</script>
