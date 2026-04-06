<template>
  <div class="fixed inset-0 flex h-screen w-screen flex-col bg-card-cream">
    <!-- Loading Overlay -->
    <div
      v-if="!props.book && isEditing"
      class="absolute inset-0 z-50 flex items-center justify-center bg-card-cream/90"
    >
      <div class="text-center">
        <div
          class="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-paper-dark border-t-editorial-accent"
        />
        <p class="text-ink-muted">Loading book data...</p>
      </div>
    </div>

    <div class="border-b border-paper-dark bg-card-cream p-4">
      <h2 class="font-serif text-lg font-semibold text-ink">
        {{ isEditing ? 'Edit Book' : 'Add Book' }}
      </h2>
    </div>
    <form @submit.prevent="onSubmit" class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 p-4 space-y-4">
        <!-- Book Search Section -->
        <div>
          <label class="block text-sm font-medium mb-1">
            Search for Book {{ isEditing ? '(Update Book Info)' : '' }}
          </label>
          <BookSearch 
            v-model="searchQuery" 
            @select="handleBookSelect" 
          />
          <p class="mt-1 text-xs text-ink-muted">
            {{ isEditing ? 'Search for a book to update the information below (your notes and rating will be preserved)' : 'Search for a book to auto-fill the form below' }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Title *</label>
          <input v-model="form.title" type="text" class="input" required />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Cover URL</label>
          <input v-model="form.cover_url" type="url" class="input" placeholder="https://..." />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Status *</label>
          <select v-model="form.status" class="input" required>
            <option value="want_to_read">Want to Read</option>
            <option value="reading">Currently Reading</option>
            <option value="completed">Completed</option>
            <option value="dropped">Dropped</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Series Order</label>
          <input v-model.number="form.series_order" type="number" min="1" class="input" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Release Date</label>
          <input 
            v-model="form.release_date" 
            type="date" 
            class="input" 
            pattern="\d{4}-\d{2}-\d{2}"
            placeholder="YYYY/MM/DD"
          />
          <p class="mt-1 text-xs text-ink-muted">Leave empty if already released</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Notes</label>
          <textarea v-model="form.notes" rows="2" class="input" placeholder="Your thoughts..."></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Rating</label>
          <select v-model.number="form.rating" class="input">
            <option :value="null">No Rating</option>
            <option v-for="i in 5" :key="i" :value="i">{{ i }}/5</option>
          </select>
        </div>
      </div>
      <div class="sticky bottom-0 left-0 flex w-full space-x-3 border-t border-paper-dark bg-card-cream p-4">
        <button type="button" @click="$emit('cancel')" class="btn-secondary flex-1">Cancel</button>
        <button 
          type="submit" 
          :disabled="loading || (isEditing && !props.book)" 
          class="btn-primary flex-1"
        >
          <span v-if="loading">Saving...</span>
          <span v-else>{{ isEditing ? 'Update Book' : 'Add Book' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import BookSearch from '@/components/books/BookSearch.vue'
import { processOpenLibraryBook } from '@/utils/bookSearch'
import type { OpenLibraryBook, Book, BookFormData } from '@/types'

interface Props {
  book?: Book | null
  seriesId?: string | null
}

interface Emits {
  (e: 'save', bookData: BookFormData & { user_id: string }): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const booksStore = useBooksStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!props.book)
const loading = ref(false)
const searchQuery = ref('')

const form = ref<BookFormData>({
  title: '',
  series_id: props.seriesId || null,
  series_order: null,
  status: 'want_to_read',
  rating: null,
  notes: '',
  cover_url: '',
  read_date: null,
  release_date: null
})

// Watch for seriesId changes
watch(() => props.seriesId, (newSeriesId) => {
  form.value.series_id = newSeriesId || null
})

// Watch for book prop changes to reinitialize form when book data becomes available
watch(() => props.book, (newBook) => {
  if (newBook && isEditing.value) {
    // Initialize form with existing book data
    form.value = {
      title: newBook.title,
      series_id: newBook.series_id || props.seriesId || null,
      series_order: newBook.series_order,
      status: newBook.status,
      rating: newBook.rating,
      notes: newBook.notes || '',
      cover_url: newBook.cover_url || '',
      read_date: newBook.read_date,
      release_date: newBook.release_date
    }
    
    // Pre-populate search query with current book title
    searchQuery.value = newBook.title
  }
}, { immediate: true })

onMounted(async () => {
  if (authStore.user) {
    // Fetch authors for potential matching
    await booksStore.fetchAuthors(authStore.user.id)
    
    if (isEditing.value && props.book) {
      // Initialize form with existing book data
      form.value = {
        title: props.book.title,
        series_id: props.book.series_id || props.seriesId || null,
        series_order: props.book.series_order,
        status: props.book.status,
        rating: props.book.rating,
        notes: props.book.notes || '',
        cover_url: props.book.cover_url || '',
        read_date: props.book.read_date,
        release_date: props.book.release_date
      }
      
      // Pre-populate search query with current book title
      searchQuery.value = props.book.title
    }
  }
})

const handleBookSelect = async (book: OpenLibraryBook) => {
  const processedBook = processOpenLibraryBook(book)
  
  // Update form fields
  form.value.title = processedBook.title
  if (processedBook.cover_url) {
    form.value.cover_url = processedBook.cover_url
  }
  
  // Handle series information if available
  if (processedBook.series_info && !props.seriesId) {
    // If we're not already in a series context, we could suggest creating one
    console.log('Book is part of series:', processedBook.series_info)
  }
  
  // Set series order if available and we're in a series context
  if (processedBook.series_info?.order && props.seriesId) {
    form.value.series_order = processedBook.series_info.order
  }
  
  // Set release date if available (convert year to date) and not already set
  if (processedBook.first_publish_year && !form.value.release_date) {
    form.value.release_date = `${processedBook.first_publish_year}-01-01`
  }
  
  // Show a brief message to the user
  if (isEditing.value) {
    console.log('Book information updated from search. Your existing notes and rating have been preserved.')
  }
}

const onSubmit = async () => {
  if (!authStore.user) return
  loading.value = true
  try {
    const payload = { ...form.value };

    // The `v-model.number` on the series_order input can result in an empty string
    // if the input is cleared. The database expects null, so we must convert.
    if ((payload.series_order as any) === '') {
      payload.series_order = null;
    }
    
    console.log('Form submission - isEditing:', isEditing.value)
    console.log('Form submission - payload:', payload)
    console.log('Form submission - book prop:', props.book)
    
    if (isEditing.value) {
      // For editing, we'll emit the update data
      const updateData = {
        ...payload,
        user_id: authStore.user.id
      }
      console.log('Emitting update data:', updateData)
      emit('save', updateData)
    } else {
      const addData = {
        ...payload,
        user_id: authStore.user.id,
      }
      console.log('Emitting add data:', addData)
      emit('save', addData)
    }
  } finally {
    loading.value = false
  }
}
</script> 