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

    <div
      v-if="!booksStore.loading && booksStore.series.length > 0"
      class="mb-4 flex flex-wrap items-center justify-end gap-4"
    >
      <label class="flex items-center gap-2 text-sm text-ink-muted">
        <span>Sort by</span>
        <select v-model="selectedSeriesSort" class="input w-auto min-w-[16rem]">
          <option value="last_updated">Last updated</option>
          <option value="alphabetical">Alphabetical (A-Z)</option>
          <option value="reverse_alphabetical">Reverse alphabetical (Z-A)</option>
          <option value="created_at">Created at</option>
          <option value="most_books_read">Most books read</option>
          <option value="least_books_read">Least books read</option>
          <option value="reading_progress">Reading progress (%)</option>
        </select>
      </label>
      <label class="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-ink-muted">
        <input
          v-model="hideCompletedSeries"
          type="checkbox"
          class="form-checkbox h-4 w-4 shrink-0 cursor-pointer rounded border-paper-dark text-editorial-accent focus:ring-editorial-accent"
        />
        <span>Hide completed</span>
      </label>
    </div>

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
        v-for="series in sortedSeries"
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
import { onMounted, ref, nextTick, computed, watch } from 'vue'
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
type SeriesSortOption =
  | 'last_updated'
  | 'alphabetical'
  | 'reverse_alphabetical'
  | 'created_at'
  | 'most_books_read'
  | 'least_books_read'
  | 'reading_progress'

const SERIES_SORT_KEY = 'series-killer-series-sort'
const HIDE_COMPLETED_SERIES_KEY = 'series-killer-hide-completed-series'
const SORT_OPTIONS: SeriesSortOption[] = [
  'last_updated',
  'alphabetical',
  'reverse_alphabetical',
  'created_at',
  'most_books_read',
  'least_books_read',
  'reading_progress'
]
const selectedSeriesSort = ref<SeriesSortOption>('alphabetical')
const hideCompletedSeries = ref(false)
const alphabeticalCollator = new Intl.Collator(undefined, {
  sensitivity: 'base',
  numeric: true
})

// Local storage key for persisting expanded series state
const EXPANDED_SERIES_KEY = 'series-killer-expanded-series'
// Local storage key for persisting scroll position
const SCROLL_POSITION_KEY = 'series-killer-scroll-position'

const getCompletedBooksCount = (series: Series | ReadonlySeries): number => {
  if (!series.books?.length) return 0
  return series.books.filter(book => book.status === 'completed').length
}

const getReadingProgress = (series: Series | ReadonlySeries): number => {
  if (!series.total_books || series.total_books <= 0) return 0
  return getCompletedBooksCount(series) / series.total_books
}

const isCompletedSeries = (series: Series | ReadonlySeries): boolean => {
  if (!series.books?.length) return false
  return series.books.every(book => book.status === 'completed')
}

const getSeriesNameSortKey = (seriesName: string): string => {
  return seriesName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

const compareSeriesNamesAlphabetically = (
  firstSeriesName: string,
  secondSeriesName: string
): number => {
  const firstSeriesSortKey = getSeriesNameSortKey(firstSeriesName)
  const secondSeriesSortKey = getSeriesNameSortKey(secondSeriesName)
  const sortResult = alphabeticalCollator.compare(firstSeriesSortKey, secondSeriesSortKey)

  if (sortResult !== 0) {
    return sortResult
  }

  return alphabeticalCollator.compare(firstSeriesName.trim(), secondSeriesName.trim())
}

const getLastActivityTimestamp = (series: Series | ReadonlySeries): number => {
  const timestamps = [new Date(series.updated_at).getTime()]

  if (series.books?.length) {
    for (const book of series.books) {
      timestamps.push(new Date(book.updated_at).getTime())
    }
  }

  return Math.max(...timestamps)
}

const sortedSeries = computed(() => {
  const visibleSeries = hideCompletedSeries.value
    ? booksStore.series.filter(series => !isCompletedSeries(series))
    : booksStore.series
  const seriesList = [...visibleSeries]

  return seriesList.sort((firstSeries, secondSeries) => {
    switch (selectedSeriesSort.value) {
      case 'last_updated':
        return getLastActivityTimestamp(secondSeries) - getLastActivityTimestamp(firstSeries)
      case 'alphabetical':
        return compareSeriesNamesAlphabetically(firstSeries.name, secondSeries.name)
      case 'reverse_alphabetical':
        return compareSeriesNamesAlphabetically(secondSeries.name, firstSeries.name)
      case 'created_at':
        return new Date(secondSeries.created_at).getTime() - new Date(firstSeries.created_at).getTime()
      case 'most_books_read':
        return getCompletedBooksCount(secondSeries) - getCompletedBooksCount(firstSeries)
      case 'least_books_read':
        return getCompletedBooksCount(firstSeries) - getCompletedBooksCount(secondSeries)
      case 'reading_progress':
        return getReadingProgress(secondSeries) - getReadingProgress(firstSeries)
      default:
        return compareSeriesNamesAlphabetically(firstSeries.name, secondSeries.name)
    }
  })
})

watch(selectedSeriesSort, (sortOption) => {
  localStorage.setItem(SERIES_SORT_KEY, sortOption)
})

watch(hideCompletedSeries, (shouldHideCompletedSeries) => {
  localStorage.setItem(HIDE_COMPLETED_SERIES_KEY, String(shouldHideCompletedSeries))
})

onMounted(async () => {
  const savedSortOption = localStorage.getItem(SERIES_SORT_KEY)
  if (savedSortOption && SORT_OPTIONS.includes(savedSortOption as SeriesSortOption)) {
    selectedSeriesSort.value = savedSortOption as SeriesSortOption
  }
  hideCompletedSeries.value = localStorage.getItem(HIDE_COMPLETED_SERIES_KEY) === 'true'

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
