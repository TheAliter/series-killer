<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <input
        v-model="searchQuery"
        @input="handleSearch"
        @focus="showResults = true"
        @blur="handleBlur"
        type="text"
        placeholder="Search for books..."
        class="input w-full pr-10"
        :class="{ 'border-blue-500': showResults && searchResults.length > 0 }"
      />
      <Search class="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4">
      <div class="flex items-center justify-center space-x-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        <span class="text-sm text-gray-600">Searching...</span>
      </div>
    </div>

    <!-- Search Results Dropdown -->
    <div
      v-if="showResults && searchResults.length > 0 && !loading"
      class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto"
    >
      <div class="p-2">
        <div class="text-xs text-gray-500 mb-2">
          Found {{ searchResults.length }} results
        </div>
        <div
          v-for="book in searchResults"
          :key="book.key"
          @click="selectBook(book)"
          class="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
        >
          <!-- Book Cover -->
          <div class="flex-shrink-0">
            <img
              v-if="book.cover_i"
              :src="`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`"
              :alt="book.title"
              class="w-12 h-16 object-cover rounded shadow-sm"
              @error="handleImageError"
            />
            <div v-else class="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
              <BookIcon class="w-6 h-6 text-gray-400" />
            </div>
          </div>

          <!-- Book Info -->
          <div class="flex-1 min-w-0">
            <h4 class="font-medium text-sm text-gray-900 truncate">{{ book.title }}</h4>
            <p v-if="book.author_name && book.author_name.length > 0" class="text-xs text-gray-600 truncate">
              by {{ book.author_name.join(', ') }}
            </p>
            <div class="flex items-center space-x-2 mt-1">
              <span v-if="book.first_publish_year" class="text-xs text-gray-500">
                {{ book.first_publish_year }}
              </span>
              <span v-if="book.series && book.series.length > 0" class="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                Series
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- No Results -->
    <div
      v-if="showResults && searchResults.length === 0 && searchQuery && !loading"
      class="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4"
    >
      <div class="text-center text-sm text-gray-500">
        No books found for "{{ searchQuery }}"
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Search, Book as BookIcon } from 'lucide-vue-next'
import type { OpenLibraryBook, OpenLibrarySearchResponse } from '@/types'

interface Props {
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', book: OpenLibraryBook): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchQuery = ref(props.modelValue || '')
const searchResults = ref<OpenLibraryBook[]>([])
const loading = ref(false)
const showResults = ref(false)
const searchTimeout = ref<NodeJS.Timeout | null>(null)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== searchQuery.value) {
    searchQuery.value = newValue || ''
  }
})

// Watch for changes to searchQuery and emit updates
watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleSearch = () => {
  // Clear previous timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // Don't search if query is too short
  if (searchQuery.value.length < 2) {
    searchResults.value = []
    return
  }

  // Debounce search
  searchTimeout.value = setTimeout(async () => {
    await performSearch()
  }, 300)
}

const performSearch = async () => {
  if (!searchQuery.value || searchQuery.value.length < 2) return

  loading.value = true
  try {
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(searchQuery.value)}&limit=10&fields=key,title,author_name,cover_i,first_publish_year,series,series_key,series_number`
    )
    
    if (!response.ok) {
      throw new Error('Search failed')
    }

    const data: OpenLibrarySearchResponse = await response.json()
    searchResults.value = data.docs || []
  } catch (error) {
    console.error('Book search error:', error)
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const selectBook = (book: OpenLibraryBook) => {
  searchQuery.value = book.title
  showResults.value = false
  emit('select', book)
}

const handleBlur = () => {
  // Delay hiding results to allow for clicks
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}
</script> 