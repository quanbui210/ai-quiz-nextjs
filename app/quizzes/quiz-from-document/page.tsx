"use client"

import { useState, useRef, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  X,
  MessageSquare,
  BookOpen,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  useDocuments,
  useDocumentUpload,
  useDocument,
  useDocumentDelete,
} from "@/hooks/use-document"
import { useCreateChatSession } from "@/hooks/use-chat"
import {
  Document,
  DocumentStatus,
  DocumentQuizzesResponse,
  DocumentChatsResponse,
} from "@/types/api"
import { useAuth } from "@/hooks/use-auth"
import { DocumentQuizGenerationDialog } from "@/components/document/document-quiz-generation-dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useSubscription } from "@/hooks/use-subscription"
import { useAPI } from "@/hooks/use-api"
import { API_ENDPOINTS } from "@/lib/constants"
import { Quiz } from "@/types/prisma"
import Link from "next/link"

export default function QuizFromDocumentPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  )
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    documents,
    isLoading: isLoadingDocuments,
    refetch: refetchDocuments,
  } = useDocuments()
  const { uploadDocument, isLoading: isUploading } = useDocumentUpload()
  const { document: uploadedDocument, refetch: refetchDocument } =
    useDocument(selectedDocumentId)
  const { createSession, isLoading: isCreatingSession } = useCreateChatSession()
  const { deleteDocument, isLoading: isDeleting } = useDocumentDelete()
  const { subscription, usage } = useSubscription()
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)

  const {
    data: quizzesData,
    isLoading: isLoadingQuizzes,
    mutate: refetchQuizzes,
  } = useAPI<DocumentQuizzesResponse>(
    selectedDocumentId
      ? API_ENDPOINTS.DOCUMENT.QUIZZES(selectedDocumentId)
      : null,
    {
      revalidateOnFocus: false,
    }
  )

  const {
    data: chatsData,
    isLoading: isLoadingChats,
    mutate: refetchChats,
  } = useAPI<DocumentChatsResponse>(
    selectedDocumentId
      ? API_ENDPOINTS.DOCUMENT.CHATS(selectedDocumentId)
      : null,
    {
      revalidateOnFocus: false,
    }
  )

  const documentQuizzes = quizzesData?.quizzes || []
  const documentChats = chatsData?.sessions || []
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean
    documentId: string
    filename: string
  } | null>(null)

  useEffect(() => {
    if (
      !uploadedDocument ||
      uploadedDocument.status === "READY" ||
      uploadedDocument.status === "ERROR"
    ) {
      return
    }

    const interval = setInterval(() => {
      refetchDocument()
    }, 2000)

    return () => clearInterval(interval)
  }, [uploadedDocument, refetchDocument])

  const handleFileSelect = async (files: FileList | File[]) => {
    setUploadError(null)

    const fileArray = Array.from(files)
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "text/markdown",
    ]
    const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".md"]

    const maxDocuments = subscription?.maxDocuments ?? 0
    const currentDocumentsCount = documents.length
    const filesToUpload = fileArray.length

    if (maxDocuments > 0 && maxDocuments < 9999) {
      if (currentDocumentsCount + filesToUpload > maxDocuments) {
        setUploadError(
          `You have reached your document limit. You can upload ${maxDocuments} documents (currently have ${currentDocumentsCount}). Please delete some documents to upload more.`
        )
        return
      }
    }

    // Validate each file
    for (const file of fileArray) {
      const fileExtension = file.name
        .toLowerCase()
        .substring(file.name.lastIndexOf("."))
      if (
        !allowedTypes.includes(file.type) &&
        !allowedExtensions.includes(fileExtension)
      ) {
        setUploadError(
          `"${file.name}" is not a valid file type. Please upload a PDF, Word document, or text file (.pdf, .doc, .docx, .txt, .md)`
        )
        return
      }

      if (file.size > 40 * 1024 * 1024) {
        setUploadError(
          `"${file.name}" is too large. File size must be less than 40MB`
        )
        return
      }
    }

    // Upload files sequentially
    try {
      for (const file of fileArray) {
        const response = await uploadDocument(file)
        if (response?.document) {
          // Select the first uploaded document
          if (!selectedDocumentId) {
            setSelectedDocumentId(response.document.id)
          }
        }
      }
      refetchDocuments()
    } catch (error: any) {
      setUploadError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to upload document"
      )
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleGenerateQuiz = () => {
    if (!uploadedDocument) return
    setIsQuizDialogOpen(true)
  }

  const handleQuizGenerated = (quizId: string) => {
    router.push(`/quizzes/${quizId}`)
    refetchQuizzes() // Refetch quizzes for the document
  }

  const handleStartChat = async () => {
    if (!uploadedDocument) return

    try {
      const response = await createSession(uploadedDocument.id)
      if (response?.session) {
        router.push(`/chat/${response.session.id}`)
        refetchChats()
      }
    } catch (error: any) {
      setUploadError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create chat session"
      )
    }
  }

  const handleSelectDocument = (documentId: string) => {
    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(null)
    } else {
      setSelectedDocumentId(documentId)
    }
    setUploadError(null)
  }

  const handleDeleteClick = (
    documentId: string,
    filename: string,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.stopPropagation() // Prevent selecting the document when clicking delete
    }
    setDeleteConfirm({
      open: true,
      documentId,
      filename,
    })
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      await deleteDocument(deleteConfirm.documentId)
      // If deleted document was selected, clear selection
      if (selectedDocumentId === deleteConfirm.documentId) {
        setSelectedDocumentId(null)
      }
      // Refresh documents list
      refetchDocuments()
      setDeleteConfirm(null)
    } catch (error: any) {
      setUploadError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to delete document"
      )
      setDeleteConfirm(null)
    }
  }

  const getStatusMessage = (status: DocumentStatus) => {
    switch (status) {
      case "UPLOADING":
        return "Uploading document..."
      case "PROCESSING":
        return "Processing document and generating embeddings..."
      case "READY":
        return "Document is ready!"
      case "ERROR":
        return "Error processing document"
      default:
        return ""
    }
  }

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "UPLOADING":
      case "PROCESSING":
        return <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      case "READY":
        return <CheckCircle2 className="h-6 w-6 text-green-600" />
      case "ERROR":
        return <AlertCircle className="h-6 w-6 text-red-600" />
      default:
        return null
    }
  }

  if (isAuthLoading) {
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

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl space-y-8 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Quiz from Document
          </h1>
          <p className="text-gray-600">
            Upload your documents (PDFs, text files, etc.) and automatically
            generate personalized quizzes based on the content. Our AI uses RAG
            (Retrieval-Augmented Generation) technique to analyze your
            document, extract key concepts, and create relevant questions to
            help you master the material.
          </p>
        </div>

        {uploadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">{uploadError}</p>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={() => setUploadError(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Upload Section - Always visible */}
          <div
            className={`rounded-lg border-2 border-dashed p-3 transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="mb-2 rounded-full bg-purple-100 p-3">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">
                {documents.length > 0
                  ? "Upload More Documents"
                  : "Upload Document"}
              </h3>
              <p className="mb-2 text-sm text-gray-600">
                Drag and drop your files here, or click to browse
              </p>
              <p className="mb-3 text-xs text-gray-500">
                Supported: PDF, Word, Text, Markdown • Max 40MB per file
                {subscription &&
                  subscription.maxDocuments > 0 &&
                  subscription.maxDocuments < 9999 && (
                    <>
                      {" "}
                      • {documents.length} / {subscription.maxDocuments}{" "}
                      documents
                    </>
                  )}
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                size="default"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {documents.length > 0 ? "Select More Files" : "Select File"}
                  </>
                )}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md"
                multiple
                onChange={handleFileInputChange}
              />
            </div>
          </div>

          {documents.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Your Documents
              </h3>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`relative rounded-lg border-2 p-4 transition-all ${
                        selectedDocumentId === doc.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectDocument(doc.id)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-purple-100 p-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {doc.filename}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {(doc.fileSize / 1024).toFixed(2)} KB
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              {getStatusIcon(doc.status)}
                              <span className="text-xs text-gray-600">
                                {getStatusMessage(doc.status)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) =>
                          handleDeleteClick(doc.id, doc.filename, e)
                        }
                        disabled={isDeleting}
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all hover:bg-red-600 hover:shadow disabled:opacity-50"
                        title="Delete document"
                      >
                        {isDeleting ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <X className="h-2.5 w-2.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {uploadedDocument && (
            <>
              {uploadedDocument.status === "READY" && (
                <>
                  {/* Related Content Section - Combined Quizzes and Chat */}
                  {(documentQuizzes.length > 0 || documentChats.length > 0) && (
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Related Content
                      </h3>
                      {isLoadingQuizzes || isLoadingChats ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {/* Quizzes */}
                          {documentQuizzes.map((quiz) => (
                            <Link
                              key={quiz.id}
                              href={`/quizzes/${quiz.id}`}
                              className="rounded-lg border-2 border-gray-200 bg-gray-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
                            >
                              <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-100 p-2">
                                  <BookOpen className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {quiz.title}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {quiz.count} questions • {quiz.difficulty}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400">
                                    {new Date(
                                      quiz.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}

                          {/* Chat Session */}
                          {documentChats.map((chat) => (
                            <Link
                              key={chat.id}
                              href={`/chat/${chat.id}`}
                              className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4 transition-all hover:border-purple-300 hover:bg-purple-100"
                            >
                              <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-purple-100 p-2">
                                  <MessageSquare className="h-5 w-5 text-purple-600" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {chat.title || "Untitled Chat"}
                                  </p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    {chat._count?.messages || 0} messages
                                  </p>
                                  <p className="mt-1 text-xs text-gray-400">
                                    {new Date(
                                      chat.updatedAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Options */}
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Generate Quiz Option */}
                    <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-3">
                          <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Generate Quiz
                        </h3>
                      </div>
                      <p className="mb-4 text-sm text-gray-600">
                        Create a personalized quiz based on your document
                        content. Our AI will analyze the document and generate
                        relevant questions.
                      </p>
                      <Button
                        onClick={handleGenerateQuiz}
                        className="w-full"
                        size="lg"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate Quiz
                      </Button>
                    </div>

                    {/* Chat Option - Show existing chat or start new */}
                    {documentChats.length > 0 ? (
                      <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-lg bg-purple-100 p-3">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Continue Chat
                          </h3>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">
                          Continue your conversation with the AI tutor about
                          this document.
                        </p>
                        <Link href={`/chat/${documentChats[0].id}`}>
                          <Button
                            className="w-full"
                            size="lg"
                            variant="outline"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Open Chat ({documentChats[0]._count?.messages ||
                              0}{" "}
                            messages)
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="rounded-lg bg-purple-100 p-3">
                            <MessageSquare className="h-6 w-6 text-purple-600" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Ask Questions
                          </h3>
                        </div>
                        <p className="mb-4 text-sm text-gray-600">
                          Chat with our AI tutor about your document. Ask
                          questions and get answers based on the document
                          content using RAG technology.
                        </p>
                        <Button
                          onClick={handleStartChat}
                          disabled={isCreatingSession}
                          className="w-full"
                          size="lg"
                          variant="outline"
                        >
                          {isCreatingSession ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Starting...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Start Chat
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Quiz Generation Dialog */}
        {uploadedDocument && (
          <DocumentQuizGenerationDialog
            open={isQuizDialogOpen}
            onOpenChange={setIsQuizDialogOpen}
            documentId={uploadedDocument.id}
            documentFilename={uploadedDocument.filename}
            onSuccess={handleQuizGenerated}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={deleteConfirm?.open || false}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteConfirm(null)
            }
          }}
          title="Delete Document"
          description={`Are you sure you want to delete "${deleteConfirm?.filename}"? This action cannot be undone and will delete the document and all associated data.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          variant="destructive"
        />
      </div>
    </MainLayout>
  )
}
