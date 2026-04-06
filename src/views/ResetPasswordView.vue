<template>
  <div class="mobile-container flex flex-col min-h-screen justify-center items-center">
    <h1 class="font-serif text-2xl font-semibold text-ink mb-6">Set new password</h1>

    <div v-if="!canReset" class="w-full space-y-4 text-center">
      <p class="text-sm text-ink-muted">
        This page is only valid after you open the link from your password reset email.
      </p>
      <router-link to="/forgot-password" class="font-medium text-editorial-accent hover:opacity-90 text-sm">
        Request a new reset link
      </router-link>
      <p class="pt-2">
        <router-link to="/login" class="font-medium text-editorial-accent hover:opacity-90 text-sm">
          Back to sign in
        </router-link>
      </p>
    </div>

    <form v-else @submit.prevent="onSubmit" class="w-full space-y-4">
      <div>
        <label for="new-password" class="block text-sm font-medium text-ink mb-1">New password</label>
        <input
          v-model="newPassword"
          id="new-password"
          type="password"
          class="input"
          required
          minlength="6"
          autocomplete="new-password"
        />
      </div>
      <div>
        <label for="confirm-password" class="block text-sm font-medium text-ink mb-1">Confirm new password</label>
        <input
          v-model="confirmPassword"
          id="confirm-password"
          type="password"
          class="input"
          required
          minlength="6"
          autocomplete="new-password"
        />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading">Updating…</span>
        <span v-else>Update password</span>
      </button>
    </form>
    <p v-if="error" class="text-red-600 mt-2 text-sm w-full">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '../stores/auth'

const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const { isPasswordRecoveryFlow, isAuthenticated } = storeToRefs(authStore)

const canReset = computed(() => isPasswordRecoveryFlow.value && isAuthenticated.value)

const onSubmit = async () => {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  const { error: updateError } = await authStore.completePasswordRecovery(newPassword.value)
  loading.value = false
  if (updateError) {
    error.value = updateError.message || 'Could not update password.'
    return
  }
  router.push('/')
}
</script>
