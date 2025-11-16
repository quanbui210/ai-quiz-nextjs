"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { MessageSquare, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function AiTutorPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-100 p-6">
              <MessageSquare className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            AI Tutor
          </h1>
          <p className="mb-2 text-xl text-gray-600">
            Coming Soon
          </p>
          <p className="mb-8 text-gray-500">
            Our AI Tutor feature is currently under development. Soon you&apos;ll be able to chat with an intelligent tutor that can help you understand concepts, answer questions, and provide personalized learning guidance based on your quiz performance and learning goals.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/topics")}>
              Browse Topics
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

