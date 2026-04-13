<template>
  <div class="editorial-form-root">
    <section class="editorial-shell">
      <aside class="editorial-preview">
        <span class="preview-badge">{{ isEditing ? 'Edit Mode' : 'Create Mode' }}</span>
        <h1 class="preview-title">{{ previewSeriesName }}</h1>
        <div class="preview-cover" :class="{ 'has-image': showCoverImage }">
          <img
            v-if="showCoverImage"
            :src="form.cover_url"
            :alt="`${previewSeriesName} cover`"
            class="cover-image"
            @error="onImageError"
          />
          <div v-else class="cover-fallback">Cover Preview</div>
        </div>

        <div class="preview-meta">
          <div class="meta-item">
            <strong>{{ previewBooksLabel }}</strong>
            planned range
          </div>
          <div class="meta-item">
            <strong>{{ previewAuthorName }}</strong>
            linked author
          </div>
          <div class="meta-item">
            <strong>{{ previewSeedSource }}</strong>
            seed source
          </div>
          <div class="meta-item">
            <strong :class="{ 'status-ready': previewReady }">{{ previewStatusLabel }}</strong>
            required fields
          </div>
        </div>
      </aside>

      <form class="editorial-form" @submit.prevent="onSubmit">
        <div class="form-grid">
          <div class="field-row full-width">
            <label for="series-book-search">Search Book Seed</label>
            <div class="search-box">
              <SeriesSearch id="series-book-search" v-model="searchQuery" @select="handleBookSelect" />
            </div>
            <p class="hint">Search OpenLibrary to auto-fill series name, author, and cover image.</p>
          </div>

          <div class="field-row">
            <label for="series-name">Series Name *</label>
            <input id="series-name" v-model="form.name" type="text" required />
          </div>

          <div class="field-row">
            <label for="series-author">Author</label>
            <input id="series-author" v-model="authorName" type="text" placeholder="Author name..." />
          </div>

          <div class="field-row full-width">
            <label for="series-cover-url">Cover URL</label>
            <input id="series-cover-url" v-model="form.cover_url" type="url" placeholder="https://..." />
            <p v-if="form.cover_url && coverError" class="error-hint">Invalid image URL.</p>
          </div>

          <div class="field-row">
            <label for="series-total-books">Total Books</label>
            <input id="series-total-books" v-model.number="form.total_books" type="number" min="0" />
            <p class="hint">Leave empty when unknown.</p>
          </div>

          <div class="field-row full-width">
            <label for="series-description">Description</label>
            <textarea
              id="series-description"
              v-model="form.description"
              rows="4"
              placeholder="Brief description of the series..."
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="button cancel" @click="$emit('cancel')">Cancel</button>
          <button type="submit" class="button save" :disabled="loading">
            <span v-if="loading">Saving...</span>
            <span v-else>{{ isEditing ? 'Update Series' : 'Save Series' }}</span>
          </button>
        </div>
      </form>
    </section>
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

const previewSeriesName = computed(() => {
  const candidateName = form.value.name.trim()
  if (candidateName) return candidateName
  return isEditing.value ? 'Untitled Series' : 'New Series'
})

const previewAuthorName = computed(() => {
  const candidateAuthorName = authorName.value.trim()
  return candidateAuthorName || 'No author linked'
})

const previewBooksLabel = computed(() => {
  return form.value.total_books > 0 ? `${form.value.total_books} books` : 'Books TBD'
})

const previewSeedSource = computed(() => {
  return searchQuery.value.trim() ? 'OpenLibrary' : 'Manual'
})

const previewReady = computed(() => {
  return form.value.name.trim().length > 0
})

const previewStatusLabel = computed(() => {
  return previewReady.value ? 'Ready' : 'Draft'
})

const showCoverImage = computed(() => {
  return Boolean(form.value.cover_url && !coverError.value)
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

<style scoped>
.editorial-form-root {
  --paper: #f5f1e8;
  --paper-2: #ebe3d4;
  --ink: #2d2721;
  --muted: #74695a;
  --line: #d7ccb7;
  --accent: #8f6e44;
  --accent-soft: #ede2cf;
  --ok: #2f6f56;

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
}

.field-row {
  display: grid;
  gap: 0.42rem;
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
textarea:focus {
  border-color: #9e7b4b;
  box-shadow: 0 0 0 4px rgb(143 110 68 / 12%);
}

textarea {
  min-height: 124px;
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
</style>