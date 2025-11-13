// API request/response types

import { User } from "./prisma"

export interface AuthLoginInitResponse {
  url: string
  message: string
}

export interface AuthLoginResponse {
  message: string
  user: User
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    expires_in: number
    token_type: string
    user: User
  }
}

export interface AuthSessionResponse {
  user: User
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    expires_in: number
    token_type: string
  }
}

export interface AuthMeResponse {
  user: User
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T
  message?: string
  success: boolean
  error?: string
}

// Error response
export interface ApiError {
  message: string
  statusCode?: number
  errors?: Record<string, string[]>
}

export interface TopicSuggestRequest {
  userTopic: string
}

export interface TopicSuggestResponse {
  topics: string[]
}

export interface TopicCreateRequest {
  name: string
}

export interface TopicCreateResponse {
  topic: {
    id: string
    name: string
    description: string | null
    createdAt: string
    updatedAt: string
  }
}

export interface AnalyticsResponse {
  weeklyComparison: {
    attempts: {
      thisWeek: number
      lastWeek: number
      change: number
    }
    topics: {
      thisWeek: number
      lastWeek: number
      change: number
    }
    progress: {
      thisWeek: number
      lastWeek: number
      change: number
    }
  }
  performance: {
    timeSeries: {
      last7Days: Array<{
        date: string
        averageScore: number | null
        attemptCount: number
      }>
      last30Days: Array<{
        date: string
        averageScore: number | null
        attemptCount: number
      }>
      last90Days: Array<{
        date: string
        averageScore: number | null
        attemptCount: number
      }>
    }
  }
  topics: Array<{
    topicId: string
    topicName: string
    progressPercentage: number
    averageScore: number
    completedQuizzes: number
    totalQuizzes: number
    lastAttemptAt: string | null
  }>
  overview: {
    overallProgress: number
  }
  time?: {
    totalTimeSpent: number
    averageTimeSpent: number
    totalTimeSet: number
    averageTimeSet: number
    timeEfficiency: number
  }
}

