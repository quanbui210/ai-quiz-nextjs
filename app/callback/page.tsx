"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { AuthLoginResponse } from "@/types/api"
import { API_ENDPOINTS } from "@/lib/constants"
import { apiClient } from "@/lib/api/client"

export default function CallbackPage() {
  const router = useRouter()
  const { setAuth, setLoading } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const hasProcessedRef = useRef(false)

  useEffect(() => {
    if (hasProcessedRef.current) return

    const handleHashCallback = async (): Promise<void> => {
      if (hasProcessedRef.current) return
      hasProcessedRef.current = true
      try {
        const hash = window.location.hash.substring(1)
        const params = new URLSearchParams(hash)

        const accessToken = params.get("access_token")
        const refreshToken = params.get("refresh_token")
        const providerToken = params.get("provider_token")
        const providerRefreshToken = params.get("provider_refresh_token")
        const expiresAt = params.get("expires_at")
        const expiresIn = params.get("expires_in")
        const tokenType = params.get("token_type") || "bearer"

        const errorParam = params.get("error")
        if (errorParam) {
          throw new Error(errorParam)
        }

        if (!accessToken) {
          throw new Error("No access token in callback")
        }

        // Use apiClient for consistency and timeout handling
        // Note: We don't send auth token here since this is the initial callback
        const response = await apiClient.post<AuthLoginResponse>(
          API_ENDPOINTS.AUTH.CALLBACK,
          {
            access_token: accessToken,
            refresh_token: refreshToken,
            provider_token: providerToken,
            provider_refresh_token: providerRefreshToken,
            expires_at: expiresAt ? parseInt(expiresAt) : undefined,
            expires_in: expiresIn ? parseInt(expiresIn) : undefined,
            token_type: tokenType,
          }
        )

        const data = response.data

        // Log the response for debugging
        console.log("Callback response:", data)
        
        // Validate that we have the required data
        if (!data.user) {
          throw new Error("Backend response missing user data")
        }
        if (!data.session) {
          throw new Error("Backend response missing session data")
        }
        if (!data.session.access_token) {
          throw new Error("Backend response missing access_token")
        }

        console.log("Setting auth with user:", data.user?.id, "session:", !!data.session?.access_token)
        setAuth(data)
        setLoading(false) // Ensure loading is cleared after successful auth

        // Verify the data was stored
        await new Promise(resolve => setTimeout(resolve, 100))
        const stored = localStorage.getItem("auth-storage")
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            const hasSession = parsed?.state?.session?.access_token
            const hasUser = parsed?.state?.user?.id
            console.log("Verification - Stored session:", !!hasSession, "Stored user:", !!hasUser)
            if (!hasSession || !hasUser) {
              console.error("WARNING: Auth data not properly stored!", parsed)
            }
          } catch (e) {
            console.error("Failed to verify stored auth data:", e)
          }
        }

        if (data.isAdmin) {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      } catch (err) {
        console.error("Callback error:", err)
        setLoading(false) // Clear loading on error
        setError(err instanceof Error ? err.message : "Unknown error")
        setTimeout(() => {
          router.push(
            `/login?error=${encodeURIComponent(err instanceof Error ? err.message : "callback_failed")}`
          )
        }, 2000)
      }
    }

    handleHashCallback()
  }, [router, setAuth, setLoading])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-red-600">Error: {error}</div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
