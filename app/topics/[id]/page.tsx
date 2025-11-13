"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Rocket, Loader2, Clock, Play, CheckCircle2, Trash2, MoreVertical, Zap } from "lucide-react"
import { Topic, Quiz } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"
import { QuizGenerationDialog } from "@/components/quiz/quiz-generation-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Link from "next/link"

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string
  const [topic, setTopic] = useState<Topic | null>(null)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    quizId: string
    quizTitle: string
  } | null>(null)
  useEffect(() => {
    if (!topicId) return
    const fetchTopic = async () => {
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
          }
        }

        const apiUrl =  "http://localhost:3001"
        const backendUrl = `${apiUrl}${API_ENDPOINTS.TOPIC.GET(topicId)}`

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
        console.log("response", response)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to get topic",
          }))
          console.error("Topic fetch error:", response.status, errorData)
          throw new Error(errorData.error || errorData.details || `Failed to get topic (${response.status})`)
        }

        const data = await response.json()
        setTopic(data)
      } catch (err) {
        console.error("Failed to fetch topic:", err)
        setError(err instanceof Error ? err.message : "Failed to load topic")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTopic()
  }, [topicId])

  useEffect(() => {
    if (!topicId) return

    const fetchQuizzes = async () => {
      setIsLoadingQuizzes(true)

      try {
        const authData = localStorage.getItem("auth-storage")
        let authToken: string | null = null
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            authToken = parsed?.state?.session?.access_token || null
          } catch {
          }
        }

        const apiUrl = "http://localhost:3001"
        const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.LIST_BY_TOPIC(topicId)}`

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
            error: "Failed to get quizzes",
          }))
          console.error("Quizzes fetch error:", response.status, errorData)
          return
        }

        const data = await response.json()
        const quizzesList = Array.isArray(data) ? data : data.quizzes || []
        setQuizzes(quizzesList)
      } catch (err) {
        console.error("Failed to fetch quizzes:", err)
      } finally {
        setIsLoadingQuizzes(false)
      }
    }

    fetchQuizzes()
  }, [topicId])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [openMenuId])

  const handleDeleteQuiz = (quizId: string, quizTitle: string) => {
    setDeleteConfirm({
      open: true,
      quizId,
      quizTitle,
    })
    setOpenMenuId(null)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return

    const { quizId, quizTitle } = deleteConfirm
    setDeletingQuizId(quizId)

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
      const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.DELETE(quizId)}`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(backendUrl, {
        method: "DELETE",
        headers,
      })

      if (!response.ok) {
        const responseText = await response.text()
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || "Failed to delete quiz" }
        }
        throw new Error(errorData.error || errorData.details || errorData.message || "Failed to delete quiz")
      }

      // Remove quiz from local state
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId))
    } catch (err) {
      console.error("Failed to delete quiz:", err)
      alert(err instanceof Error ? err.message : "Failed to delete quiz")
    } finally {
      setDeletingQuizId(null)
      setDeleteConfirm(null)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading topic...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || (!isLoading && !topic)) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error || "Topic not found"}
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!topic) {
    return null
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
            {topic.description && (
              <p className="mt-2 text-gray-600">{topic.description}</p>
            )}
          </div>
        </div>

        {/* Topic Content */}
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Topic Information
            </h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">Created</p>
              <p className="text-sm text-gray-900">
                {new Date(topic.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Start Generate Quiz Section */}
          <div className="mt-8 pt-6 border-t">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Zap className="h-5 w-5" />
                <p className="text-base font-medium">
                  Ready to test your knowledge?
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Generate a personalized quiz based on this topic
              </p>
              <Button
                size="lg"
                onClick={() => setIsQuizDialogOpen(true)}
                className="mt-4"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Generate Quiz
              </Button>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Quizzes ({quizzes.length})
              </h2>
            </div>
          </div>

          {isLoadingQuizzes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No quizzes yet. Create your first quiz to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="relative p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="block space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 line-clamp-2 pr-8">
                        {quiz.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {quiz.status === "COMPLETED" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === quiz.id ? null : quiz.id)
                            }}
                            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          {openMenuId === quiz.id && (
                            <div className="absolute right-0 top-8 z-10 w-32 rounded-md bg-white shadow-lg border border-gray-200 py-1">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  handleDeleteQuiz(quiz.id, quiz.title)
                                }}
                                disabled={deletingQuizId === quiz.id}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                              >
                                {deletingQuizId === quiz.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="capitalize">{quiz.difficulty.toLowerCase()}</span>
                      <span>•</span>
                      <span>{quiz.count} questions</span>
                      {quiz.timer && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor(quiz.timer / 60000)} min</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(quiz.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.preventDefault()
                          if (quiz.status === "COMPLETED") {
                            router.push(`/quizzes/${quiz.id}/results`)
                          } else {
                            router.push(`/quizzes/${quiz.id}`)
                          }
                        }}
                      >
                        {quiz.status === "COMPLETED" ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            View Results
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            {quiz.status === "PENDING" ? "Continue Quiz" : "Start"}
                          </>
                        )}
                      </Button>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quiz Generation Dialog */}
      {topic && (
        <QuizGenerationDialog
          open={isQuizDialogOpen}
          onOpenChange={setIsQuizDialogOpen}
          topicName={topic.name}
          topicId={topic.id}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm?.open || false}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null)
          }
        }}
        title="Delete Quiz"
        description={`Are you sure you want to delete "${deleteConfirm?.quizTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </MainLayout>
  )
}

