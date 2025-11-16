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
    UPDATE: (id: string) => `/api/v1/topic/${id}`,
    DELETE: (id: string) => `/api/v1/topic/${id}`,
  },
  QUIZ: {
    SUGGEST_TOPIC: "/api/v1/quiz/suggest-topic",
    VALIDATE_TOPIC: "/api/v1/quiz/validate-topic",
    CREATE: "/api/v1/quiz/create",
    GET: (id: string) => `/api/v1/quiz/${id}`,
    LIST_BY_TOPIC: (topicId: string) => `/api/v1/quiz/list/${topicId}`,
    RESULTS: (id: string) => `/api/v1/results/quiz/${id}`,
    DELETE: (id: string) => `/api/v1/quiz/${id}`,
    PAUSE: (id: string) => `/api/v1/quiz/${id}/pause`,
    RESUME: (id: string) => `/api/v1/quiz/${id}/resume`,
  },
  ANALYTICS: {
    ME: "/api/v1/results/analytics/me",
  },
} as const

export const APP_CONFIG = {
  APP_NAME: "LearnAI",
} as const
