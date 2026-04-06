import type { OpenLibraryBook, Author } from '@/types'

export interface BookSearchResult {
  title: string
  cover_url?: string
  author_name?: string
  first_publish_year?: number
  series_info?: {
    name: string
    order?: number
  }
}

export const processOpenLibraryBook = (book: OpenLibraryBook): BookSearchResult => {
  // Generate cover URL if cover ID exists
  const cover_url = book.cover_i 
    ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
    : undefined

  // Get author name (OpenLibrary can have both authors array and author_name array)
  const author_name = book.authors?.[0]?.name || book.author_name?.[0]

  // Extract series information
  let series_info: { name: string; order?: number } | undefined
  if (book.series && book.series.length > 0) {
    series_info = {
      name: book.series[0],
      order: book.series_number || undefined
    }
  }

  return {
    title: book.title,
    cover_url,
    author_name,
    first_publish_year: book.first_publish_year,
    series_info
  }
}

export const findOrCreateAuthor = (
  authorName: string,
  existingAuthors: readonly Author[]
): { author: Author | null; isNew: boolean } => {
  if (!authorName) {
    return { author: null, isNew: false }
  }

  // Try to find exact match
  const existingAuthor = existingAuthors.find(
    author => author.name.toLowerCase() === authorName.toLowerCase()
  )

  if (existingAuthor) {
    return { author: existingAuthor, isNew: false }
  }

  // Return null for new author (will be created when book is saved)
  return { author: null, isNew: true }
} 