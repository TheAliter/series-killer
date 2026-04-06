<template>
  <div class="mobile-container py-6">
    <BookForm 
      :book="book" 
      :series-id="seriesId"
      @save="handleSave" 
      @cancel="handleCancel" 
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBooksStore } from '@/stores/books'
import { useAuthStore } from '@/stores/auth'
import BookForm from '@/components/books/BookForm.vue'
import type { Book, BookFormData } from '@/types'

const route = useRoute()
const router = useRouter()
const booksStore = useBooksStore()
const authStore = useAuthStore()

const book = ref<Book | null>(null)
const seriesId = ref<string | null>(null)
const loading = ref(false)

onMounted(async () => {
  if (authStore.user) {
    loading.value = true
    try {
      // Check if we're editing a book
      if (route.params.bookId) {
        const bookId = route.params.bookId as string
        
        // First, try to find the book in the current store
        let found = booksStore.books.find(b => b.id === bookId)
        
        // If not found in books array, check in series books
        if (!found) {
          for (const series of booksStore.series) {
            if (series.books) {
              found = series.books.find(b => b.id === bookId)
              if (found) break
            }
          }
        }
        
        // If still not found, fetch all books and series to ensure we have the latest data
        if (!found) {
          await Promise.all([
            booksStore.fetchBooks(authStore.user.id),
            booksStore.fetchSeries(authStore.user.id)
          ])
          
          // Try to find the book again
          found = booksStore.books.find(b => b.id === bookId)
          if (!found) {
            for (const series of booksStore.series) {
              if (series.books) {
                found = series.books.find(b => b.id === bookId)
                if (found) break
              }
            }
          }
        }
        
        if (found) {
          book.value = found
        } else {
          // Book not found - this could happen if it was deleted
          console.error('Book not found:', bookId)
          alert('Book not found. It may have been deleted.')
          router.push('/app/series')
          return
        }
      }
      
      // Check if we're adding to a specific series
      if (route.params.seriesId) {
        seriesId.value = route.params.seriesId as string
      }
    } catch (error) {
      console.error('Error loading book data:', error)
      alert('Error loading book data. Please try again.')
      router.push('/app/series')
    } finally {
      loading.value = false
    }
  }
})

const handleSave = async (bookData: BookFormData & { user_id: string }) => {
  if (!authStore.user) return
  
  if (book.value) {
    // Validate that the book still exists before updating
    const bookStillExists = booksStore.books.find(b => b.id === book.value!.id) ||
                           booksStore.series.some(s => s.books?.some(b => b.id === book.value!.id))
    
    if (!bookStillExists) {
      alert('Book no longer exists. It may have been deleted.')
      router.push('/app/series')
      return
    }
    
    // Update existing book
    const result = await booksStore.updateBook(book.value.id, bookData)
    if (result.error) {
      console.error('Update error:', result.error)
      alert('Error updating book. Please try again.')
      return
    }
    
    console.log('Book updated successfully:', result.data)
  } else {
    // Add new book
    const result = await booksStore.addBook(bookData)
    if (result.error) {
      console.error('Add error:', result.error)
      alert('Error adding book. Please try again.')
      return
    }
    
    console.log('Book added successfully:', result.data)
  }
  
  // Navigate back to appropriate page
  if (seriesId.value) {
    router.push('/app/series')
  } else {
    router.push('/app/series')
  }
}

const handleCancel = () => {
  if (seriesId.value) {
    router.push('/app/series')
  } else {
    router.push('/app/series')
  }
}
</script> 