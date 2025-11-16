"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (hasRedirectedRef.current) {
      return
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("auth-storage")
        if (stored) {
          const parsed = JSON.parse(stored)
          const storedIsAdmin = parsed?.state?.isAdmin
          const storedIsAuthenticated = parsed?.state?.isAuthenticated
          
          if (storedIsAuthenticated && storedIsAdmin && !isAuthenticated) {
            // Wait a bit for API to catch up
            return
          }
        }
      } catch (e) {
      }
    }

    hasRedirectedRef.current = true
    
    if (!isAuthenticated) {
      router.push("/admin/login")
    } else if (isAdmin === false) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></Loader2>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }


  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in. Redirecting...</p>
        </div>
      </div>
    )
  }


  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

