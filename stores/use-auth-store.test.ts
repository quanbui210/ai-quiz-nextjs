import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useAuthStore } from "./use-auth-store"
import { User } from "@/types/prisma"
import { AuthLoginResponse } from "@/types/api"

const mockUser: User = {
  id: "test-id",
  email: "test@example.com",
  name: "Test User",
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockSession = {
  access_token: "test-token",
  refresh_token: "test-refresh",
  expires_at: Date.now() + 3600000,
  expires_in: 3600,
  token_type: "bearer",
}

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useAuthStore())
    act(() => {
      result.current.logout()
    })
  })

  it("should have initial state", () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it("should set auth data", () => {
    const { result } = renderHook(() => useAuthStore())

    const authData: AuthLoginResponse = {
      message: "Success",
      user: mockUser,
      session: {
        ...mockSession,
        user: mockUser,
      },
    }

    act(() => {
      result.current.setAuth(authData)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.session).toEqual({
      ...mockSession,
      user: mockUser,
    })
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("should set user", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setSession(mockSession)
      result.current.setUser(mockUser)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it("should logout", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setAuth({
        message: "Success",
        user: mockUser,
        session: {
          ...mockSession,
          user: mockUser,
        },
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it("should set loading state", () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)

    act(() => {
      result.current.setLoading(false)
    })

    expect(result.current.isLoading).toBe(false)
  })
})
