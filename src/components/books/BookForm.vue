<template>
  <div class="editorial-form-root">
    <section class="editorial-shell">
      <div
        v-if="!props.book && isEditing"
        class="loading-overlay"
      >
        <div class="text-center">
          <div class="loading-spinner" />
          <p class="loading-copy">Loading book data...</p>
        </div>
      </div>

      <aside class="editorial-preview">
        <span class="preview-badge">{{ isEditing ? 'Edit Mode' : 'Create Mode' }}</span>
        <h1 class="preview-title">{{ previewTitle }}</h1>
        <div class="preview-cover" :class="{ 'has-image': showCoverImage }">
          <img
            v-if="showCoverImage"
            :src="previewCoverUrl"
            :alt="`${previewTitle} cover`"
            class="cover-image"
            @error="onImageError"
          />
          <div v-else class="cover-fallback">Book Cover Preview</div>
        </div>

        <div class="preview-meta">
          <div class="meta-item">
            <strong>{{ previewStatusLabel }}</strong>
            reading state
          </div>
          <div class="meta-item">
            <strong>{{ previewOrderLabel }}</strong>
            series order
          </div>
          <div class="meta-item">
            <strong>{{ previewRatingLabel }}</strong>
            rating
          </div>
          <div class="meta-item">
            <strong :class="{ 'status-ready': previewReady }">{{ previewReady ? 'Ready' : 'Draft' }}</strong>
            required fields
          </div>
        </div>
      </aside>

      <form class="editorial-form" @submit.prevent="onSubmit">
        <div class="form-grid">
          <div class="field-row full-width">
            <label for="book-search-seed">Search Book Seed</label>
            <div class="search-box">
              <BookSearch
                id="book-search-seed"
                v-model="searchQuery"
                @select="handleBookSelect"
              />
            </div>
            <p class="hint">
              {{ isEditing ? 'Search updates metadata only. Notes and rating stay untouched.' : 'Search OpenLibrary to auto-fill title, cover, and release date.' }}
            </p>
          </div>

          <div class="field-row">
            <label for="book-title">Title *</label>
            <input id="book-title" v-model="form.title" type="text" required />
          </div>

          <div class="field-row">
            <label for="book-status">Status *</label>
            <select id="book-status" v-model="form.status" required>
              <option value="want_to_read">Want to Read</option>
              <option value="reading">Currently Reading</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
            </select>
          </div>

          <div class="field-row full-width">
            <label for="book-cover-url">Cover URL</label>
            <input id="book-cover-url" v-model="form.cover_url" type="url" placeholder="https://..." />
            <p v-if="form.cover_url && coverError" class="error-hint">Invalid image URL.</p>
          </div>

          <div class="field-row">
            <label for="book-series-order">Series Order</label>
            <input id="book-series-order" v-model.number="form.series_order" type="number" min="1" />
          </div>

          <div class="field-row">
            <label for="book-release-date">Release Date</label>
            <input
              id="book-release-date"
              v-model="form.release_date"
              type="date"
              pattern="\d{4}-\d{2}-\d{2}"
              placeholder="YYYY/MM/DD"
            />
            <p class="hint">Leave empty if already released.</p>
          </div>

          <div class="field-row">
            <label for="book-rating">Rating</label>
            <select id="book-rating" v-model.number="form.rating">
              <option :value="null">No Rating</option>
              <option v-for="i in 5" :key="i" :value="i">{{ i }}/5</option>
            </select>
          </div>

          <div class="field-row full-width">
            <label for="book-notes">Notes</label>
            <textarea id="book-notes" v-model="form.notes" rows="3" placeholder="Your thoughts..."></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="button cancel" @click="$emit('cancel')">Cancel</button>
          <button
            type="submit"
            class="button save"
            :disabled="loading || (isEditing && !props.book)"
          >
            <span v-if="loading">Saving...</span>
            <span v-else>{{ isEditing ? 'Update Book' : 'Save Book' }}</span>
          </button>
        </div>
      </form>
    </section>
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
const coverError = ref(false)

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

watch(() => form.value.cover_url, () => {
  coverError.value = false
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

const onImageError = () => {
  coverError.value = true
}

const previewTitle = computed(() => {
  const title = form.value.title.trim()
  if (title) return title
  return isEditing.value ? 'Untitled Book' : 'New Book Entry'
})

const previewStatusLabel = computed(() => {
  const statusLabels: Record<BookFormData['status'], string> = {
    want_to_read: 'Want to Read',
    reading: 'Reading',
    completed: 'Completed',
    dropped: 'Dropped'
  }
  return statusLabels[form.value.status]
})

const previewOrderLabel = computed(() => {
  return form.value.series_order ? `#${form.value.series_order}` : 'Unordered'
})

const previewRatingLabel = computed(() => {
  return form.value.rating ? `${form.value.rating}/5` : 'No Rating'
})

const previewReady = computed(() => {
  return form.value.title.trim().length > 0
})

const showCoverImage = computed(() => {
  return Boolean(form.value.cover_url && !coverError.value)
})

const previewCoverUrl = computed(() => {
  return form.value.cover_url || undefined
})

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

    if ((payload.release_date as any) === '') {
      payload.release_date = null;
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

<style scoped>
.editorial-form-root {
  --paper: #f5f1e8;
  --paper-2: #ebe3d4;
  --ink: #2d2721;
  --muted: #74695a;
  --line: #d7ccb7;
  --accent: #8f6e44;
  --ok: #2f6f56;

  position: relative;
  font-family: "Manrope", "Avenir Next", "Segoe UI", sans-serif;
  color: var(--ink);
  background:
    radial-gradient(circle at 10% -10%, rgb(143 110 68 / 18%), transparent 45%),
    linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%);
  border: 1px solid var(--line);
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 25px 80px rgb(62 47 34 / 12%);
}

.editorial-shell {
  display: grid;
  position: relative;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(245 241 232 / 90%);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  margin: 0 auto 0.5rem;
  border: 2px solid #d8cbb7;
  border-top-color: #8f6e44;
  border-radius: 999px;
  animation: spin 0.8s linear infinite;
}

.loading-copy {
  color: var(--muted);
}

.editorial-preview {
  padding: 1.2rem;
  background: linear-gradient(165deg, #f8f3ea 0%, #ece2d2 100%);
  border-bottom: 1px solid var(--line);
}

.preview-badge {
  display: inline-block;
  font-size: 0.73rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
  border: 1px solid rgb(143 110 68 / 35%);
  color: var(--accent);
  background: rgb(255 255 255 / 65%);
}

.preview-title {
  font-family: "Cormorant Garamond", "Iowan Old Style", "Times New Roman", serif;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 0.95;
  margin: 0.9rem 0 0.35rem;
  font-weight: 700;
}

.preview-copy {
  margin: 0;
  color: var(--muted);
  max-width: 30ch;
  line-height: 1.45;
  font-size: 0.93rem;
}

.preview-cover {
  margin-top: 1.5rem;
  border-radius: 0.8rem;
  border: 1px solid #c6b69d;
  height: min(52vh, 420px);
  max-height: 420px;
  background:
    linear-gradient(180deg, rgb(37 30 26 / 20%), transparent 25%),
    linear-gradient(145deg, #6f4f31, #4f3a28 60%, #2f241c);
  box-shadow: 0 16px 32px rgb(37 24 14 / 22%);
  position: relative;
  overflow: hidden;
}

.preview-cover::after {
  content: "";
  position: absolute;
  inset: 12px;
  border: 1px solid rgb(255 245 224 / 25%);
  border-radius: 0.45rem;
  pointer-events: none;
}

.preview-cover.has-image::after {
  border-color: rgb(255 245 224 / 45%);
}

.preview-cover.has-image {
  background: transparent;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cover-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: rgb(255 247 233 / 82%);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.72rem;
}

.preview-meta {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px dashed #c8baa5;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
  font-size: 0.82rem;
}

.meta-item strong {
  display: block;
  color: var(--ink);
  font-size: 0.95rem;
  margin-bottom: 0.15rem;
}

.meta-item .status-ready {
  color: var(--ok);
}

.editorial-form {
  padding: 1.2rem;
  display: grid;
  gap: 1rem;
  align-content: start;
}

.form-grid {
  display: grid;
  gap: 1rem;
  align-items: start;
}

.field-row {
  display: grid;
  gap: 0.42rem;
  align-content: start;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border-radius: 0.62rem;
  border: 1px solid #d7c8b1;
  background: #fffefb;
  color: var(--ink);
  padding: 0.75rem 0.85rem;
  font: inherit;
  font-size: 0.93rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus,
select:focus,
textarea:focus {
  border-color: #9e7b4b;
  box-shadow: 0 0 0 4px rgb(143 110 68 / 12%);
}

textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.45;
}

.search-box {
  border: none;
  background: transparent;
  border-radius: 0;
  padding: 0;
}

.search-box :deep(input) {
  border-color: #d7c8b1;
  background: #fffefb;
}

.search-box :deep(.absolute.top-full) {
  border-color: #d7c8b1;
  border-radius: 0.6rem;
}

.hint {
  font-size: 0.75rem;
  color: var(--muted);
  line-height: 1.35;
  margin-top: -0.15rem;
}

.error-hint {
  font-size: 0.75rem;
  color: #b53939;
  line-height: 1.35;
}

.form-actions {
  display: flex;
  gap: 0.65rem;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  padding-top: 0.8rem;
  margin-top: 0.25rem;
  border-top: 1px solid #dccfba;
}

.button {
  border: none;
  border-radius: 0.7rem;
  padding: 0.78rem 1rem;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.button:hover {
  transform: translateY(-1px);
}

.button:disabled {
  cursor: default;
  opacity: 0.7;
  transform: none;
}

.button.cancel {
  color: var(--ink);
  background: #ece3d4;
  border: 1px solid #d2c3ab;
}

.button.save {
  min-width: 172px;
  color: #fff;
  background: linear-gradient(135deg, #8f6e44, #755635);
  box-shadow: 0 12px 25px rgb(90 60 28 / 24%);
}

@media (min-width: 980px) {
  .editorial-shell {
    grid-template-columns: 1.05fr 1.45fr;
    min-height: 82vh;
  }

  .editorial-preview {
    border-bottom: none;
    border-right: 1px solid var(--line);
    padding: 2rem;
  }

  .editorial-form {
    padding: 2rem 2rem 1.2rem;
  }

  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.05rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>