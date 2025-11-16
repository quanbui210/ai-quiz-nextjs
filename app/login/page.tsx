"use client"

import { useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useAuthStore } from "@/stores/use-auth-store"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"
import {
  Chrome,
  BookOpen,
  Zap,
  TrendingUp,
  Brain,
  Sparkles,
  ArrowRight,
  MessageSquare,
  FileText,
} from "lucide-react"
import userStories from "@/lib/data/user-stories.json"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Brain,
  Zap,
  TrendingUp,
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login, handleCallback, isAuthenticated, isLoading, isAdmin } = useAuth()
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    const code = searchParams.get("code")
    const error = searchParams.get("error")

    if (error) {
      console.error("OAuth error:", error)
      setLoading(false)
    } else if (code) {
      handleCallback(code)
    } else {
    
      if (isLoading && !isAuthenticated) {
        const timer = setTimeout(() => {
         
          if (window.location.pathname === "/login") {
            setLoading(false)
          }
        }, 2000) 
        return () => clearTimeout(timer)
      }
    }
  }, [searchParams, handleCallback, isLoading, isAuthenticated, setLoading])

  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      if (isAdmin) {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleGoogleLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    try {
      await login()
    } catch (error) {
      console.error("Login handler error:", error)
      alert("Failed to initiate login. Please check the console for details.")
    }
  }

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Learning",
      description: "Personalized quizzes tailored to your learning style",
    },
    {
      icon: MessageSquare,
      title: "AI Tutor",
      description: "Get instant help and explanations from your AI learning assistant",
    },
    {
      icon: FileText,
      title: "Quiz from Document",
      description: "Upload any document and generate quizzes automatically",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your improvement with detailed analytics",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center lg:justify-start mb-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                  Master Any Topic with
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    AI-Powered Quizzes
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                  Transform your learning experience with personalized quizzes,
                  instant feedback, and detailed progress tracking. Start your
                  journey to mastery today.
                </p>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto lg:mx-0">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Get started in seconds
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      size="lg"
                    >
                      <Chrome className="mr-2 h-5 w-5" />
                      {isLoading ? "Signing in..." : "Sign in with Google"}
                    </Button>
                 
                  
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="bg-white/60 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-white/50">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Everything you need to excel
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Powerful features designed to accelerate your learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Real stories from real learners
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                See how Quizzly is transforming lives and opening new opportunities
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {userStories.map((story) => {
                const IconComponent = iconMap[story.icon] || BookOpen
                return (
                  <div
                    key={story.id}
                    className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                  >
                    <div
                      className={`h-80 bg-gradient-to-br ${story.gradient} overflow-hidden relative flex items-center justify-center`}
                    >
                      <img
                        src={story.image}
                        alt={story.imageAlt}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const placeholder = target.parentElement
                          if (placeholder) {
                            placeholder.innerHTML = `
                              <div class="w-full h-full flex items-center justify-center">
                                <div class="text-center">
                                  <div class="w-24 h-24 bg-white/80 rounded-full mx-auto mb-2 flex items-center justify-center">
                                    <svg class="h-12 w-12 ${story.iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <p class="text-xs text-gray-500">Image placeholder</p>
                                </div>
                              </div>
                            `
                          }
                        }}
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                   
                       
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        "{story.story}"
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center shadow-2xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to start learning?
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Join thousands of learners already using Quizzly
              </p>
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-white text-blue-600 hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all duration-200"
                size="lg"
              >
                <Chrome className="mr-2 h-5 w-5" />
                {isLoading ? "Signing in..." : "Get Started Free"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
