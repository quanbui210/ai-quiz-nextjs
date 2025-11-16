"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  BookOpen,
} from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"
import { useAPI } from "@/hooks/use-api"

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

  const { data: resultsData, isLoading, error: resultsError } = useAPI<
    { result?: QuizResult } | QuizResult
  >(quizId ? API_ENDPOINTS.QUIZ.RESULTS(quizId) : null)

  useEffect(() => {
    if (!resultsData) {
      setResults(null)
      return
    }

    console.log("Results raw data:", resultsData)

    let data: QuizResult | null = null
    if ((resultsData as any).result) {
      data = (resultsData as any).result
    } else if ((resultsData as any).id) {
      data = resultsData as QuizResult
    } else if ((resultsData as any).data) {
      data = (resultsData as any).data
    }

    console.log("Results parsed:", data)
    setResults(data)
  }, [resultsData])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading results...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (resultsError || !results) {
    const errorMessage =
      resultsError?.message ||
      (resultsError as any)?.error ||
      "Results not found"
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">{errorMessage}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const percentage = Math.round(
    (results.correctCount / results.totalQuestions) * 100
  )
  const incorrectCount = results.totalQuestions - results.correctCount

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/topics/${results.quiz.topic.id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
            <p className="mt-1 text-lg text-gray-600">{results.quiz.title}</p>
          </div>
        </div>

        {/* Score Card */}
        <div className="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
          <div className="mb-6 flex items-center justify-center">
            <div className="relative">
              <Trophy className="h-16 w-16 text-yellow-500" />
              <div className="absolute -bottom-2 -right-2 rounded-full bg-white p-2 shadow-lg">
                <span className="text-2xl font-bold text-blue-600">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {results.correctCount} out of {results.totalQuestions} correct
            </h2>
            <p className="text-gray-600">
              {results.correctCount} correct • {incorrectCount} incorrect
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Time spent: {Math.floor(results.timeSpent / 60)}m{" "}
              {results.timeSpent % 60}s
            </p>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {results.correctCount}
            </div>
            <div className="mt-1 text-sm text-gray-600">Correct</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {incorrectCount}
            </div>
            <div className="mt-1 text-sm text-gray-600">Incorrect</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {percentage}%
            </div>
            <div className="mt-1 text-sm text-gray-600">Score</div>
          </div>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Question Review
            </h2>
          </div>

          {results.answers.map((answer, index) => (
            <div
              key={answer.questionId}
              className={`rounded-lg border-2 p-6 ${
                answer.isCorrect
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
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
                  <span className="font-semibold text-gray-900">
                    Question {index + 1}
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-lg font-medium text-gray-900">
                  {answer.questionText}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">
                    Your Answer:
                  </p>
                  <div className="rounded-lg border-2 border-gray-300 bg-white p-3">
                    <p className="text-gray-900">{answer.userAnswer}</p>
                  </div>
                </div>

                {!answer.isCorrect && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-green-700">
                      Correct Answer:
                    </p>
                    <div className="rounded-lg border-2 border-green-300 bg-green-100 p-3">
                      <p className="font-medium text-green-900">
                        {answer.correctAnswer}
                      </p>
                    </div>
                  </div>
                )}

                {answer.explanation && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="mb-1 text-sm font-medium text-blue-900">
                      Explanation:
                    </p>
                    <p className="text-sm text-blue-800">
                      {answer.explanation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-6">
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
