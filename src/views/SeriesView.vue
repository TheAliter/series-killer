<template>
  <div class="py-6">
    <header class="mb-6 flex items-start justify-between gap-3 lg:hidden">
      <div class="min-w-0">
        <h2 class="font-serif text-[1.75rem] font-semibold text-ink leading-tight m-0 mb-1">
          Series Killer
        </h2>
        <p class="text-sm text-ink-muted m-0">Your library</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <router-link
          to="/series/add"
          class="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus class="w-4 h-4 shrink-0" />
          <span>Add Series</span>
        </router-link>
        <AccountMenu variant="toolbar" />
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="booksStore.loading" class="flex justify-center py-16">
      <Loader2 class="w-8 h-8 animate-spin text-editorial-accent" />
    </div>

    <!-- Series Grid -->
    <div
      v-else-if="booksStore.series.length > 0"
      class="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0"
    >
      <SeriesCard
        v-for="series in booksStore.series"
        :key="series.id"
        :series="series"
        :show-actions="true"
        :is-expanded="expandedSeriesId === series.id"
        @edit="editSeries"
        @delete="handleDeleteSeries"
        @add-book="addBookToSeries"
        @toggle-expand="toggleSeriesExpansion(series.id)"
        @edit-book="handleEditBook"
        @delete-book="handleDeleteBook"
        @update-book-status="handleUpdateBookStatus"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="card text-center py-16">
      <Layers class="w-12 h-12 mx-auto mb-3 text-ink-muted/50" />
      <h3 class="text-lg font-serif font-semibold text-ink">No series yet</h3>
      <p class="text-sm mt-1 text-ink-muted">Add your first series to get started!</p>
      <router-link to="/series/add" class="btn-primary inline-flex mt-4">
        + Add Series
      </router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import SeriesCard from '@/components/series/SeriesCard.vue'
import AccountMenu from '@/components/AccountMenu.vue'
import { Loader2, Layers, Plus } from 'lucide-vue-next'
import type { Series, ReadonlySeries, Book } from '@/types'

const booksStore = useBooksStore()
const authStore = useAuthStore()
const router = useRouter()
const expandedSeriesId = ref<string | null>(null)

// Local storage key for persisting expanded series state
const EXPANDED_SERIES_KEY = 'series-killer-expanded-series'
// Local storage key for persisting scroll position
const SCROLL_POSITION_KEY = 'series-killer-scroll-position'

onMounted(async () => {
  if (authStore.user) {
    // We fetch books here as well because series might need book data for completion status
    await Promise.all([
      booksStore.fetchBooks(authStore.user.id),
      booksStore.fetchSeries(authStore.user.id)
    ])

    // Restore expanded series state from localStorage
    const savedExpandedSeries = localStorage.getItem(EXPANDED_SERIES_KEY)
    if (savedExpandedSeries) {
      // Verify the series still exists before restoring the state
      const seriesExists = booksStore.series.some(series => series.id === savedExpandedSeries)
      if (seriesExists) {
        expandedSeriesId.value = savedExpandedSeries
      } else {
        // Clean up invalid saved state
        localStorage.removeItem(EXPANDED_SERIES_KEY)
      }
    }

    // Restore scroll position after the DOM is updated
    await nextTick()

    // Add a delay to ensure all content is rendered, especially expanded series
    setTimeout(() => {
      const savedScrollPosition = localStorage.getItem(SCROLL_POSITION_KEY)
      if (savedScrollPosition) {
        const scrollY = parseInt(savedScrollPosition, 10)
        if (!isNaN(scrollY)) {
          // Wait a bit more for any animations or dynamic content to settle
          setTimeout(() => {
            // Check if the saved position is within the current document height
            const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
            const targetScrollY = Math.min(scrollY, maxScrollY)

            window.scrollTo(0, targetScrollY)
            // Clear the saved position after restoring it
            localStorage.removeItem(SCROLL_POSITION_KEY)
          }, 50)
        }
      }
    }, 150) // Increased delay to ensure expanded content is rendered
  }
})

const toggleSeriesExpansion = (seriesId: string) => {
  if (expandedSeriesId.value === seriesId) {
    expandedSeriesId.value = null
    localStorage.removeItem(EXPANDED_SERIES_KEY)
  } else {
    expandedSeriesId.value = seriesId
    localStorage.setItem(EXPANDED_SERIES_KEY, seriesId)
  }
}

const handleEditBook = (book: Book) => {
  // Save the series ID of the book being edited so we can restore expansion state
  if (book.series_id) {
    localStorage.setItem(EXPANDED_SERIES_KEY, book.series_id)
  }

  // Save current scroll position before navigating
  localStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString())

  router.push(`/book/edit/${book.id}`)
}

const handleDeleteBook = async (book: Book) => {
  if (window.confirm(`Are you sure you want to delete the book "${book.title}"?`)) {
    await booksStore.deleteBook(book.id)

    // If the deleted book was from the currently expanded series and that series is now empty,
    // collapse the series
    if (book.series_id && expandedSeriesId.value === book.series_id) {
      const series = booksStore.series.find(s => s.id === book.series_id)
      if (series && (!series.books || series.books.length === 0)) {
        expandedSeriesId.value = null
        localStorage.removeItem(EXPANDED_SERIES_KEY)
      }
    }
  }
}

const handleUpdateBookStatus = async (bookId: string, status: 'reading' | 'completed' | 'want_to_read' | 'dropped') => {
  await booksStore.updateBook(bookId, { status })
}

const editSeries = (series: Series | ReadonlySeries) => {
  router.push(`/series/edit/${series.id}`)
}

const addBookToSeries = (series: Series | ReadonlySeries) => {
  // Save current scroll position before navigating
  localStorage.setItem(SCROLL_POSITION_KEY, window.scrollY.toString())

  router.push(`/series/${series.id}/add-book`)
}

const handleDeleteSeries = async (series: Series | ReadonlySeries) => {
  if (window.confirm(`Are you sure you want to delete the series "${series.name}"? This action cannot be undone.`)) {
    await booksStore.deleteSeries(series.id)

    // If the deleted series was expanded, clean up the expansion state
    if (expandedSeriesId.value === series.id) {
      expandedSeriesId.value = null
      localStorage.removeItem(EXPANDED_SERIES_KEY)
    }
  }
}
</script>
