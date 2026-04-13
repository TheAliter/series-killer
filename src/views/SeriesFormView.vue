<template>
  <div class="mobile-container py-6 lg:max-w-6xl">
    <SeriesForm :series="series" @save="handleSave" @cancel="handleCancel" />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import SeriesForm from '@/components/series/SeriesForm.vue'
import type { Series } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authStore = useAuthStore()

const series = ref<Series | null>(null)

onMounted(async () => {
  if (authStore.user) {
    await booksStore.fetchSeries(authStore.user.id)
    if (route.params.id) {
      const found = booksStore.series.find(s => s.id === route.params.id)
      series.value = found ? { ...found, books: found.books ? [...found.books] : [] } : null
    }
  }
})

const handleSave = async (seriesData: { name: string; description?: string; total_books?: number }) => {
  if (!authStore.user) return
  if (series.value) {
    await booksStore.updateSeries(series.value.id, { ...seriesData })
  } else {
    await booksStore.addSeries({ ...seriesData, user_id: authStore.user.id })
  }
  router.push('/')
}

const handleCancel = () => {
  router.push('/')
}
</script> 