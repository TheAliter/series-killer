import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { auth } from '../services/supabase'
import type { ApiResponse } from '../types'

interface User {
  id: string
  email: string
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  const signUp = async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await auth.signUp(email, password)
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string): Promise<ApiResponse<any>> => {
    try {
      const { data, error } = await auth.signIn(email, password)
      if (error) throw error
      user.value = data.user
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async (): Promise<ApiResponse<void>> => {
    try {
      const { error } = await auth.signOut()
      if (error) throw error
      user.value = null
      return { data: undefined, error: null }
    } catch (error) {
      return { data: undefined, error }
    }
  }

  const initializeAuth = async (): Promise<void> => {
    try {
      // Get the current session from Supabase
      const { data: { session }, error } = await auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return
      }
      
      if (session?.user) {
        user.value = session.user
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const refreshSession = async (): Promise<void> => {
    try {
      const { data: { session }, error } = await auth.refreshSession()
      if (error) {
        console.error('Error refreshing session:', error)
        return
      }
      
      if (session?.user) {
        user.value = session.user
      } else {
        user.value = null
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      user.value = null
    }
  }

  const setUser = (newUser: User | null): void => {
    user.value = newUser
  }

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<any>> => {
    try {
      const email = user.value?.email
      if (!email) {
        return { data: null, error: new Error('Not signed in.') }
      }
      const { data: signInData, error: signInError } = await auth.signIn(email, currentPassword)
      if (signInError) throw signInError
      if (signInData?.user) {
        user.value = signInData.user
      }
      const { data, error } = await auth.updatePassword(newPassword)
      if (error) throw error
      if (data?.user) {
        user.value = data.user
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    changePassword,
    initializeAuth,
    refreshSession,
    setUser
  }
}) 