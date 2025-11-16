import { useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/use-auth-store"
import { useAPI } from "./use-api"
import { useMutation } from "./use-mutation"
import { API_ENDPOINTS } from "@/lib/constants"
import {
  AuthLoginResponse,
  AuthSessionResponse,
  AuthMeResponse,
} from "@/types/api"

export function useAuth() {
  const router = useRouter()
  const {
    user,
    session,
    isAuthenticated,
    isLoading,
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
    isAuthenticated ? API_ENDPOINTS.AUTH.SESSION : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onErrorRetry: () => {},
      errorRetryCount: 0,
    }
  )

  const {
    data: userData,
    mutate: refetchUser,
    error: userError,
  } = useAPI<AuthMeResponse>(isAuthenticated ? API_ENDPOINTS.AUTH.ME : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onErrorRetry: () => {},
    errorRetryCount: 0,
  })

  useEffect(() => {
    const sessionIs401 =
      sessionError && (sessionError as any)?.response?.status === 401
    const userIs401 = userError && (userError as any)?.response?.status === 401

    if (sessionIs401 || userIs401) {
      clearAuth()
      router.push("/login")
    }
  }, [sessionError, userError, clearAuth, router])

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user as any)
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
      const loginUrl = "/api/auth/login"

      const response = await fetch(loginUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }))
        console.error("Login response error:", response.status, errorData)
        setLoading(false)
        throw new Error(
          `Failed to initiate login: ${response.status} ${errorData.error || errorData.details || "Unknown error"}`
        )
      }

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setLoading(false)
        throw new Error("No redirect URL in response")
      }
    } catch (error) {
      console.error("Login error:", error)
      setLoading(false)
      throw error // Re-throw so the caller can handle it
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
    login,
    signOut,
    handleCallback,
    refetchSession,
    refetchUser,
  }
}
