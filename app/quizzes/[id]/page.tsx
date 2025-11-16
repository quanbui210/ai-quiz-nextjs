"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Clock, CheckCircle2, Loader2, Pause, Play, CheckCircle, AlertCircle } from "lucide-react"
import { Quiz, Question } from "@/types/prisma"
import { API_ENDPOINTS } from "@/lib/constants"
import { useAuth } from "@/hooks/use-auth"
import { useAPI } from "@/hooks/use-api"
import { useMutation } from "@/hooks/use-mutation"

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

interface ResumeResponse {
  attemptId: string
  status: string
  elapsedTime: number
  questions: Array<{
    id: string
    text: string
    type: string
    options: string[]
    savedAnswer?: string | null
  }>
}

interface PauseResponse {
  attemptId: string
  status: string
  elapsedTime: number
  answeredQuestions: number
  totalQuestions: number
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const quizId = params.id as string
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [initialTimer, setInitialTimer] = useState<number | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isCheckingResume, setIsCheckingResume] = useState(true)
  const [pauseSuccessDialog, setPauseSuccessDialog] = useState(false)
  const [pauseSuccessData, setPauseSuccessData] = useState<{ answered: number; total: number } | null>(null)
  const [errorDialog, setErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  const { data: quizData, isLoading, error: quizError } = useAPI<{ quiz?: QuizResponse } | QuizResponse>(
    quizId ? API_ENDPOINTS.QUIZ.GET(quizId) : null
  )

  const quiz: QuizResponse | null = quizData
    ? (quizData as any).quiz || (quizData as QuizResponse)
    : null
  const error = quizError ? (quizError as Error).message : null

  const { mutate: pauseQuiz, isLoading: isPausing } = useMutation<PauseResponse>("post", {
    onSuccess: (data) => {
      setIsPaused(true)
      setAttemptId(data.attemptId)
      setPauseSuccessData({
        answered: data.answeredQuestions,
        total: data.totalQuestions,
      })
      setPauseSuccessDialog(true)
    },
    onError: (error) => {
      setErrorMessage(error.message || "Failed to pause quiz")
      setErrorDialog(true)
    },
  })

  const { data: resumeData, isLoading: isLoadingResume, error: resumeError } = useAPI<ResumeResponse>(
    quizId && isCheckingResume ? API_ENDPOINTS.QUIZ.RESUME(quizId) : null
  )

  const handleResume = useCallback(() => {
    if (!resumeData) return

    setAttemptId(resumeData.attemptId)
    setIsPaused(false)
    setIsCheckingResume(false)

    const savedAnswers: Record<string, string> = {}
    resumeData.questions.forEach((q) => {
      if (q.savedAnswer) {
        savedAnswers[q.id] = q.savedAnswer
      }
    })
    setAnswers(savedAnswers)

    if (quiz && quiz.timer && resumeData.elapsedTime) {
      const remainingTime = quiz.timer - resumeData.elapsedTime * 1000
      setInitialTimer(quiz.timer)
      setTimeRemaining(Math.max(0, remainingTime))
    } else if (quiz && quiz.timer) {
      setInitialTimer(quiz.timer)
      setTimeRemaining(quiz.timer)
    }
  }, [resumeData, quiz])

  useEffect(() => {
    if (resumeError && isCheckingResume) {
      setIsCheckingResume(false)
      if (quiz && quiz.timer) {
        setInitialTimer(quiz.timer)
        setTimeRemaining(quiz.timer)
      }
    }
  }, [resumeError, isCheckingResume, quiz])

  useEffect(() => {
    if (quiz) {
      if (quiz.status === "COMPLETED") {
        router.push(`/quizzes/${quizId}/results`)
        return
      }
      if (!isCheckingResume && !isPaused && quiz.timer && !timeRemaining) {
        setInitialTimer(quiz.timer)
        setTimeRemaining(quiz.timer)
      }
    }
  }, [quiz, quizId, router, isCheckingResume, isPaused, timeRemaining])

  const { mutate: submitQuiz, isLoading: isSubmitting } = useMutation(
    "post",
    {
      onSuccess: () => {
        setTimeout(() => {
          router.push(`/quizzes/${quizId}/results`)
        }, 500)
      },
      onError: (error) => {
        setErrorMessage(error.message || "Failed to submit quiz")
        setErrorDialog(true)
      },
    }
  )

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || isPaused) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeRemaining, isPaused])

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

  const handlePause = () => {
    if (!quiz || !user?.id) {
      alert("User not authenticated")
      return
    }

    const answersArray = Object.entries(answers).map(
      ([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      })
    )

    const elapsedTimeSeconds =
      initialTimer && timeRemaining !== null
        ? Math.round((initialTimer - timeRemaining) / 1000)
        : 0

    const payload = {
      answers: answersArray,
      elapsedTime: elapsedTimeSeconds,
    }

    pauseQuiz(API_ENDPOINTS.QUIZ.PAUSE(quizId), payload)
  }

  const handleSubmit = () => {
    if (!quiz || !user?.id) {
      if (!user?.id) {
        alert("User not authenticated")
      }
      return
    }

    const answersArray = Object.entries(answers).map(
      ([questionId, userAnswer]) => ({
        questionId,
        userAnswer,
      })
    )

    const timeSpentSeconds =
      initialTimer && timeRemaining !== null
        ? Math.round((initialTimer - timeRemaining) / 1000)
        : 0

    const payload: any = {
      userId: user.id,
      answers: answersArray,
      timeSpent: timeSpentSeconds,
    }

    if (attemptId) {
      payload.attemptId = attemptId
    }

    submitQuiz(`/api/v1/quiz/${quizId}/submit`, payload)
  }

  if (isLoading || (isCheckingResume && isLoadingResume)) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading quiz...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (isCheckingResume && resumeData && !isLoadingResume) {
    const answeredCount = resumeData.questions.filter(q => q.savedAnswer).length
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="mx-auto max-w-md space-y-6 rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Play className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Resume Quiz</h2>
              <p className="mt-2 text-gray-600">
                You have a paused quiz. Would you like to continue from where you left off?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {answeredCount} questions answered
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsCheckingResume(false)
                  setAnswers({})
                  setAttemptId(null)
                  setIsPaused(false)
                  if (quiz && quiz.timer) {
                    setInitialTimer(quiz.timer)
                    setTimeRemaining(quiz.timer)
                  }
                }}
              >
                Start Fresh
              </Button>
              <Button className="flex-1" onClick={handleResume}>
                Resume Quiz
              </Button>
            </div>
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
            <p className="mb-4 text-red-600">{error || "Quiz not found"}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Safety check for questions - this should not happen if we check in fetchQuiz, but keep as fallback
  if (
    !quiz.questions ||
    !Array.isArray(quiz.questions) ||
    quiz.questions.length === 0
  ) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-600">
              This quiz has no questions available.
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const safeQuestionIndex = Math.max(
    0,
    Math.min(currentQuestionIndex, quiz.questions.length - 1)
  )
  const currentQuestion = quiz.questions[safeQuestionIndex]
  const answeredCount = Object.keys(answers).length
  const totalQuestions = quiz.questions.length

  if (currentQuestionIndex !== safeQuestionIndex) {
    setCurrentQuestionIndex(safeQuestionIndex)
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="mt-1 text-sm text-gray-600">
                {quiz.difficulty} • {quiz.type.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer */}
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-900">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
            {/* Pause Button */}
            {!isPaused && timeRemaining !== null && (
              <Button
                variant="outline"
                onClick={handlePause}
                disabled={isPausing}
                className="flex items-center gap-2"
              >
                {isPausing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Pausing...
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
          </div>
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
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300"
              style={{
                width: `${((safeQuestionIndex + 1) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900">
                {currentQuestion.text}
              </h2>
              <p className="text-sm text-gray-500">Select your answer below</p>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const isSelected = answers[currentQuestion.id] === option
                return (
                  <button
                    key={index}
                    onClick={() =>
                      handleAnswerSelect(currentQuestion.id, option)
                    }
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
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
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
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
        <div className="flex flex-wrap justify-center gap-2">
          {quiz.questions.map((q, index) => {
            const isAnswered = answers[q.id]
            const isCurrent = index === safeQuestionIndex
            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`h-10 w-10 rounded-full border-2 transition-all ${
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

      {/* Pause Success Dialog */}
      <Dialog open={pauseSuccessDialog} onOpenChange={setPauseSuccessDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <DialogTitle>Quiz Paused</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {pauseSuccessData && (
                <>
                  You've answered <strong>{pauseSuccessData.answered}</strong> out of{" "}
                  <strong>{pauseSuccessData.total}</strong> questions. You can resume later from
                  where you left off.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setPauseSuccessDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog} onOpenChange={setErrorDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-red-900">Error</DialogTitle>
            </div>
            <DialogDescription className="pt-2">{errorMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}
