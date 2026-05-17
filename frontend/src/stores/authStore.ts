import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  initialize: async () => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.auth.getUser()

    if (error) {
      set({ user: null, loading: false, error: error.message })
      return
    }

    set({ user: data.user ?? null, loading: false, error: null })
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      set({ loading: false, error: error.message })
      throw error
    }

    set({ user: data.user ?? null, loading: false, error: null })
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      set({ error: error.message })
      throw error
    }

    set({ user: null, loading: false, error: null })
  },
}))
