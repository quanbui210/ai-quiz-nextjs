// Application constants
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",
    CALLBACK: "/api/v1/auth/callback",
    SESSION: "/api/v1/auth/session",
    ME: "/api/v1/auth/me",
    SIGNOUT: "/api/v1/auth/signout",
  },
  TOPIC: {
    SUGGEST: "/api/v1/topic/suggest",
    CREATE: "/api/v1/topic/create",
    GET: (id: string) => `/api/v1/topic/${id}`,
    LIST: "/api/v1/topic/list",
  },
  QUIZ: {
    SUGGEST_TOPIC: "/api/v1/quiz/suggest-topic",
    VALIDATE_TOPIC: "/api/v1/quiz/validate-topic",
    CREATE: "/api/v1/quiz/create",
    GET: (id: string) => `/api/v1/quiz/${id}`,
    LIST_BY_TOPIC: (topicId: string) => `/api/v1/quiz/list/${topicId}`,
  },
} as const

export const APP_CONFIG = {
  APP_NAME: "LearnAI",
} as const
