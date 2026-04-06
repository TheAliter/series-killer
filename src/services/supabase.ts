import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { 
  Book, 
  Series, 
  Author, 
  BookFormData, 
  SeriesFormData, 
  AuthorFormData,
  ApiResponse 
} from '../types'

// Use provided credentials with fallback to environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kysfaxdrufchapuuqtyn.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5c2ZheGRydWZjaGFwdXVxdHluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjczODIsImV4cCI6MjA2NTUwMzM4Mn0.J7i_6lCE_q_uJOfTSp1-8etlg6cIBeQtKzDfvLtpqPM'

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const auth = {
  async signUp(email: string, password: string): Promise<ApiResponse<any>> {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://series-killer.vercel.app'
      }
    })
  },

  async signIn(email: string, password: string): Promise<ApiResponse<any>> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  },

  async resetPasswordForEmail(email: string): Promise<ApiResponse<any>> {
    const redirectTo = `${window.location.origin}/reset-password`
    return await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  },

  async signOut(): Promise<ApiResponse<void>> {
    const result = await supabase.auth.signOut()
    return { data: undefined, error: result.error }
  },

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return await supabase.auth.getUser()
  },

  async getSession(): Promise<ApiResponse<any>> {
    return await supabase.auth.getSession()
  },

  async refreshSession(): Promise<ApiResponse<any>> {
    return await supabase.auth.refreshSession()
  },

  async updatePassword(password: string): Promise<ApiResponse<any>> {
    return await supabase.auth.updateUser({ password })
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database helpers
export const db = {
  // Books
  async getBooks(userId: string): Promise<ApiResponse<Book[]>> {
    return await supabase
      .from('books')
      .select(`
        *,
        series(name, total_books)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
  },

  async addBook(bookData: BookFormData & { user_id: string }): Promise<ApiResponse<Book[]>> {
    return await supabase
      .from('books')
      .insert(bookData)
      .select()
  },

  async addMultipleBooks(booksData: (BookFormData & { user_id: string })[]): Promise<ApiResponse<Book[]>> {
    return await supabase
      .from('books')
      .insert(booksData)
      .select()
  },

  async updateBook(id: string, updates: Partial<BookFormData>): Promise<ApiResponse<Book[]>> {
    console.log('Supabase: Updating book with ID:', id)
    console.log('Supabase: Update data:', updates)
    
    const result = await supabase
      .from('books')
      .update(updates)
      .eq('id', id)
      .select()
    
    console.log('Supabase: Update result:', result)
    
    return result
  },

  async deleteBook(id: string): Promise<ApiResponse<void>> {
    const result = await supabase
      .from('books')
      .delete()
      .eq('id', id)
    return { data: undefined, error: result.error }
  },

  // Series
  async getSeries(userId: string): Promise<ApiResponse<Series[]>> {
    return await supabase
      .from('series')
      .select(`
        *,
        books(*),
        authors(name)
      `)
      .eq('user_id', userId)
      .order('name')
  },

  async addSeries(seriesData: SeriesFormData & { user_id: string }): Promise<ApiResponse<Series[]>> {
    return await supabase
      .from('series')
      .insert(seriesData)
      .select()
  },

  async updateSeries(id: string, updates: Partial<SeriesFormData>): Promise<ApiResponse<Series[]>> {
    return await supabase
      .from('series')
      .update(updates)
      .eq('id', id)
      .select()
  },

  async deleteSeries(id: string): Promise<ApiResponse<void>> {
    // First, remove series_id from all books in this series
    await supabase
      .from('books')
      .update({ series_id: null, series_order: null })
      .eq('series_id', id)
    
    // Then delete the series
    const result = await supabase
      .from('series')
      .delete()
      .eq('id', id)
    return { data: undefined, error: result.error }
  },

  // Authors
  async getAuthors(userId: string): Promise<ApiResponse<Author[]>> {
    return await supabase
      .from('authors')
      .select('*')
      .eq('user_id', userId)
      .order('name')
  },

  async addAuthor(authorData: AuthorFormData & { user_id: string }): Promise<ApiResponse<Author[]>> {
    return await supabase
      .from('authors')
      .insert(authorData)
      .select()
  },

  async clearAllData(userId: string): Promise<void> {
    const { error: booksError } = await supabase.from('books').delete().eq('user_id', userId);
    if (booksError) throw booksError;

    const { error: seriesError } = await supabase.from('series').delete().eq('user_id', userId);
    if (seriesError) throw seriesError;

    const { error: authorsError } = await supabase.from('authors').delete().eq('user_id', userId);
    if (authorsError) throw authorsError;
  }
} 