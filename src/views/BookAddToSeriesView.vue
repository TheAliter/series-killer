<template>
  <div class="fixed inset-0 flex h-screen w-screen flex-col bg-card-cream">
    <div class="border-b border-paper-dark bg-card-cream p-4">
      <h2 class="font-serif text-lg font-semibold text-ink">
        {{ isEditing ? 'Edit Book' : 'Add Book to Series' }}
      </h2>
    </div>
    <form @submit.prevent="onSubmit" class="flex-1 flex flex-col overflow-y-auto">
      <div class="flex-1 p-4 space-y-4">
        <!-- Book Search Section -->
        <div v-if="!isEditing">
          <label class="block text-sm font-medium mb-1">Search for Book</label>
          <BookSearch 
            v-model="searchQuery" 
            @select="handleBookSelect" 
          />
          <p class="mt-1 text-xs text-ink-muted">Search for a book to auto-fill the form below</p>
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
        <button type="button" @click="goBack" class="btn-secondary flex-1">Cancel</button>
        <button type="submit" :disabled="loading" class="btn-primary flex-1">
          <span v-if="loading">Saving...</span>
          <span v-else>{{ isEditing ? 'Update Book' : 'Add Book' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import BookSearch from '@/components/books/BookSearch.vue'
import { processOpenLibraryBook } from '@/utils/bookSearch'
import type { OpenLibraryBook } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authStore = useAuthStore()

const isEditing = computed(() => !!route.params.bookId)
const loading = ref(false)
const searchQuery = ref('')

const form = ref({
  title: '',
  cover_url: '',
  status: 'want_to_read' as 'reading' | 'completed' | 'want_to_read' | 'dropped',
  notes: '',
  rating: null as number | null,
  series_order: null as number | null,
  release_date: null as string | null
})

onMounted(async () => {
  if (authStore.user) {
    if (isEditing.value) {
      await booksStore.fetchBooks(authStore.user.id)
      const bookId = route.params.bookId as string
      const bookToEdit = booksStore.books.find(b => b.id === bookId)
      if (bookToEdit) {
        form.value = {
          title: bookToEdit.title,
          cover_url: bookToEdit.cover_url || '',
          status: bookToEdit.status,
          notes: bookToEdit.notes || '',
          rating: bookToEdit.rating ?? null,
          series_order: bookToEdit.series_order ?? null,
          release_date: bookToEdit.release_date || null,
        }
      }
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
  if (processedBook.series_info && !route.params.seriesId) {
    // If we're not already in a series context, we could suggest creating one
    console.log('Book is part of series:', processedBook.series_info)
  }
  
  // Set series order if available and we're in a series context
  if (processedBook.series_info?.order && route.params.seriesId) {
    form.value.series_order = processedBook.series_info.order
  }
  
  // Set release date if available (convert year to date)
  if (processedBook.first_publish_year) {
    form.value.release_date = `${processedBook.first_publish_year}-01-01`
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
    
    if (isEditing.value) {
      const bookId = route.params.bookId as string
      await booksStore.updateBook(bookId, payload)
    } else {
      await booksStore.addBook({
        ...payload,
        series_id: (route.params.seriesId as string) || null,
        user_id: authStore.user.id,
      })
    }
    
    router.push('/app/series')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/app/series')
}
</script> 