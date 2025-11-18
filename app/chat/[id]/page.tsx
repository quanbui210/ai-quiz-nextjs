"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import {
  useChatSession,
  useChatMessages,
  useSendChatMessage,
} from "@/hooks/use-chat"
import { useDocument } from "@/hooks/use-document"
import { Loader2, Send, ArrowLeft, FileText, Bot, User } from "lucide-react"
import { ChatMessage, ChatRole } from "@/types/api"

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [message, setMessage] = useState("")
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const { session, isLoading: isLoadingSession } = useChatSession(sessionId)
  const {
    messages,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useChatMessages(sessionId)
  const { sendMessage, isLoading: isSending } = useSendChatMessage()
  const { document } = useDocument(session?.documentId || null)

  useEffect(() => {
    if (session && messages.length > 0) {
      setLocalMessages(messages)
    }
  }, [session, messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isSending) return

    const messageText = message.trim()
    setMessage("")

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: "USER",
      content: messageText,
      createdAt: new Date().toISOString(),
    }
    setLocalMessages((prev) => [...prev, userMessage])

    try {
      const response = await sendMessage(sessionId, messageText)

      if (response?.message) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId,
          role: "ASSISTANT",
          content: response.message,
          createdAt: new Date().toISOString(),
        }
        setLocalMessages((prev) => [...prev, aiMessage])
      }

      refetchMessages()
    } catch (error) {
      console.error("Failed to send message:", error)
      // Remove the user message on error
      setLocalMessages((prev) =>
        prev.filter((msg) => msg.id !== userMessage.id)
      )
      // Restore message input
      setMessage(messageText)
    }
  }

  const getMessageIcon = (role: ChatRole) => {
    if (role === "ASSISTANT") {
      return <Bot className="h-5 w-5 text-blue-600" />
    }
    return <User className="h-5 w-5 text-gray-600" />
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (isAuthLoading || isLoadingSession) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  if (!isAuthenticated) {
    router.push("/login")
    return null
  }

  if (!session) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <p className="text-gray-600">Chat session not found</p>
          <Button
            variant="outline"
            onClick={() => router.push("/quizzes/quiz-from-document")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-4xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/quizzes/quiz-from-document")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {session.title || "Chat with AI Tutor"}
              </h1>
              {document && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FileText className="h-4 w-4" />
                  <span>{document.filename}</span>
                </div>
              )}
            </div>
          </div>
          {document && (
            <div className="text-xs text-gray-500">Model: {session.model}</div>
          )}
        </div>

        {/* Messages Container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4"
        >
          {isLoadingMessages && localMessages.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bot className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Start a conversation
              </h3>
              <p className="text-gray-600">
                {document
                  ? "Ask questions about your document and get AI-powered answers using RAG technology."
                  : "Ask me anything and I'll help you learn!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {localMessages.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${
                    msg.role === "USER" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ASSISTANT" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                      {getMessageIcon(msg.role)}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === "USER"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 shadow-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                    <p
                      className={`mt-1 text-xs ${
                        msg.role === "USER" ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                  {msg.role === "USER" && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                      {getMessageIcon(msg.role)}
                    </div>
                  )}
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start gap-4">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <Bot className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 bg-white px-6 py-4"
        >
          <div className="flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                document
                  ? "Ask a question about your document..."
                  : "Type your message..."
              }
              disabled={isSending}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage(e)
                }
              }}
            />
            <Button
              type="submit"
              disabled={!message.trim() || isSending}
              size="lg"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {document && (
            <p className="mt-2 text-xs text-gray-500">
              Developed using RAG-pattern - answers are based on your document
              content
            </p>
          )}
        </form>
      </div>
    </MainLayout>
  )
}
