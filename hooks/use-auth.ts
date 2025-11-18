import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { useAPI } from "./use-api"
import { useMutation } from "./use-mutation"
import { API_ENDPOINTS } from "@/lib/constants"
import { apiClient } from "@/lib/api/client"
import {
  AuthLoginResponse,
  AuthSessionResponse,
  AuthMeResponse,
} from "@/types/api"

export function useAuth() {
  const router = useRouter()
  const [hasHydrated, setHasHydrated] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("auth-storage")
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.state) {
            return true
          }
        }
      } catch (e) {
        // Invalid storage
      }
    }
    return true
  })
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
    isAdmin,
    admin,
    setAuth,
    setUser,
    logout: clearAuth,
    setLoading,
  } = useAuthStore()

  const {
    data: sessionData,
    mutate: refetchSession,
    error: sessionError,
  } = useAPI<AuthSessionResponse>(
    hasHydrated && session && session.access_token
      ? API_ENDPOINTS.AUTH.SESSION
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onErrorRetry: () => {},
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  const {
    data: userData,
    mutate: refetchUser,
    error: userError,
  } = useAPI<AuthMeResponse>(
    hasHydrated && session && session.access_token
      ? API_ENDPOINTS.AUTH.ME
      : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onErrorRetry: () => {},
      errorRetryCount: 0,
      shouldRetryOnError: false,
    }
  )

  useEffect(() => {
    if (!session || !session.access_token) {
      return
    }

    const sessionIs401 =
      sessionError &&
      ((sessionError as any)?.response?.status === 401 ||
        (sessionError as any)?.status === 401)
    const userIs401 =
      userError &&
      ((userError as any)?.response?.status === 401 ||
        (userError as any)?.status === 401)

    if (sessionIs401 || userIs401) {
      clearAuth()
      router.push("/login")
    }
  }, [session, sessionError, userError, clearAuth, router])

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user as any, {
        isAdmin: userData.isAdmin,
        admin: userData.admin || null,
      })
    }
  }, [userData, setUser])

  useEffect(() => {
    if (sessionData) {
      setAuth(sessionData)
    }
  }, [sessionData, setAuth])

  const login = useCallback(async () => {
    setLoading(true)
    try {
      const frontendUrl =
        process.env.NEXT_PUBLIC_FRONTEND_URL ||
        (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")

      const response = await apiClient.get<{ url: string }>(
        API_ENDPOINTS.AUTH.LOGIN,
        {
          params: {
            redirectTo: `${frontendUrl}/callback`,
          },
        }
      )

      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        setLoading(false)
        throw new Error("No redirect URL in response")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setLoading(false)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to initiate login"
      throw new Error(errorMessage)
    }
  }, [setLoading])

  const { mutate: signOutMutation, isLoading: isSigningOut } = useMutation<{
    message: string
  }>("post", {
    onSuccess: () => {
      clearAuth()
      router.push("/login")
    },
    onError: () => {
      clearAuth()
      router.push("/login")
    },
  })

  const signOut = useCallback(() => {
    signOutMutation(API_ENDPOINTS.AUTH.SIGNOUT)
  }, [signOutMutation])

  const handleCallback = useCallback(
    async (code: string) => {
      setLoading(true)
      try {
        const response = await fetch(`/api/auth/callback?code=${code}`)

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }))
          setLoading(false)
          throw new Error(
            errorData.error || errorData.details || "Callback failed"
          )
        }

        const data: AuthLoginResponse = await response.json()
        setAuth(data)
        router.push("/dashboard")
      } catch (error) {
        console.error("OAuth callback error:", error)
        setLoading(false)
        router.push("/login?error=callback_failed")
      } finally {
        setLoading(false)
      }
    },
    [setAuth, setLoading, router]
  )

  return {
    user,
    session,
    isAuthenticated,
    isLoading: isLoading || isSigningOut,
    isAdmin,
    admin,
    login,
    signOut,
    handleCallback,
    refetchSession,
    refetchUser,
  }
}
