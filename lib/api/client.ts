import axios from "axios"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Helper to get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  const authData = localStorage.getItem("auth-storage")
  if (!authData) return null
  try {
    const parsed = JSON.parse(authData)
    return parsed?.state?.session?.access_token || null
  } catch {
    return null
  }
}

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isDev = process.env.NODE_ENV === "development"
        const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"

        if (!isDev || !isLocalhost || error.response) {
          localStorage.removeItem("auth-storage")
          window.location.href = "/login"
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient

