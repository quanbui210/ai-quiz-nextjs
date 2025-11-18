"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookOpen,
  Rocket,
  Loader2,
  Clock,
  Play,
  CheckCircle2,
  Trash2,
  MoreVertical,
  Zap,
  Edit2,
  Check,
  X,
  AlertCircle,
} from "lucide-react"
import { Topic, Quiz } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"
import { AnalyticsResponse } from "@/types/api"
import { QuizGenerationDialog } from "@/components/quiz/quiz-generation-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useMutation } from "@/hooks/use-mutation"
import { useAPI } from "@/hooks/use-api"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"

export default function TopicPage() {
  const params = useParams()
  const router = useRouter()
  const topicId = params.id as string
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    quizId: string
    quizTitle: string
  } | null>(null)
  const [isEditingTopic, setIsEditingTopic] = useState(false)
  const [editTopicName, setEditTopicName] = useState("")
  const [deleteTopicConfirm, setDeleteTopicConfirm] = useState(false)

  const {
    data: topicData,
    isLoading,
    error: topicError,
    mutate: refetchTopic,
  } = useAPI<Topic>(topicId ? API_ENDPOINTS.TOPIC.GET(topicId) : null)

  const topic = topicData || null
  const error = topicError ? (topicError as Error).message : null

  const { mutate: updateTopic, isLoading: isUpdatingTopic } =
    useMutation<Topic>("put", {
      onSuccess: () => {
        setIsEditingTopic(false)
        setEditTopicName("")
        refetchTopic()
      },
      onError: (error) => {
        alert(error.message || "Failed to update topic")
      },
    })

  const { mutate: deleteTopic, isLoading: isDeletingTopic } = useMutation(
    "delete",
    {
      onSuccess: () => {
        router.push("/topics")
      },
      onError: (error) => {
        alert(error.message || "Failed to delete topic")
      },
    }
  )

  const { data: quizzesData, isLoading: isLoadingQuizzesData } = useAPI<
    Quiz[] | { quizzes?: Quiz[] }
  >(topicId ? API_ENDPOINTS.QUIZ.LIST_BY_TOPIC(topicId) : null)

  const { data: analyticsData } = useAPI<
    | AnalyticsResponse
    | { analytics?: AnalyticsResponse; data?: AnalyticsResponse }
  >(API_ENDPOINTS.ANALYTICS.ME, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const { subscription, usage } = useSubscription()

  const analytics: AnalyticsResponse | null = analyticsData
    ? (analyticsData as any).analytics ||
      (analyticsData as any).data ||
      (analyticsData as AnalyticsResponse)
    : null

  const topicStats =
    analytics?.topics?.find((t) => t.topicId === topicId) || null

  useEffect(() => {
    if (quizzesData) {
      const quizzesList = Array.isArray(quizzesData)
        ? quizzesData
        : quizzesData.quizzes || []
      setQuizzes(quizzesList)
      setIsLoadingQuizzes(false)
    } else if (isLoadingQuizzesData) {
      setIsLoadingQuizzes(true)
    } else {
      setIsLoadingQuizzes(false)
    }
  }, [quizzesData, isLoadingQuizzesData])

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [openMenuId])

  const handleStartEditTopic = () => {
    if (topic) {
      setIsEditingTopic(true)
      setEditTopicName(topic.name)
    }
  }

  const handleCancelEditTopic = () => {
    setIsEditingTopic(false)
    setEditTopicName("")
  }

  const handleSaveEditTopic = () => {
    if (!topicId || !editTopicName.trim()) return
    updateTopic(API_ENDPOINTS.TOPIC.UPDATE(topicId), {
      name: editTopicName.trim(),
    })
  }

  const handleDeleteTopic = () => {
    setDeleteTopicConfirm(true)
  }

  const confirmDeleteTopic = () => {
    if (!topicId) return
    deleteTopic(API_ENDPOINTS.TOPIC.DELETE(topicId))
  }

  const { mutate: deleteQuiz, isLoading: isDeletingQuiz } = useMutation(
    "delete",
    {
      onSuccess: () => {
        if (deleteConfirm) {
          setQuizzes((prev) =>
            prev.filter((q) => q.id !== deleteConfirm.quizId)
          )
          setDeleteConfirm(null)
        }
      },
      onError: (error) => {
        alert(error.message || "Failed to delete quiz")
      },
    }
  )

  const handleDeleteQuiz = (quizId: string, quizTitle: string) => {
    setDeleteConfirm({
      open: true,
      quizId,
      quizTitle,
    })
    setOpenMenuId(null)
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    deleteQuiz(API_ENDPOINTS.QUIZ.DELETE(deleteConfirm.quizId))
  }
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
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
            <p className="mb-4 text-red-600">{error || "Topic not found"}</p>
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            {isEditingTopic ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editTopicName}
                  onChange={(e) => setEditTopicName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEditTopic()
                    } else if (e.key === "Escape") {
                      handleCancelEditTopic()
                    }
                  }}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-3xl font-bold text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleSaveEditTopic}
                  disabled={isUpdatingTopic || !editTopicName.trim()}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancelEditTopic}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {topic.name}
                  </h1>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleStartEditTopic}
                      title="Edit topic name"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDeleteTopic}
                      title="Delete topic"
                      disabled={isDeletingTopic}
                    >
                      {isDeletingTopic ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-600" />
                      )}
                    </Button>
                  </div>
                </div>
                {topic.description && (
                  <p className="mt-2 text-gray-600">{topic.description}</p>
                )}
              </>
            )}
          </div>
        </div>

        {/* Topic Content */}
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Topic Information
            </h2>
          </div>

          <div className="space-y-4">
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

            {topicStats && (
              <>
                <div className="border-t pt-4">
                  <p className="mb-3 text-sm font-medium text-gray-500">
                    Progress
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-medium text-gray-900">
                          {Math.round(topicStats.progressPercentage)}%
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${topicStats.progressPercentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Quizzes Completed</p>
                        <p className="font-semibold text-gray-900">
                          {topicStats.completedQuizzes} /{" "}
                          {topicStats.totalQuizzes}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Average Score</p>
                        <p className="font-semibold text-gray-900">
                          {Math.round(topicStats.averageScore)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Start Generate Quiz Section */}
          <div className="mt-8 border-t pt-6">
            <div className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <Zap className="h-5 w-5" />
                <p className="text-base font-medium">
                  Ready to test your knowledge?
                </p>
              </div>
              <p className="text-sm text-gray-500">
                Generate a personalized quiz based on this topic
              </p>
              {usage && subscription && (
                <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Quizzes: {usage.quizzesCount} /{" "}
                      {subscription.maxQuizzes || 0}
                    </span>
                    {usage.quizzesRemaining <= 0 && (
                      <span className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        Limit reached
                      </span>
                    )}
                  </div>
                </div>
              )}
              <Button
                size="lg"
                onClick={() => setIsQuizDialogOpen(true)}
                className="mt-4"
                disabled={usage && usage.quizzesRemaining <= 0}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Generate Quiz
              </Button>
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
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
            <div className="py-8 text-center text-gray-500">
              <p>No quizzes yet. Create your first quiz to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="relative rounded-lg border border-gray-200 p-4 transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <Link
                    href={`/quizzes/${quiz.id}`}
                    className="block space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="line-clamp-2 pr-8 font-semibold text-gray-900">
                        {quiz.title && quiz.title !== "Question 1"
                          ? quiz.title
                          : topic?.name
                            ? `${topic.name} - ${quiz.difficulty}`
                            : `Quiz - ${quiz.difficulty}`}
                      </h3>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        {quiz.status === "COMPLETED" && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenMenuId(
                                openMenuId === quiz.id ? null : quiz.id
                              )
                            }}
                            className="rounded-md p-1 transition-colors hover:bg-gray-100"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4 text-gray-600" />
                          </button>
                          {openMenuId === quiz.id && (
                            <div className="absolute right-0 top-8 z-10 w-32 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenMenuId(null)
                                  handleDeleteQuiz(quiz.id, quiz.title)
                                }}
                                disabled={isDeletingQuiz}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                              >
                                {isDeletingQuiz ? (
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
                      <span className="capitalize">
                        {quiz.difficulty.toLowerCase()}
                      </span>
                      <span>•</span>
                      <span>{quiz.count} questions</span>
                      {quiz.timer && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor(quiz.timer / 60)} min</span>
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
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            View Results
                          </>
                        ) : (
                          <>
                            <Play className="mr-1 h-4 w-4" />
                            {quiz.status === "PENDING"
                              ? "Continue Quiz"
                              : "Start"}
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

      {/* Delete Quiz Confirmation Dialog */}
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

      {/* Delete Topic Confirmation Dialog */}
      <ConfirmDialog
        open={deleteTopicConfirm}
        onOpenChange={setDeleteTopicConfirm}
        title="Delete Topic"
        description={`Are you sure you want to delete "${topic?.name}"? This action cannot be undone and will delete all associated quizzes.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteTopic}
        variant="destructive"
      />
    </MainLayout>
  )
}
