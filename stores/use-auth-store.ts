import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { AuthLoginResponse, AuthSessionResponse } from "@/types/api"

// Supabase user structure - IDs now match Prisma User IDs
export interface SupabaseUser {
  id: string
  email: string
  user_metadata?: {
    name?: string
    full_name?: string
    avatar_url?: string
    picture?: string
    [key: string]: any
  }
  [key: string]: any
}

interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
}

interface AuthState {
  user: SupabaseUser | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean

  setAuth: (data: AuthLoginResponse | AuthSessionResponse) => void
  setUser: (user: SupabaseUser | null) => void
  setSession: (session: Session | null) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,

        setAuth: (data: AuthLoginResponse | AuthSessionResponse) => {
          // Backend returns user with Supabase structure (same ID as Prisma now)
          const user = data.user as SupabaseUser
          const session = data.session

          set({
            user,
            session,
            isAuthenticated: !!user && !!session,
          })
        },

        setUser: (user: SupabaseUser | null) => {
          const currentState = get()
          set({
            user,
            isAuthenticated: !!user && !!currentState.session,
          })
        },

        setSession: (session: Session | null) => {
          const currentState = get()
          set({
            session,
            isAuthenticated: !!session && !!currentState.user,
          })
        },

        logout: () => {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
          })
        },

        setLoading: (loading: boolean) => {
          set({ isLoading: loading })
        },
      }),
      {
        name: "auth-storage",
      }
    ),
    {
      name: "AuthStore",
    }
  )
)
