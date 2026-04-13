<template>
  <div class="mobile-container py-6 lg:max-w-6xl">
    <BookForm :series-id="seriesId" @save="handleSave" @cancel="handleCancel" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import BookForm from '@/components/books/BookForm.vue'
import type { BookFormData } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authStore = useAuthStore()

const seriesId = ref<string | null>(null)

onMounted(async () => {
  if (route.params.seriesId) {
    seriesId.value = route.params.seriesId as string
  }
})

const handleSave = async (bookData: BookFormData & { user_id: string }) => {
  if (!authStore.user) return

  const result = await booksStore.addBook(bookData)
  if (result.error) {
    console.error('Add error:', result.error)
    alert('Error adding book. Please try again.')
    return
  }

  router.push('/')
}

const handleCancel = () => {
  router.push('/')
}
</script>