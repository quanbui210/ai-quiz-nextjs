"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, BookOpen } from "lucide-react"
import { useAPI } from "@/hooks/use-api"
import { API_ENDPOINTS } from "@/lib/constants"
import { Topic } from "@/types/prisma"
import { apiClient } from "@/lib/api/client"
import { DocumentGenerateQuizResponse } from "@/types/api"

interface DocumentQuizGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentFilename: string
  onSuccess: (quizId: string) => void
}

type QuizType = "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"

interface QuizGenerationFormData {
  topicId: string
  title: string
  questionCount: number
  quizType: QuizType
  timer: number | null
  focus: string
}

export function DocumentQuizGenerationDialog({
  open,
  onOpenChange,
  documentId,
  documentFilename,
  onSuccess,
}: DocumentQuizGenerationDialogProps) {
  const [formData, setFormData] = useState<QuizGenerationFormData>({
    topicId: "",
    title: `${documentFilename} Quiz`,
    questionCount: 10,
    quizType: "MULTIPLE_CHOICE",
    timer: null,
    focus: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: topicsData, isLoading: isLoadingTopics } = useAPI<
    { topics?: Topic[] } | Topic[]
  >(open ? API_ENDPOINTS.TOPIC.LIST : null)

  const topics = topicsData
    ? Array.isArray(topicsData)
      ? topicsData
      : topicsData.topics || []
    : []

  useEffect(() => {
    if (open) {
      setFormData({
        topicId: "",
        title: `${documentFilename} Quiz`,
        questionCount: 10,
        quizType: "MULTIPLE_CHOICE",
        timer: null,
        focus: "",
      })
      setErrors({})
    }
  }, [open, documentFilename])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.questionCount < 1 || formData.questionCount > 50) {
      newErrors.questionCount = "Question count must be between 1 and 50"
    }

    if (formData.timer !== null && formData.timer < 0) {
      newErrors.timer = "Timer must be positive"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsGenerating(true)

    try {
      const payload = {
        topicId: formData.topicId || undefined,
        title: formData.title || undefined,
        questionCount: formData.questionCount,
        quizType: formData.quizType,
        timer: formData.timer ? formData.timer * 60 : null,
        focus: formData.focus || undefined,
      }

      const response = await apiClient.post<DocumentGenerateQuizResponse>(
        API_ENDPOINTS.DOCUMENT.GENERATE_QUIZ(documentId),
        payload
      )

      if (response.data?.quiz) {
        onSuccess(response.data.quiz.id)
        onOpenChange(false)
      } else {
        throw new Error("Quiz generation failed - no quiz returned")
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        "Failed to generate quiz"
      setErrors({ submit: errorMessage })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            Generate Quiz from Document
          </DialogTitle>
          <DialogDescription>
            Configure your quiz settings. The quiz will be generated from "
            {documentFilename}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Topic Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="topicId" className="text-xs font-medium text-gray-700">
              Topic (Optional)
            </Label>
            {isLoadingTopics ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading topics...
              </div>
            ) : (
              <select
                id="topicId"
                value={formData.topicId}
                onChange={(e) =>
                  setFormData({ ...formData, topicId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="">No topic (standalone quiz)</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500">
              Optionally attach this quiz to a topic. Leave empty for a
              standalone document quiz.
            </p>
            {errors.topicId && (
              <p className="text-sm text-red-600">{errors.topicId}</p>
            )}
          </div>

          {/* Quiz Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium text-gray-700">
              Quiz Title
            </Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={`${documentFilename} Quiz`}
              className="h-9"
            />
          </div>

          {/* Quiz Type */}
          <div className="space-y-1.5">
            <Label htmlFor="quizType" className="text-xs font-medium text-gray-700">
              Quiz Type
            </Label>
            <select
              id="quizType"
              value={formData.quizType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quizType: e.target.value as QuizType,
                })
              }
              className="flex h-9 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="MULTIPLE_CHOICE">Multiple Choice</option>
              <option value="TRUE_FALSE">True/False</option>
              <option value="SHORT_ANSWER">Short Answer</option>
            </select>
          </div>

          {/* Number of Questions and Timer - Same line */}
          <div className="grid grid-cols-2 gap-3">
            {/* Number of Questions */}
            <div className="space-y-1.5">
              <Label
                htmlFor="questionCount"
                className="text-xs font-medium text-gray-700"
              >
                Number of Questions
              </Label>
              <Input
                id="questionCount"
                type="number"
                min="1"
                max="50"
                value={formData.questionCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    questionCount: parseInt(e.target.value) || 10,
                  })
                }
                className="h-9"
              />
              {errors.questionCount && (
                <p className="text-sm text-red-600">{errors.questionCount}</p>
              )}
            </div>

            {/* Timer */}
            <div className="space-y-1.5">
              <Label htmlFor="timer" className="text-xs font-medium text-gray-700">
                Timer (minutes)
              </Label>
              <Input
                id="timer"
                type="number"
                min="0"
                value={formData.timer || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    timer: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                placeholder="No timer"
                className="h-9"
              />
              {errors.timer && (
                <p className="text-sm text-red-600">{errors.timer}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Leave timer empty for no time limit
          </p>

          {/* Focus Area */}
          <div className="space-y-1.5">
            <Label htmlFor="focus" className="text-xs font-medium text-gray-700">
              Focus Area (Optional)
            </Label>
            <textarea
              id="focus"
              value={formData.focus}
              onChange={(e) =>
                setFormData({ ...formData, focus: e.target.value })
              }
              placeholder="e.g., Chapter 3 concepts, Section 2: Introduction, pages 45-60"
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Specify a section, chapter, or topic to focus on. Leave empty to
              generate questions from the entire document.
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
