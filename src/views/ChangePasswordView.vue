<template>
  <div class="mobile-container flex flex-col min-h-[50vh] justify-center items-center py-8">
    <h1 class="font-serif text-2xl font-semibold text-ink mb-6">Change password</h1>
    <form @submit.prevent="onSubmit" class="w-full space-y-4">
      <div>
        <label for="current-password" class="block text-sm font-medium text-ink mb-1"
          >Current password</label
        >
        <input
          v-model="currentPassword"
          id="current-password"
          type="password"
          class="input"
          required
          autocomplete="current-password"
        />
      </div>
      <div>
        <label for="new-password" class="block text-sm font-medium text-ink mb-1"
          >New password</label
        >
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
        <label for="confirm-password" class="block text-sm font-medium text-ink mb-1"
          >Confirm new password</label
        >
        <input
          v-model="confirmPassword"
          id="confirm-password"
          type="password"
          class="input"
          required
          autocomplete="new-password"
        />
      </div>
      <button type="submit" class="btn-primary w-full" :disabled="loading">
        <span v-if="loading">Updating…</span>
        <span v-else>Update password</span>
      </button>
    </form>
    <p class="mt-4 text-sm text-center">
      <router-link to="/" class="font-medium text-editorial-accent hover:opacity-90"
        >Back to series</router-link
      >
    </p>
    <p v-if="error" class="text-red-600 mt-2 text-sm">{{ error }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const onSubmit = async () => {
  error.value = ''
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'New passwords do not match.'
    return
  }
  loading.value = true
  const { error: changeError } = await authStore.changePassword(
    currentPassword.value,
    newPassword.value
  )
  loading.value = false
  if (changeError) {
    error.value = changeError.message || 'Could not update password.'
    return
  }
  router.push('/')
}
</script>
