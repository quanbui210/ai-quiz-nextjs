"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Plus, Loader2 } from "lucide-react"
import { Topic } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"

export default function TopicsPage() {
  const router = useRouter()
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTopics = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const authData = localStorage.getItem("auth-storage")
        let authToken: string | null = null
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            authToken = parsed?.state?.session?.access_token || null
          } catch {
            // Ignore parse errors
          }
        }

        const apiUrl = "http://localhost:3001"
        const backendUrl = `${apiUrl}${API_ENDPOINTS.TOPIC.LIST}`

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch(backendUrl, {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to get topics",
          }))
          throw new Error(errorData.error || errorData.details || `Failed to get topics (${response.status})`)
        }

        const data = await response.json()
        setTopics(data.topics || data || [])
      } catch (err) {
        console.error("Failed to fetch topics:", err)
        setError(err instanceof Error ? err.message : "Failed to load topics")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopics()
  }, [])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading topics...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Topics</h1>
              <p className="mt-1 text-gray-600">
                Browse and manage your learning topics
              </p>
            </div>
          </div>
          <Button size="lg" onClick={() => router.push("/topics/new")}>
            <Plus className="mr-2 h-5 w-5" />
            New Topic
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Topics List */}
        {topics.length === 0 && !error ? (
          <div className="rounded-lg bg-white p-12 shadow-sm text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No topics yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first topic to start learning!
            </p>
            <Button onClick={() => router.push("/topics/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Create Topic
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => router.push(`/topics/${topic.id}`)}
                className="rounded-lg bg-white p-6 shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-500">
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {topic.name}
                </h3>
                {topic.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {topic.description}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

