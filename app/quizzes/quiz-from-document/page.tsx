"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { FileText, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function QuizFromDocumentPage() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-purple-100 p-6">
              <FileText className="h-16 w-16 text-purple-600" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Quiz from Document
          </h1>
          <p className="mb-2 text-xl text-gray-600">
            Coming Soon
          </p>
          <p className="mb-8 text-gray-500">
            Upload your documents (PDFs, text files, etc.) and automatically generate personalized quizzes based on the content. Our AI will analyze your document, extract key concepts, and create relevant questions to help you master the material.
          </p>
          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button onClick={() => router.push("/topics/new")}>
              Create Quiz with AI
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

