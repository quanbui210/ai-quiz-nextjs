"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Wand2, Loader2, Check, X, Lightbulb, Zap } from "lucide-react"
import { TopicSuggestResponse, TopicCreateResponse } from "@/types/api"
import { API_ENDPOINTS } from "@/lib/constants"
import { useMutation } from "@/hooks/use-mutation"

export function TopicSuggestionForm() {
  const router = useRouter()
  const [userTopic, setUserTopic] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestError, setSuggestError] = useState<string | null>(null)

  const { mutate: createTopic, isLoading: isCreating, error: createError } = useMutation<TopicCreateResponse>("post", {
    onSuccess: (data) => {
      router.push(`/topics/${data.topic.id}`)
    },
    onError: (error) => {
      setSuggestError(error.message || "Failed to create topic")
    },
  })


  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedTopic(suggestion)
    setUserTopic(suggestion)
  }

  const handleClear = () => {
    setUserTopic("")
    setSelectedTopic("")
    setSuggestions([])
    setSuggestError(null)
  }

  const handleCreate = async () => {
    const topicName = selectedTopic || userTopic.trim()
    if (!topicName) {
      setSuggestError("Please enter or select a topic")
      return
    }

    setSuggestError(null)

    try {
      await createTopic(API_ENDPOINTS.TOPIC.CREATE, {
        name: topicName,
      })
    } catch (error) {
      console.error("Failed to create topic:", error)
    }
  }

  const finalTopic = selectedTopic || userTopic.trim()

  return (
    <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="topic-input"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            What do you want to learn?
          </label>
          <div className="flex gap-2">
            <input
              id="topic-input"
              type="text"
              value={userTopic}
              onChange={(e) => {
                setUserTopic(e.target.value)
                setSelectedTopic("")
              }}
              placeholder="e.g., JavaScript Fundamentals, Photosynthesis, The Roman Empire"
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* <Button
              onClick={handleSuggest}
              disabled={isSuggesting || !userTopic.trim()}
              variant="outline"
            >
              {isSuggesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4 mr-2" />
              )}
              Get Suggestions
            </Button> */}
            {userTopic && (
              <Button onClick={handleClear} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {suggestError && (
            <p className="mt-2 text-sm text-red-600">{suggestError}</p>
          )}
        </div>
      </div>

      {/* Suggestions Section */}
      {suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-medium text-gray-900">
              Suggested Topics
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`flex items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors ${
                  selectedTopic === suggestion
                    ? "border-blue-500 bg-blue-50 text-blue-900"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>{suggestion}</span>
                {selectedTopic === suggestion && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            Select a suggestion or continue with your original topic
          </p>
        </div>
      )}

      {/* Selected Topic Display */}
      {finalTopic && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="mb-1 text-sm font-medium text-blue-900">
            Selected Topic:
          </p>
          <p className="text-base text-blue-800">{finalTopic}</p>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t pt-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!finalTopic || isCreating}
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Topic"
          )}
        </Button>
      </div>
    </div>
  )
}
