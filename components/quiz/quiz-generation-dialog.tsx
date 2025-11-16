"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wand2,
  Loader2,
  Check,
  X,
  AlertCircle,
  Clock,
  Lightbulb,
  Rocket,
  SparkleIcon,
  Sparkles,
} from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"
import { Difficulty, QuizType } from "@/types/prisma"
import { useAuth } from "@/hooks/use-auth"
import { useMutation } from "@/hooks/use-mutation"

interface QuizGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topicName: string
  topicId: string
}

interface QuizSuggestResponse {
  topics: string[]
}

interface QuizValidateResponse {
  isValid: boolean
  message?: string
}

interface QuizCreateResponse {
  quiz: {
    id: string
    title: string
    topicId: string
    createdAt: string
  }
}

export function QuizGenerationDialog({
  open,
  onOpenChange,
  topicName,
  topicId,
}: QuizGenerationDialogProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [quizName, setQuizName] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>("")
  const [isTypingManually, setIsTypingManually] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>(
    Difficulty.INTERMEDIATE
  )
  const [quizType, setQuizType] = useState<QuizType>(QuizType.MULTIPLE_CHOICE)
  const [timerOption, setTimerOption] = useState<
    "5" | "10" | "15" | "30" | "custom" | "none"
  >("15")
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean
    message?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getAuthToken = useCallback((): string | null => {
    const authData = localStorage.getItem("auth-storage")
    if (!authData) return null
    try {
      const parsed = JSON.parse(authData)
      return parsed?.state?.session?.access_token || null
    } catch {
      return null
    }
  }, [])

  const { mutate: createQuiz, isLoading: isCreatingQuiz } = useMutation<QuizCreateResponse>("post", {
    onSuccess: (data) => {
      onOpenChange(false)

      setTimeout(() => {
        const quizId = data.quiz?.id || (data as any).id
        if (quizId) {
          router.push(`/quizzes/${quizId}`)
        } else {
          setError("Quiz created but ID not found in response")
        }
      }, 100)
    },
    onError: (error) => {
      console.error("Create quiz error:", error)
      setError(error.message || "Failed to create quiz")
    },
  })


  const {mutate: suggestQuiz, isLoading: isSuggestingQuiz} = useMutation<QuizSuggestResponse>("post", {
    onSuccess: (data) => {
      if (
        data.topics.length === 1 &&
        typeof data.topics[0] === "string" &&
        data.topics[0].includes(",")
      ) {
        const topics = data.topics[0]
          .split(",")
          .map((topic: string) => topic.trim())
          .filter((topic: string) => topic.length > 0)
        setSuggestions(topics)
      } else {
        setSuggestions(data.topics)
      }
    },
    onError: (error) => {
      console.error("Suggest quiz error:", error)
      setError(error.message || "Failed to get suggestions")
    },
  })

  const {mutate: validateQuiz, isLoading: isValidatingQuiz} = useMutation<QuizValidateResponse>("post", {
    onSuccess: (data) => {
      setValidationResult({
        isValid: data.isValid,
        message: data.message,
      })
      setIsValidating(false)
    },
    onError: (error) => {
      setValidationResult({
        isValid: false,
        message: error.message || "Failed to validate quiz",
      })
      setIsValidating(false)
    },
  })

  const handleValidate = useCallback(
    async (input: string) => {
      if (!input.trim()) {
        setValidationResult(null)
        return
      }

      setIsValidating(true)

      validateQuiz(API_ENDPOINTS.QUIZ.VALIDATE_TOPIC, {
          method: "POST",
          name: input.trim(),
        })
     
    },
    [validateQuiz]
  )

  useEffect(() => {
    if (open && topicName) {
      setQuizName("")
      setSelectedSuggestion("")
      setSuggestions([])
      setValidationResult(null)
      setError(null) 
      setIsTypingManually(false)
      if (topicName.trim()) {
        setError(null)
        suggestQuiz(API_ENDPOINTS.QUIZ.SUGGEST_TOPIC, {
          userTopic: topicName.trim(),
        })
      }
    }
  }, [open, topicName])

 
  useEffect(() => {
    if (!isTypingManually || !quizName.trim()) {
      if (!quizName.trim()) {
        setValidationResult(null)
      }
      return
    }

    const timeoutId = setTimeout(() => {
      handleValidate(quizName.trim())
    }, 500) 

    return () => clearTimeout(timeoutId)
  }, [quizName, isTypingManually])

  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion)
    setQuizName(suggestion)
    setIsTypingManually(false)
    handleValidate(suggestion)
  }

  const getTimerInMilliseconds = (): number | null => {
    if (timerOption === "none") {
      return null
    }
    let minutes: number
    if (timerOption === "custom") {
      minutes = parseInt(customTimerMinutes) || 0
    } else {
      minutes = parseInt(timerOption)
    }
    return minutes * 60 * 1000
  }

  const handleCreate = async () => {
    const finalQuizName = selectedSuggestion || quizName.trim()
    if (!finalQuizName) {
      setError("Please enter or select a quiz topic")
      return
    }

    if (!user?.id) {
      setError("User not authenticated")
      return
    }

    const timerMs = getTimerInMilliseconds()
    if (timerMs !== null && timerMs <= 0) {
      setError("Please set a valid timer")
      return
    }

    setError(null)

    const payload: any = {
      title: finalQuizName,
      difficulty: difficulty,
      quizType: quizType,
      topicId: topicId,
      userId: user.id,
      questionCount: questionCount,
      topic: topicName,
    }

    if (timerMs !== null) {
      payload.timer = timerMs
    }

    try {
      await createQuiz(API_ENDPOINTS.QUIZ.CREATE, payload)
    } catch (err) {
      console.error("Create quiz error:", err)
    }
  }

  console.log(quizName)
  const handleClose = () => {
    onOpenChange(false)
    setQuizName("")
    setSelectedSuggestion("")
    setSuggestions([])
    setValidationResult(null)
    setError(null)
    setIsTypingManually(false)
    setDifficulty(Difficulty.INTERMEDIATE)
    setQuizType(QuizType.MULTIPLE_CHOICE)
    setTimerOption("15")
    setCustomTimerMinutes("")
    setQuestionCount(15)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            Generate Quiz
          </DialogTitle>
          <DialogDescription>
            Create a quiz based on &quot;{topicName}&quot;. Enter a specific
            quiz topic or select from suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Section */}
          <div className="space-y-2">
            <label
              htmlFor="quiz-name"
              className="text-sm font-medium text-gray-700"
            >
              Quiz Topic
            </label>
            <input
              id="quiz-name"
              type="text"
              value={quizName}
              onChange={(e) => {
                setQuizName(e.target.value)
                setSelectedSuggestion("")
                setIsTypingManually(true) // Mark as typing manually
              }}
              placeholder="e.g., AWS S3 Storage Configuration, JavaScript Promises and Async/Await"
              className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {quizName.trim() && (
              <div className="flex items-center gap-2 text-sm">
                {isValidating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    <span className="text-gray-500">Validating...</span>
                  </>
                ) : validationResult ? (
                  <>
                    {validationResult.isValid ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-green-600">
                          Topic is specific enough
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600">
                          {validationResult.message ||
                            "Topic needs to be more specific"}
                        </span>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            )}
          </div>

          {/* Suggestions Section */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-medium text-gray-900">
                  Suggested Topics
                </h3>
                {isSuggestingQuiz && (
                  <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                      selectedSuggestion === suggestion
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span>{suggestion}</span>
                    {selectedSuggestion === suggestion && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Configuration Section */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">
              Quiz Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-2">
                <label
                  htmlFor="difficulty"
                  className="text-sm font-medium text-gray-700"
                >
                  Difficulty
                </label>
                <Select
                  value={difficulty}
                  onValueChange={(value) => setDifficulty(value as Difficulty)}
                >
                  <SelectTrigger id="difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Difficulty.BEGINNER}>
                      Beginner
                    </SelectItem>
                    <SelectItem value={Difficulty.INTERMEDIATE}>
                      Intermediate
                    </SelectItem>
                    <SelectItem value={Difficulty.ADVANCED}>
                      Advanced
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz Type */}
              <div className="space-y-2">
                <label
                  htmlFor="quiz-type"
                  className="text-sm font-medium text-gray-700"
                >
                  Quiz Type
                </label>
                <Select
                  value={quizType}
                  onValueChange={(value) => setQuizType(value as QuizType)}
                >
                  <SelectTrigger id="quiz-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={QuizType.MULTIPLE_CHOICE}>
                      Multiple Choice
                    </SelectItem>
                    <SelectItem disabled={true} value={QuizType.TRUE_FALSE}>
                      True/False
                    </SelectItem>
                    <SelectItem disabled={true} value={QuizType.SHORT_ANSWER}>
                      Short Answer
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4" />
                Timer
              </label>
              <div className="flex gap-2">
                <Select
                  value={timerOption}
                  onValueChange={(value) => {
                    setTimerOption(value as "15" | "30" | "custom" | "none")
                    if (value !== "custom") {
                      setCustomTimerMinutes("")
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="none">No timer</SelectItem>
                  </SelectContent>
                </Select>
                {timerOption === "custom" && (
                  <input
                    type="number"
                    min="1"
                    value={customTimerMinutes}
                    onChange={(e) => setCustomTimerMinutes(e.target.value)}
                    placeholder="Minutes"
                    className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
              {timerOption === "none" && (
                <p className="text-xs text-gray-500">
                  Quiz can be created without a timer. Timer can be set later.
                </p>
              )}
              {timerOption !== "custom" && timerOption !== "none" && (
                <p className="text-xs text-gray-500">
                  {timerOption} minutes ({parseInt(timerOption) * 60 * 1000}ms)
                </p>
              )}
              {timerOption === "custom" && customTimerMinutes && (
                <p className="text-xs text-gray-500">
                  {customTimerMinutes} minutes (
                  {parseInt(customTimerMinutes) * 60 * 1000}ms)
                </p>
              )}
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label
                htmlFor="question-count"
                className="text-sm font-medium text-gray-700"
              >
                Number of Questions
              </label>
              <input
                id="question-count"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreatingQuiz}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !quizName.trim() ||
              isCreatingQuiz ||
              (validationResult ? !validationResult.isValid : false) ||
              (getTimerInMilliseconds() !== null &&
                getTimerInMilliseconds()! <= 0) ||
              questionCount < 1
            }
            size="lg"
          >
            {isCreatingQuiz ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Quiz
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
