"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, CheckCircle2, Loader2 } from "lucide-react"
import { Quiz, Question } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"

interface QuizResponse {
  id: string
  title: string
  count: number
  createdAt: string
  difficulty: string
  status: string
  timer: number
  type: string
  questions: Array<{
    id: string
    text: string
    type: string
    options: string[]
  }>
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  useEffect(() => {
    if (!quizId) return

    const fetchQuiz = async () => {
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

        const apiUrl = "http://localhost:3001"
        const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.GET(quizId)}`

        console.log("Fetching quiz from:", backendUrl)
        console.log("Auth token present:", !!authToken)

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

        console.log("Quiz response status:", response.status)

        // Read response once
        const responseText = await response.text()
        
        if (!response.ok) {
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: responseText || "Failed to get quiz" }
          }
          console.error("Quiz fetch error:", errorData)
          throw new Error(errorData.error || errorData.details || errorData.message || `Failed to get quiz (${response.status})`)
        }

        let responseData: { quiz?: QuizResponse } | QuizResponse
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse quiz response:", parseError)
          throw new Error("Invalid response format from server")
        }
        
        const data: QuizResponse = (responseData as any).quiz || responseData as QuizResponse
        

        if (data.status === "COMPLETED") {
          setIsLoading(false)
          router.push(`/quizzes/${quizId}/results`)
          return
        }
        console.log("data", data)
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          console.warn("Quiz has no questions:", data)
          setError("This quiz has no questions available. Please try again later.")
          return
        }
        
        setQuiz(data)
        
        if (data.timer) {
          setTimeRemaining(data.timer)
        }
      } catch (err) {
        console.error("Failed to fetch quiz:", err)
        setError(err instanceof Error ? err.message : "Failed to load quiz")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuiz()
  }, [quizId, router])

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining])

  useEffect(() => {
    if (timeRemaining === 0 && quiz && !isSubmitting) {
      handleSubmit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemaining])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleSubmit = async () => {
    if (!quiz) return

    setIsSubmitting(true)

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
      const backendUrl = `${apiUrl}/api/v1/quiz/${quizId}/submit`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }))

      const response = await fetch(backendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          answers: answersArray,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to submit quiz",
        }))
        throw new Error(errorData.error || errorData.details || "Failed to submit quiz")
      }

      const data = await response.json()
      router.push(`/quizzes/${quizId}/results`)
    } catch (err) {
      console.error("Failed to submit quiz:", err)
      setError(err instanceof Error ? err.message : "Failed to submit quiz")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !quiz) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Quiz not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Safety check for questions - this should not happen if we check in fetchQuiz, but keep as fallback
  if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">This quiz has no questions available.</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Ensure currentQuestionIndex is within bounds
  const safeQuestionIndex = Math.max(0, Math.min(currentQuestionIndex, quiz.questions.length - 1))
  const currentQuestion = quiz.questions[safeQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions.length

  // Update currentQuestionIndex if it was out of bounds
  if (currentQuestionIndex !== safeQuestionIndex) {
    setCurrentQuestionIndex(safeQuestionIndex)
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {quiz.difficulty} • {quiz.type.replace("_", " ")}
              </p>
            </div>
          </div>

          {/* Timer */}
          {timeRemaining !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold text-blue-900">
                {formatTime(timeRemaining)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Question {safeQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-gray-600">
              {answeredCount} / {totalQuestions} answered
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((safeQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {currentQuestion.text}
              </h2>
              <p className="text-sm text-gray-500">
                Select your answer below
              </p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === option
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                disabled={currentQuestionIndex >= totalQuestions - 1}
              >
                Next Question
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || answeredCount < totalQuestions}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Quiz"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Question Navigation Dots */}
        <div className="flex flex-wrap gap-2 justify-center">
          {quiz.questions.map((q, index) => {
            const isAnswered = answers[q.id]
            const isCurrent = index === safeQuestionIndex
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  isCurrent
                    ? "border-blue-500 bg-blue-500 text-white"
                    : isAnswered
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {index + 1}
              </button>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}

