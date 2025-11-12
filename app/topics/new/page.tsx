"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, X } from "lucide-react"
import { TopicSuggestionForm } from "@/components/topics/topic-suggestion-form"

export default function NewTopicPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Start New Quiz
            </h1>
            <p className="mt-1 text-gray-600">
              Tell us what you want to learn, and we&apos;ll create the perfect
              quiz for you
            </p>
          </div>
        </div>

        <TopicSuggestionForm />
      </div>
    </MainLayout>
  )
}

