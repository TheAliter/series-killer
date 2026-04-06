<template>
  <div class="fixed inset-0 flex h-screen w-screen flex-col bg-card-cream">
    <div class="border-b border-paper-dark bg-card-cream p-4">
      <h3 class="font-serif text-lg font-semibold text-ink">
        {{ isEditing ? 'Edit Series' : 'Add Series' }}
      </h3>
    </div>
    <form @submit.prevent="onSubmit" class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 p-4 space-y-4">
        <!-- Book Search Section -->
        <div>
          <label class="block text-sm font-medium mb-1">Search for a book to create series from</label>
          <SeriesSearch 
            v-model="searchQuery"
            @select="handleBookSelect"
          />
          <p class="mt-1 text-xs text-ink-muted">Search for a book to automatically fill series name, author, and cover image.</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Series Name *</label>
          <input v-model="form.name" type="text" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Author</label>
          <input v-model="authorName" type="text" class="input" placeholder="Author name..." />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Cover Image URL</label>
          <input v-model="form.cover_url" type="url" class="input" placeholder="https://..." />
          <div v-if="form.cover_url" class="mt-2 flex justify-center">
            <img :src="form.cover_url" alt="Series Cover Preview" class="max-h-40 rounded shadow" @error="onImageError" v-show="!coverError" />
            <span v-if="coverError" class="text-xs text-red-500">Invalid image URL</span>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Total Books</label>
          <input v-model.number="form.total_books" type="number" min="0" class="input" />
          <p class="mt-1 text-xs text-ink-muted">Leave empty if unknown. If specified, dummy books will be created automatically.</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description</label>
          <textarea 
            v-model="form.description" 
            rows="3" 
            class="input" 
            placeholder="Brief description of the series..."
          ></textarea>
        </div>
      </div>
      <div class="sticky bottom-0 left-0 flex w-full space-x-3 border-t border-paper-dark bg-card-cream p-4">
        <button type="button" @click="$emit('cancel')" class="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" :disabled="loading" class="btn-primary flex-1">
          <span v-if="loading">Saving...</span>
          <span v-else>{{ isEditing ? 'Update' : 'Add' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import { findOrCreateAuthor } from '@/utils/bookSearch'
import SeriesSearch from './SeriesSearch.vue'
import type { Series, OpenLibraryBook } from '@/types'

interface SeriesFormData {
  name: string
  description?: string
  total_books: number
  cover_url?: string
  author_id?: string | null
}

interface Props {
  series?: Series | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [seriesData: SeriesFormData]
  cancel: []
}>()

const booksStore = useBooksStore()
const authStore = useAuthStore()

const loading = ref(false)
const isEditing = computed(() => !!props.series)
const coverError = ref(false)
const authorName = ref('')
const searchQuery = ref('')

const form = ref<SeriesFormData>({
  name: '',
  description: '',
  total_books: 0,
  cover_url: '',
  author_id: null
})

onMounted(async () => {
  if (authStore.user) {
    // Fetch authors for potential matching
    await booksStore.fetchAuthors(authStore.user.id)
  }
})

// Initialize form with series data if editing
watch(() => props.series, (series) => {
  if (series) {
    form.value = {
      name: series.name,
      description: series.description || '',
      total_books: series.total_books || 0,
      cover_url: series.cover_url || '',
      author_id: series.author_id || null
    }
    
    // Set author name if available
    if (series.authors?.name) {
      authorName.value = series.authors.name
    }
  }
}, { immediate: true })

const handleBookSelect = (book: OpenLibraryBook) => {
  // Set series name to book title
  form.value.name = book.title
  
  // Set author name if available
  if (book.author_name && book.author_name.length > 0) {
    authorName.value = book.author_name.join(', ')
  }
  
  // Set cover image URL if available
  if (book.cover_i) {
    form.value.cover_url = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
  }
}

const onImageError = () => {
  coverError.value = true
}

watch(() => form.value.cover_url, () => {
  coverError.value = false
})

const onSubmit = async () => {
  loading.value = true
  try {
    // Handle author creation if needed
    let authorId: string | null = null
    if (authorName.value.trim()) {
      const { author, isNew } = findOrCreateAuthor(authorName.value.trim(), booksStore.authors)
      if (isNew) {
        // Create new author
        const { data: newAuthor } = await booksStore.addAuthor({
          name: authorName.value.trim(),
          user_id: authStore.user!.id
        })
        authorId = newAuthor?.id || null
      } else {
        authorId = author?.id || null
      }
    }
    
    emit('save', { 
      ...form.value,
      author_id: authorId
    })
  } finally {
    loading.value = false
  }
}
</script> 