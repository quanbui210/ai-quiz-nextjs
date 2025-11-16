"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  MoreVertical,
  Check,
  X,
} from "lucide-react"
import { Topic } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"
import { useMutation } from "@/hooks/use-mutation"
import { useAPI } from "@/hooks/use-api"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import Link from "next/link"

export default function TopicsPage() {
  const router = useRouter()
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    topicId: string
    topicName: string
  } | null>(null)

  const { data: topicsData, isLoading, error: topicsError, mutate: refetchTopics } = useAPI<{ topics?: Topic[] } | Topic[]>(
    API_ENDPOINTS.TOPIC.LIST
  )

  const topics = topicsData
    ? Array.isArray(topicsData)
      ? topicsData
      : topicsData.topics || []
    : []
  const error = topicsError ? (topicsError as Error).message : null

  const { mutate: updateTopic, isLoading: isUpdating } = useMutation<Topic>(
    "put",
    {
      onSuccess: () => {
        setEditingTopicId(null)
        setEditName("")
        refetchTopics()
      },
      onError: (error) => {
        alert(error.message || "Failed to update topic")
      },
    }
  )

  const { mutate: deleteTopic, isLoading: isDeleting } = useMutation(
    "delete",
    {
      onSuccess: () => {
        if (deleteConfirm) {
          setDeleteConfirm(null)
          refetchTopics()
        }
      },
      onError: (error) => {
        alert(error.message || "Failed to delete topic")
      },
    }
  )

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null)
    }
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [openMenuId])

  const handleStartEdit = (topic: Topic) => {
    setEditingTopicId(topic.id)
    setEditName(topic.name)
    setOpenMenuId(null)
  }

  const handleCancelEdit = () => {
    setEditingTopicId(null)
    setEditName("")
  }

  const handleSaveEdit = () => {
    if (!editingTopicId || !editName.trim()) return
    updateTopic(API_ENDPOINTS.TOPIC.UPDATE(editingTopicId), {
      name: editName.trim(),
    })
  }

  const handleDelete = (topicId: string, topicName: string) => {
    setDeleteConfirm({
      open: true,
      topicId,
      topicName,
    })
    setOpenMenuId(null)
  }

  const confirmDelete = () => {
    if (!deleteConfirm) return
    deleteTopic(API_ENDPOINTS.TOPIC.DELETE(deleteConfirm.topicId))
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading topics...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-6">
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Topics List */}
        {topics.length === 0 && !error ? (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No topics yet
            </h3>
            <p className="mb-6 text-gray-600">
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
              <div
                key={topic.id}
                className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md"
              >
                <Link
                  href={`/topics/${topic.id}`}
                  className="block space-y-3"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <BookOpen className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(topic.createdAt).toLocaleDateString()}
                      </span>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenMenuId(
                              openMenuId === topic.id ? null : topic.id
                            )
                          }}
                          className="rounded-md p-1 transition-colors hover:bg-gray-100"
                          title="More options"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-600" />
                        </button>
                        {openMenuId === topic.id && (
                          <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleStartEdit(topic)
                              }}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDelete(topic.id, topic.name)
                              }}
                              disabled={isDeleting}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {editingTopicId === topic.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSaveEdit()
                          } else if (e.key === "Escape") {
                            handleCancelEdit()
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleSaveEdit()
                          }}
                          disabled={isUpdating || !editName.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleCancelEdit()
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
                        {topic.name}
                      </h3>
                      {topic.description && (
                        <p className="line-clamp-2 text-sm text-gray-600">
                          {topic.description}
                        </p>
                      )}
                    </>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm?.open || false}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirm(null)
          }
        }}
        title="Delete Topic"
        description={`Are you sure you want to delete "${deleteConfirm?.topicName}"? This action cannot be undone and will delete all associated quizzes.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </MainLayout>
  )
}
