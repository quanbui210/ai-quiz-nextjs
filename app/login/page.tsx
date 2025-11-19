"use client"

import { Suspense, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useAuthStore } from "@/stores/use-auth-store"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import {
  Chrome,
  BookOpen,
  Zap,
  TrendingUp,
  Brain,
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

function LoginPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { login, handleCallback, isAuthenticated, isLoading, isAdmin } =
    useAuth()
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
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
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
      description:
        "Get instant help and explanations from your AI learning assistant",
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
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-gray-50">
      <div className="relative z-10">
        <section className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="text-center lg:text-left">
                <div className="mb-6 inline-flex items-center justify-center lg:justify-start">
                  <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white border-2 border-gray-200 p-2 shadow-md">
                    <Image
                      src="/icons/icon.svg"
                      alt="QuizzAI Logo"
                      width={64}
                      height={64}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
                <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
                  Master Any Topic with
                  <span className="block">
                    <span className="bg-gradient-to-r from-blue-700 to-blue-400 bg-clip-text text-transparent">AI-Powered</span>{" "}
                    <span className="text-gray-900">Quizzes</span>
                  </span>
                </h1>
                <p className="mx-auto mb-8 max-w-2xl text-xl text-gray-600 lg:mx-0">
                  Transform your learning experience with personalized quizzes,
                  instant feedback, and detailed progress tracking. Start your
                  journey to mastery today.
                </p>

                <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg lg:mx-0">
                  <p className="mb-4 text-sm font-medium text-gray-700">
                    Get started in seconds
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full bg-gray-900 text-white shadow-lg transition-all duration-200 hover:bg-gray-800 hover:shadow-xl"
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
                      className="rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-blue-200"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-700">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="mb-2 font-semibold text-gray-900">
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

        <section className="bg-gradient-to-br from-white via-blue-50/30 to-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                Everything you need to excel
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Powerful features designed to accelerate your learning journey
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:border-blue-300"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-700">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-gray-50 via-white to-blue-50/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">
                Real stories from real learners
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                See how QuizzAI is transforming lives and opening new
                opportunities
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {userStories.map((story) => {
                const IconComponent = iconMap[story.icon] || BookOpen
                return (
                  <div
                    key={story.id}
                    className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg transition-all duration-300 hover:shadow-xl"
                  >
                    <div
                      className={`h-80 bg-gradient-to-br ${story.gradient} relative flex items-center justify-center overflow-hidden`}
                    >
                      <img
                        src={story.image}
                        alt={story.imageAlt}
                        className="h-full w-full object-contain"
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
                      <div className="mb-3 flex items-center gap-2"></div>
                      <p className="text-sm leading-relaxed text-gray-700">
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
        <section className="bg-gradient-to-br from-blue-50/50 via-white to-gray-50 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-12 text-center shadow-2xl">
              <h2 className="mb-4 text-4xl font-bold text-white">
                Ready to start learning?
              </h2>
              <p className="mb-8 text-xl text-blue-100">
                Join thousands of learners already using QuizzAI
              </p>
              <Button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="bg-white text-blue-600 shadow-lg transition-all duration-200 hover:bg-gray-50 hover:shadow-xl"
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
