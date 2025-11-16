import { http, HttpResponse } from "msw"
import { API_ENDPOINTS } from "@/lib/constants"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export const handlers = [
  // Auth endpoints
  http.get(`${API_URL}${API_ENDPOINTS.AUTH.LOGIN}`, () => {
    return HttpResponse.json({
      url: "https://example.com/oauth",
      message: "Redirect user to this URL to complete Google login",
    })
  }),

  http.get(`${API_URL}${API_ENDPOINTS.AUTH.SESSION}`, () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      session: {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_at: Date.now() + 3600000,
        expires_in: 3600,
        token_type: "bearer",
      },
    })
  }),

  http.get(`${API_URL}${API_ENDPOINTS.AUTH.ME}`, () => {
    return HttpResponse.json({
      user: {
        id: "test-user-id",
        email: "test@example.com",
        name: "Test User",
        avatarUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    })
  }),

  http.post(`${API_URL}${API_ENDPOINTS.AUTH.SIGNOUT}`, () => {
    return HttpResponse.json({ message: "Signed out successfully" })
  }),
]
