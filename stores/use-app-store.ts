import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

interface AppState {
  // Add your app-wide state here
  // Example:
  // user: User | null
  // theme: "light" | "dark"
  // Actions
  // setUser: (user: User | null) => void
  // setTheme: (theme: "light" | "dark") => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        // user: null,
        // theme: "light",
        // Actions
        // setUser: (user) => set({ user }),
        // setTheme: (theme) => set({ theme }),
      }),
      {
        name: "app-storage", // localStorage key
      }
    ),
    {
      name: "AppStore", // Redux DevTools name
    }
  )
)
