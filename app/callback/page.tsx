"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { AuthLoginResponse } from "@/types/api"

export default function CallbackPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleHashCallback = async (): Promise<void> => {
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

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
        const response = await fetch(`${apiUrl}/api/v1/auth/callback`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            access_token: accessToken,
            refresh_token: refreshToken,
            provider_token: providerToken,
            provider_refresh_token: providerRefreshToken,
            expires_at: expiresAt ? parseInt(expiresAt) : undefined,
            expires_in: expiresIn ? parseInt(expiresIn) : undefined,
            token_type: tokenType,
          }),
        })

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }))
          throw new Error(
            errorData.error || errorData.message || "Failed to process callback"
          )
        }

        const data: AuthLoginResponse = await response.json()

        setAuth(data)

        router.push("/dashboard")
      } catch (err) {
        console.error("Callback error:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setTimeout(() => {
          router.push(
            `/login?error=${encodeURIComponent(err instanceof Error ? err.message : "callback_failed")}`
          )
        }, 2000)
      }
    }

    handleHashCallback()
  }, [router, setAuth])

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
