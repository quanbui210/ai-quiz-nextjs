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
import { Wand2, Loader2, Check, X, AlertCircle, Clock, Lightbulb, Rocket, SparkleIcon, Sparkles } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"
import { Difficulty, QuizType } from "@/types/prisma"
import { useAuth } from "@/hooks/use-auth"

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
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.INTERMEDIATE)
  const [quizType, setQuizType] = useState<QuizType>(QuizType.MULTIPLE_CHOICE)
  const [timerOption, setTimerOption] = useState<"15" | "30" | "custom">("30")
  const [customTimerMinutes, setCustomTimerMinutes] = useState<string>("")
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [isValidating, setIsValidating] = useState(false)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
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

  const handleSuggest = useCallback(async (input: string) => {
    if (!input.trim()) return

    setIsSuggesting(true)
    setError(null)

    try {
      const authToken = getAuthToken()
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.SUGGEST_TOPIC}`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(backendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ userTopic: input.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to get suggestions",
        }))
        throw new Error(errorData.error || errorData.message || "Failed to get suggestions")
      }

      const data: QuizSuggestResponse = await response.json()
    
      let topics = data.topics || []
      
      if (topics.length === 1 && typeof topics[0] === "string" && topics[0].includes(",")) {
        topics = topics[0]
          .split(",")
          .map((topic) => topic.trim())
          .filter((topic) => topic.length > 0)
      }
      
      setSuggestions(topics)
    } catch (err) {
      console.error("Suggest error:", err)
      setError(err instanceof Error ? err.message : "Failed to get suggestions")
    } finally {
      setIsSuggesting(false)
    }
  }, [getAuthToken])

  const handleValidate = useCallback(async (input: string) => {
    if (!input.trim()) {
      setValidationResult(null)
      return
    }

    setIsValidating(true)

    try {
      const authToken = getAuthToken()
      const apiUrl = "http://localhost:3001"
      const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.VALIDATE_TOPIC}`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(backendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: input.trim() }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to validate",
        }))
        throw new Error(errorData.error || errorData.message || "Failed to validate")
      }

      const data: QuizValidateResponse = await response.json()
      setValidationResult({
        isValid: data.isValid,
        message: data.message,
      })
    } catch (err) {
      console.error("Validate error:", err)
      setValidationResult({
        isValid: false,
        message: err instanceof Error ? err.message : "Validation failed",
      })
    } finally {
      setIsValidating(false)
    }
  }, [getAuthToken])

  // Auto-suggest when dialog opens
  useEffect(() => {
    if (open && topicName) {
      // Reset state when dialog opens
      setQuizName("")
      setSelectedSuggestion("")
      setSuggestions([])
      setValidationResult(null)
      setError(null) // Clear any previous errors
      setIsTypingManually(false)
      // Call suggest endpoint
      handleSuggest(topicName)
    }
  }, [open, topicName, handleSuggest])

  // Auto-validate as user types manually (debounced)
  // Only validate if user is typing manually, not when selecting a suggestion
  useEffect(() => {
    if (!isTypingManually || !quizName.trim()) {
      if (!quizName.trim()) {
        setValidationResult(null)
      }
      return
    }

    const timeoutId = setTimeout(() => {
      handleValidate(quizName.trim())
    }, 500) // Debounce for 500ms

    return () => clearTimeout(timeoutId)
  }, [quizName, isTypingManually, handleValidate])

  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion)
    setQuizName(suggestion)
    setIsTypingManually(false) // Mark as not typing manually
    // Validate immediately when suggestion is selected
    handleValidate(suggestion)
  }

  // Convert timer to milliseconds
  const getTimerInMilliseconds = (): number => {
    let minutes: number
    if (timerOption === "custom") {
      minutes = parseInt(customTimerMinutes) || 0
    } else {
      minutes = parseInt(timerOption)
    }
    return minutes * 60 * 1000 // Convert minutes to milliseconds
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
    if (timerMs <= 0) {
      setError("Please set a valid timer")
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const authToken = getAuthToken()
      const apiUrl = "http://localhost:3001"
      const backendUrl = `${apiUrl}${API_ENDPOINTS.QUIZ.CREATE}`

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      }

      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`
      }

      const response = await fetch(backendUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic: finalQuizName,
          difficulty: difficulty,
          quizType: quizType,
          timer: timerMs,
          topicId: topicId,
          userId: user.id,
          questionCount: questionCount,
        }),
      })

      // Read response once
      const responseText = await response.text()

      if (!response.ok) {
        let errorData
        try {
          errorData = JSON.parse(responseText)
        } catch {
          errorData = { error: responseText || "Failed to create quiz" }
        }
        throw new Error(errorData.error || errorData.message || "Failed to create quiz")
      }

      let data: QuizCreateResponse
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error("Failed to parse quiz creation response:", parseError, "Response:", responseText)
        throw new Error("Invalid response format from server")
      }

      console.log("Quiz created successfully:", data)
      
      onOpenChange(false)
      
      setTimeout(() => {
        const quizId = data.quiz?.id || (data as any).id
        if (quizId) {
          console.log("Navigating to quiz:", quizId)
          router.push(`/quizzes/${quizId}`)
        } else {
          setError("Quiz created but ID not found in response")
        }
      }, 100)
    } catch (err) {
      console.error("Create quiz error:", err)
      setError(err instanceof Error ? err.message : "Failed to create quiz")
    } finally {
      setIsCreating(false)
    }
  }

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
    setTimerOption("30")
    setCustomTimerMinutes("")
    setQuestionCount(5)
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
            Create a quiz based on &quot;{topicName}&quot;. Enter a specific quiz topic or select from suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Section */}
          <div className="space-y-2">
            <label htmlFor="quiz-name" className="text-sm font-medium text-gray-700">
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

            {/* Validation Status */}
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
                        <span className="text-green-600">Topic is specific enough</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-amber-600">
                          {validationResult.message || "Topic needs to be more specific"}
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
                <h3 className="text-sm font-medium text-gray-900">Suggested Topics</h3>
                {isSuggesting && (
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
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium text-gray-900">Quiz Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Difficulty */}
              <div className="space-y-2">
                <label htmlFor="difficulty" className="text-sm font-medium text-gray-700">
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
                    <SelectItem value={Difficulty.BEGINNER}>Beginner</SelectItem>
                    <SelectItem value={Difficulty.INTERMEDIATE}>Intermediate</SelectItem>
                    <SelectItem value={Difficulty.ADVANCED}>Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quiz Type */}
              <div className="space-y-2">
                <label htmlFor="quiz-type" className="text-sm font-medium text-gray-700">
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
                    <SelectItem value={QuizType.MULTIPLE_CHOICE}>Multiple Choice</SelectItem>
                    <SelectItem disabled={true} value={QuizType.TRUE_FALSE}>True/False</SelectItem>
                    <SelectItem disabled={true} value={QuizType.SHORT_ANSWER}>Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timer */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Timer
              </label>
              <div className="flex gap-2">
                <Select
                  value={timerOption}
                  onValueChange={(value) => {
                    setTimerOption(value as "15" | "30" | "custom")
                    if (value !== "custom") {
                      setCustomTimerMinutes("")
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
              {timerOption !== "custom" && (
                <p className="text-xs text-gray-500">
                  {timerOption} minutes ({parseInt(timerOption) * 60 * 1000}ms)
                </p>
              )}
              {timerOption === "custom" && customTimerMinutes && (
                <p className="text-xs text-gray-500">
                  {customTimerMinutes} minutes ({parseInt(customTimerMinutes) * 60 * 1000}ms)
                </p>
              )}
            </div>

            {/* Question Count */}
            <div className="space-y-2">
              <label htmlFor="question-count" className="text-sm font-medium text-gray-700">
                Number of Questions
              </label>
              <input
                id="question-count"
                type="number"
                min="1"
                max="50"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !quizName.trim() ||
              isCreating ||
              (validationResult ? !validationResult.isValid : false) ||
              getTimerInMilliseconds() <= 0 ||
              questionCount < 1
            }
            size="lg"
          >
            {isCreating ? (
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

