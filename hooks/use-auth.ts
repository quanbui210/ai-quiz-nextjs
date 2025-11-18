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

  const sessionEndpoint = hasHydrated && session && session.access_token
    ? API_ENDPOINTS.AUTH.SESSION
    : null

  useEffect(() => {
    if (sessionEndpoint) {
      console.log("Session endpoint enabled, will fetch:", sessionEndpoint)
    } else {
      console.log("Session endpoint disabled - hasHydrated:", hasHydrated, "hasSession:", !!session, "hasToken:", !!session?.access_token)
    }
  }, [sessionEndpoint])

  const {
    data: sessionData,
    mutate: refetchSession,
    error: sessionError,
    isLoading: isLoadingSession,
  } = useAPI<AuthSessionResponse>(
    sessionEndpoint,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onErrorRetry: () => {},
      errorRetryCount: 0,
      shouldRetryOnError: false,
      dedupingInterval: 5000,
      focusThrottleInterval: 5000,
    }
  )

  // Log session endpoint errors
  useEffect(() => {
    if (sessionError) {
      console.error("Session endpoint error:", sessionError)
      if ((sessionError as any)?.response) {
        console.error("Session error response:", (sessionError as any).response.status, (sessionError as any).response.data)
      }
    }
  }, [sessionError])

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
      console.log("Session data received from endpoint:", sessionData)
      // Validate session data structure
      if (!sessionData.user) {
        console.error("Session data missing user:", sessionData)
        return
      }
      if (!sessionData.session) {
        console.error("Session data missing session:", sessionData)
        return
      }
      if (!sessionData.session.access_token) {
        console.error("Session data missing access_token:", sessionData)
        return
      }
      
      // Check if this is different from current state
      const currentSession = session?.access_token
      const newSession = sessionData.session.access_token
      if (currentSession === newSession) {
        console.log("Session token unchanged, skipping update")
        return
      }
      
      console.log("Setting auth from session endpoint - user:", sessionData.user?.id, "session:", !!sessionData.session?.access_token)
      setAuth(sessionData)
      
      // Force a re-render and verify storage
      setTimeout(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("auth-storage") : null
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            const hasSession = parsed?.state?.session?.access_token
            const hasUser = parsed?.state?.user?.id
            const storedToken = parsed?.state?.session?.access_token
            console.log("Session endpoint - Verification - Stored session:", !!hasSession, "Stored user:", !!hasUser, "Token matches:", storedToken === newSession)
            if (!hasSession || !hasUser) {
              console.error("WARNING: Session endpoint data not properly stored!", parsed)
              // Try to manually set it again
              console.log("Attempting to manually store session data...")
              setAuth(sessionData)
            }
          } catch (e) {
            console.error("Failed to verify stored session data:", e)
          }
        } else {
          console.error("WARNING: No auth-storage found in localStorage after setAuth!")
        }
      }, 200)
    } else if (sessionEndpoint && !isLoadingSession && !sessionError) {
      // Session endpoint is enabled but no data yet
      console.log("Session endpoint enabled but no data received yet (loading:", isLoadingSession, "error:", !!sessionError, ")")
    }
  }, [sessionData, setAuth, session, sessionEndpoint, isLoadingSession, sessionError])

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
