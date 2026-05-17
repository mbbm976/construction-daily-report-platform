import { supabase } from '../lib/supabaseClient'

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    return {
      user: null,
      error,
    }
  }

  return {
    user: data.user,
    error: null,
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return {
    session: data.session,
    user: data.user,
    error,
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  return {
    error,
  }
}
