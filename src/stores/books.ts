import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { db } from '../services/supabase'
import type { 
  Book, 
  Series, 
  Author, 
  BookFormData, 
  SeriesFormData, 
  AuthorFormData,
  ApiResponse 
} from '../types'
import { useAuthStore } from './auth'

export const useBooksStore = defineStore('books', () => {
  const books = ref<Book[]>([])
  const series = ref<Series[]>([])
  const authors = ref<Author[]>([])
  const loading = ref(false)

  const completedBooks = computed(() => 
    books.value.filter(book => book.status === 'completed')
  )

  const currentlyReading = computed(() => 
    books.value.filter(book => book.status === 'reading')
  )

  const wantToRead = computed(() => 
    books.value.filter(book => book.status === 'want_to_read')
  )

  const booksThisMonth = computed(() => {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    return completedBooks.value.filter(book => 
      book.read_date && new Date(book.read_date) >= startOfMonth
    )
  })

  const booksThisYear = computed(() => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    return completedBooks.value.filter(book => 
      book.read_date && new Date(book.read_date) >= startOfYear
    )
  })

  const fetchBooks = async (userId: string): Promise<void> => {
    loading.value = true
    try {
      const { data, error } = await db.getBooks(userId)
      if (error) throw error
      books.value = data || []
    } catch (error) {
      console.error('Error fetching books:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const addBook = async (bookData: BookFormData & { user_id: string }): Promise<ApiResponse<Book>> => {
    try {
      const { data, error } = await db.addBook(bookData)
      
      if (error) {
        console.error('BooksStore: Database error:', error)
        throw error
      }
      
      if (data && data[0]) {
        const newBook = data[0]
        books.value.unshift(newBook)
        
        // Add the book to the series books array if it belongs to a series
        if (newBook.series_id) {
          const seriesIndex = series.value.findIndex(s => s.id === newBook.series_id)
          if (seriesIndex !== -1) {
            if (!series.value[seriesIndex].books) {
              series.value[seriesIndex].books = []
            }
            series.value[seriesIndex].books!.unshift(newBook)
          }
        }
        
        // If the book belongs to a series, update the series book count
        if (newBook.series_id) {
          await updateSeriesBookCount(newBook.series_id)
        }
        
        return { data: newBook, error: null }
      }
      
      return { data: null, error: new Error('No data returned') }
    } catch (error) {
      console.error('BooksStore: Error adding book:', error)
      return { data: null, error }
    }
  }

  const updateBook = async (id: string, updates: Partial<BookFormData>): Promise<ApiResponse<Book>> => {
    try {
      console.log('Updating book:', id, 'with updates:', updates)
      
      // Get the book before updating to check series changes
      const bookToUpdate = books.value.find(book => book.id === id)
      if (!bookToUpdate) {
        console.error('Book not found in store for update:', id)
        return { data: null, error: new Error('Book not found in store') }
      }
      
      const oldSeriesId = bookToUpdate.series_id
      const newSeriesId = updates.series_id
      
      console.log('Book found in store:', bookToUpdate)
      console.log('Old series ID:', oldSeriesId, 'New series ID:', newSeriesId)
      
      const { data, error } = await db.updateBook(id, updates)
      if (error) {
        console.error('Database error updating book:', error)
        throw error
      }
      
      console.log('Database update response:', data)
      
      if (data && data[0]) {
        const updatedBook = data[0]
        console.log('Updated book from database:', updatedBook)

        // Update the book in the main `books` array
        const index = books.value.findIndex(book => book.id === id)
        if (index !== -1) {
          books.value[index] = updatedBook
          console.log('Updated book in main books array')
        } else {
          console.warn('Book not found in main books array for update')
        }

        // Handle series books array updates
        if (oldSeriesId !== newSeriesId) {
          console.log('Series assignment changed, updating series arrays')
          // Remove from old series
          if (oldSeriesId) {
            const oldSeriesIndex = series.value.findIndex(s => s.id === oldSeriesId)
            if (oldSeriesIndex !== -1 && series.value[oldSeriesIndex].books) {
              series.value[oldSeriesIndex].books = series.value[oldSeriesIndex].books!.filter(book => book.id !== id)
              console.log('Removed book from old series')
            }
          }
          
          // Add to new series
          if (newSeriesId) {
            const newSeriesIndex = series.value.findIndex(s => s.id === newSeriesId)
            if (newSeriesIndex !== -1) {
              if (!series.value[newSeriesIndex].books) {
                series.value[newSeriesIndex].books = []
              }
              series.value[newSeriesIndex].books!.unshift(updatedBook)
              console.log('Added book to new series')
            }
          }
        } else {
          // Update the book within the existing series
          if (newSeriesId) {
            const seriesIndex = series.value.findIndex(s => s.id === newSeriesId)
            if (seriesIndex !== -1 && series.value[seriesIndex].books) {
              const bookIndexInSeries = series.value[seriesIndex].books!.findIndex(b => b.id === id)
              if (bookIndexInSeries !== -1) {
                series.value[seriesIndex].books![bookIndexInSeries] = updatedBook
                console.log('Updated book in existing series')
              }
            }
          }
        }

        // Update series book counts if series assignment changed
        if (oldSeriesId !== newSeriesId) {
          if (oldSeriesId) {
            await updateSeriesBookCount(oldSeriesId)
          }
          if (newSeriesId) {
            await updateSeriesBookCount(newSeriesId)
          }
        }

        return { data: updatedBook, error: null }
      } else {
        console.error('No data returned from database update')
        return { data: null, error: new Error('No data returned from database update') }
      }
    } catch (error) {
      console.error('Error updating book:', error)
      return { data: null, error }
    }
  }

  const deleteBook = async (id: string): Promise<ApiResponse<void>> => {
    try {
      // Get the book before deleting to check if it belongs to a series
      const bookToDelete = books.value.find(book => book.id === id)
      const seriesId = bookToDelete?.series_id
      
      const { error } = await db.deleteBook(id)
      if (error) throw error
      
      books.value = books.value.filter(book => book.id !== id)
      
      // Remove the book from the series books array
      if (seriesId) {
        const seriesIndex = series.value.findIndex(s => s.id === seriesId)
        if (seriesIndex !== -1 && series.value[seriesIndex].books) {
          series.value[seriesIndex].books = series.value[seriesIndex].books!.filter(book => book.id !== id)
        }
      }
      
      // If the deleted book belonged to a series, update the series book count
      if (seriesId) {
        await updateSeriesBookCount(seriesId)
      }
      
      return { data: undefined, error: null }
    } catch (error) {
      console.error('Error deleting book:', error)
      return { data: undefined, error }
    }
  }

  const fetchSeries = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await db.getSeries(userId)
      if (error) throw error
      series.value = data || []
    } catch (error) {
      console.error('Error fetching series:', error)
      throw error
    }
  }

  const addSeries = async (seriesData: SeriesFormData & { user_id: string }): Promise<ApiResponse<Series>> => {
    try {
      const { data, error } = await db.addSeries(seriesData)
      if (error) throw error
      if (data && data[0]) {
        const newSeries = data[0]
        series.value.push(newSeries)
        
        // If total_books is specified and greater than 0, create dummy books
        if (seriesData.total_books && seriesData.total_books > 0) {
          await createDummyBooks(newSeries.id, seriesData.total_books, seriesData.user_id)
        }
        
        return { data: newSeries, error: null }
      }
      return { data: null, error: new Error('No data returned') }
    } catch (error) {
      console.error('Error adding series:', error)
      return { data: null, error }
    }
  }

  const createDummyBooks = async (seriesId: string, count: number, userId: string): Promise<void> => {
    try {
      const dummyBooks = []
      for (let i = 1; i <= count; i++) {
        dummyBooks.push({
          title: '...',
          author_id: null,
          series_id: seriesId,
          series_order: i,
          status: 'want_to_read' as const,
          user_id: userId
        })
      }
      
      const { data, error } = await db.addMultipleBooks(dummyBooks)
      if (error) throw error
      
      if (data) {
        // Add the new books to the books array
        books.value.unshift(...data)
        
        // Update the series in the series array to include the new books
        const seriesIndex = series.value.findIndex(s => s.id === seriesId)
        if (seriesIndex !== -1) {
          if (!series.value[seriesIndex].books) {
            series.value[seriesIndex].books = []
          }
          series.value[seriesIndex].books!.push(...data)
        }
      }
    } catch (error) {
      console.error('Error creating dummy books:', error)
      throw error
    }
  }

  const updateSeriesBookCount = async (seriesId: string): Promise<void> => {
    try {
      const seriesBooks = books.value.filter(book => book.series_id === seriesId)
      const bookCount = seriesBooks.length
      
      const { error } = await db.updateSeries(seriesId, { total_books: bookCount })
      if (error) throw error
      
      // Update the series in the local state
      const seriesIndex = series.value.findIndex(s => s.id === seriesId)
      if (seriesIndex !== -1) {
        series.value[seriesIndex].total_books = bookCount
      }
    } catch (error) {
      console.error('Error updating series book count:', error)
      throw error
    }
  }

  const updateSeries = async (id: string, updates: Partial<SeriesFormData>): Promise<ApiResponse<Series>> => {
    try {
      const { data, error } = await db.updateSeries(id, updates)
      if (error) throw error
      if (data && data[0]) {
        const index = series.value.findIndex(series => series.id === id)
        if (index !== -1) {
          series.value[index] = data[0]
        }
        return { data: data[0], error: null }
      }
      return { data: null, error: new Error('No data returned') }
    } catch (error) {
      console.error('Error updating series:', error)
      return { data: null, error }
    }
  }

  const deleteSeries = async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await db.deleteSeries(id)
      if (error) throw error
      series.value = series.value.filter(series => series.id !== id)
      // Also remove series_id from books that belong to this series
      books.value = books.value.map(book => 
        book.series_id === id ? { ...book, series_id: undefined, series_order: undefined } : book
      )
      return { data: undefined, error: null }
    } catch (error) {
      console.error('Error deleting series:', error)
      return { data: undefined, error }
    }
  }

  const fetchAuthors = async (userId: string): Promise<void> => {
    try {
      const { data, error } = await db.getAuthors(userId)
      if (error) throw error
      authors.value = data || []
    } catch (error) {
      console.error('Error fetching authors:', error)
      throw error
    }
  }

  const addAuthor = async (authorData: AuthorFormData & { user_id: string }): Promise<ApiResponse<Author>> => {
    try {
      const { data, error } = await db.addAuthor(authorData)
      if (error) throw error
      if (data && data[0]) {
        authors.value.push(data[0])
        return { data: data[0], error: null }
      }
      return { data: null, error: new Error('No data returned') }
    } catch (error) {
      console.error('Error adding author:', error)
      return { data: null, error }
    }
  }

  const clearAllData = async () => {
    const userId = useAuthStore().user?.id
    if (!userId) {
      console.error('User not found')
      return
    }
    try {
      await db.clearAllData(userId)
      books.value = []
      series.value = []
      authors.value = []
    } catch (error) {
      console.error('Error clearing all data:', error)
      throw error
    }
  }

  return {
    books: readonly(books),
    series: readonly(series),
    authors: readonly(authors),
    loading: readonly(loading),
    completedBooks,
    currentlyReading,
    wantToRead,
    booksThisMonth,
    booksThisYear,
    fetchBooks,
    addBook,
    updateBook,
    deleteBook,
    fetchSeries,
    addSeries,
    updateSeries,
    deleteSeries,
    fetchAuthors,
    addAuthor,
    clearAllData
  }
}) 