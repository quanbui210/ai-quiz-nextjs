"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle, Trophy, BookOpen, Loader2 } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"

interface QuizResult {
  id: string
  quiz: {
    id: string
    title: string
    difficulty: string
    type: string
    topic: {
      id: string
      name: string
    }
  }
  score: number
  correctCount: number
  totalQuestions: number
  timeSpent: number
  completedAt: string
  createdAt: string
  answers: Array<{
    questionId: string
    questionText: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    explanation: string | null
  }>
}

export default function QuizResultsPage() {
  const params = useParams()
  const router = useRouter()
  const quizId = params.id as string
  const [results, setResults] = useState<QuizResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) return

    const fetchResults = async () => {
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
        const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.RESULTS(quizId)}`

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`
        }

        console.log("Fetching results from:", backendUrl)

        const response = await fetch(backendUrl, {
          method: "GET",
          headers,
        })


        const responseText = await response.text()

        if (!response.ok) {
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: responseText || "Failed to get results" }
          }
          console.error("Results fetch error:", errorData)
          throw new Error(errorData.error || errorData.details || errorData.message || `Failed to get results (${response.status})`)
        }

        let responseData: { result?: QuizResult } | QuizResult | null
        try {
          responseData = JSON.parse(responseText)
        } catch (parseError) {
          console.error("Failed to parse results response:", parseError, "Response:", responseText)
          throw new Error("Invalid response format from server")
        }

        console.log("Parsed results data:", responseData)

        let data: QuizResult | null = null
        if (responseData) {
          if ((responseData as any).result) {
            data = (responseData as any).result
          } else if ((responseData as any).id) {
            // Direct result object
            data = responseData as QuizResult
          }
        }

        if (!data) {
          console.error("No result data found in response:", responseData)
          throw new Error("No quiz attempt found")
        }

        setResults(data)
      } catch (err) {
        console.error("Failed to fetch results:", err)
        setError(err instanceof Error ? err.message : "Failed to load results")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()
  }, [quizId])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error || !results) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Results not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const percentage = Math.round((results.correctCount / results.totalQuestions) * 100)
  const incorrectCount = results.totalQuestions - results.correctCount

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/topics/${results.quiz.topic.id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
            <p className="text-lg text-gray-600 mt-1">{results.quiz.title}</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-200">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Trophy className="h-16 w-16 text-yellow-500" />
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">{percentage}%</span>
              </div>
            </div>
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              {results.correctCount} out of {results.totalQuestions} correct
            </h2>
            <p className="text-gray-600">
              {results.correctCount} correct • {incorrectCount} incorrect
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Time spent: {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-white p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-green-600">{results.correctCount}</div>
            <div className="text-sm text-gray-600 mt-1">Correct</div>
          </div>
          <div className="rounded-lg bg-white p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
            <div className="text-sm text-gray-600 mt-1">Incorrect</div>
          </div>
          <div className="rounded-lg bg-white p-4 border border-gray-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{percentage}%</div>
            <div className="text-sm text-gray-600 mt-1">Score</div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Question Review</h2>
          </div>

          {results.answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={`rounded-lg p-6 border-2 ${
                answer.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      answer.isCorrect
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900">Question {index + 1}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-lg font-medium text-gray-900">{answer.questionText}</p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Answer:</p>
                  <div className="p-3 rounded-lg bg-white border-2 border-gray-300">
                    <p className="text-gray-900">{answer.userAnswer}</p>
                  </div>
                </div>

                {!answer.isCorrect && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">Correct Answer:</p>
                    <div className="p-3 rounded-lg bg-green-100 border-2 border-green-300">
                      <p className="text-green-900 font-medium">{answer.correctAnswer}</p>
                    </div>
                  </div>
                )}

                {answer.explanation && (
                  <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-1">Explanation:</p>
                    <p className="text-sm text-blue-800">{answer.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/topics")}>
              View Topics
            </Button>
            {/* <Button onClick={() => router.push(`/quizzes/${quizId}`)}>
              Retake Quiz
            </Button> */}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

