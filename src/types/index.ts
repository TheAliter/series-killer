// Database Types
export interface Book {
  id: string
  title: string
  series_id?: string | null
  series_order?: number | null
  status: 'reading' | 'completed' | 'want_to_read' | 'dropped'
  rating?: number | null
  notes?: string | null
  cover_url?: string | null
  read_date?: string | null
  release_date?: string | null
  user_id: string
  created_at: string
  updated_at: string
  series?: { name: string; total_books: number }
}

export interface Series {
  id: string
  name: string
  description?: string
  total_books: number
  author_id?: string | null
  user_id: string
  created_at: string
  updated_at: string
  cover_url?: string
  books?: Book[]
  authors?: { name: string }
}

export interface ReadonlySeries {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly total_books: number
  readonly author_id?: string | null
  readonly user_id: string
  readonly created_at: string
  readonly updated_at: string
  readonly cover_url?: string
  readonly books?: readonly Book[]
  readonly authors?: { name: string }
}

export interface Author {
  id: string
  name: string
  user_id: string
  created_at: string
  updated_at: string
}

// Form Types
export interface BookFormData {
  title: string
  series_id?: string | null
  series_order?: number | null
  status: 'reading' | 'completed' | 'want_to_read' | 'dropped'
  rating?: number | null
  notes?: string | null
  cover_url?: string | null
  read_date?: string | null
  release_date?: string | null
}

export interface SeriesFormData {
  name: string
  description?: string
  total_books?: number
  author_id?: string | null
}

export interface AuthorFormData {
  name: string
}

// API Response Types
export interface ApiResponse<T> {
  data: T | null
  error: any
}

// OpenLibrary API Types
export interface OpenLibraryBook {
  key: string
  title: string
  authors?: Array<{ name: string }>
  author_name?: string[]
  cover_i?: number
  first_publish_year?: number
  number_of_pages_median?: number
  series?: string[]
  series_key?: string[]
  series_number?: number
}

export interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[]
  numFound: number
  start: number
}

// Component Props Types
export interface BookCardProps {
  book: Book
  showActions?: boolean
}

export interface SeriesCardProps {
  series: Series
  showActions?: boolean
}

// Statistics Types
export interface ReadingStats {
  totalBooks: number
  booksThisMonth: number
  booksThisYear: number
  averageRating: number
  completedSeries: number
  totalSeries: number
  averageDaysPerBook: number
} 