import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null })

    const { data } = await supabase.auth.getSession()

    set({
      user: data.session?.user ?? null,
      loading: false,
      error: null,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        loading: false,
        error: null,
      })
    })
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({
        user: null,
        loading: false,
        error: 'Имэйл эсвэл нууц үг буруу байна.',
      })
      return false
    }

    set({
      user: data.user,
      loading: false,
      error: null,
    })

    return true
  },

  signOut: async () => {
    await supabase.auth.signOut()

    set({
      user: null,
      loading: false,
      error: null,
    })
  },

  clearError: () => {
    set({ error: null })
  },
}))
