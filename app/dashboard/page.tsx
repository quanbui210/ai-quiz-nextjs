"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, TrendingUp, TrendingDown, BookOpen } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"
import { AnalyticsResponse } from "@/types/api"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import Link from "next/link"

type TimeRange = "last7Days" | "last30Days" | "last90Days"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>("last7Days")
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string>("User")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("auth-storage")
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      const userData = parsedUser?.state?.session?.user || null
      
      const name = userData?.user_metadata?.name || 
                   userData?.user_metadata?.full_name || 
                   "User"
      setDisplayName(name)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchAnalytics = async () => {
      setIsLoadingAnalytics(true)
      setError(null)

      try {
        const authData = localStorage.getItem("auth-storage")
        let authToken: string | null = null
        if (authData) {
          try {
            const parsed = JSON.parse(authData)
            authToken = parsed?.state?.session?.access_token || null
          } catch {
            // Ignore parse errors
          }
        }

        const apiUrl = "http://localhost:3001"
        const backendUrl = `${apiUrl}${API_ENDPOINTS.ANALYTICS.ME}`

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        }

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`
        }

        const response = await fetch(backendUrl, {
          method: "GET",
          headers,
        })

        if (!response.ok) {
          const responseText = await response.text()
          let errorData
          try {
            errorData = JSON.parse(responseText)
          } catch {
            errorData = { error: responseText || "Failed to get analytics" }
          }
          throw new Error(
            errorData.error ||
              errorData.details ||
              errorData.message ||
              `Failed to get analytics (${response.status})`
          )
        }

        const responseData = await response.json()
        const data: AnalyticsResponse = (responseData as any).analytics || (responseData as any).data || responseData
        console.log("Analytics data:", data)
        setAnalytics(data)
      } catch (err) {
        console.error("Failed to fetch analytics:", err)
        setError(err instanceof Error ? err.message : "Failed to load analytics")
      } finally {
        setIsLoadingAnalytics(false)
      }
    }

    fetchAnalytics()
  }, [isAuthenticated])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    const sign = isPositive ? "+" : ""
    const Icon = isPositive ? TrendingUp : TrendingDown
    return (
      <span className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        <Icon className="h-4 w-4" />
        {sign}
        {change}
        {change === 0 ? "" : " this week"}
      </span>
    )
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  const formatTimeFromMs = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    return formatTime(seconds)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getTimeSeriesData = () => {
    if (!analytics?.performance?.timeSeries) {
      return []
    }
    const data = analytics.performance.timeSeries[timeRange]
    if (!data || !Array.isArray(data)) {
      return []
    }
    
    const mapped = data.map((item) => ({
      date: formatDate(item.date),
      score: item.averageScore ?? 0,
      attempts: item.attemptCount,
    }))
    
    const hasAnyScores = mapped.some((item) => item.score > 0)
    
    return mapped
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-gray-600">
              Let&apos;s continue your learning journey. Keep up the great work!
            </p>
          </div>
          <div className="flex gap-3">
            <Button disabled variant="outline" size="lg" onClick={() => router.push("/ai-tutor")}>
              <MessageSquare className="mr-2 h-5 w-5" />
              Chat with AI Tutor
            </Button>
            <Button size="lg" onClick={() => router.push("/topics/new")}>
              <Plus className="mr-2 h-5 w-5" />
              Start New Quiz
            </Button>
          </div>
        </div>

        {isLoadingAnalytics ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-600">{error}</p>
          </div>
        ) : analytics ? (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Overall Progress
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {analytics?.overview?.overallProgress != null
                        ? `${Math.round(analytics.overview.overallProgress)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {analytics?.weeklyComparison?.progress
                    ? formatChange(analytics.weeklyComparison.progress.change)
                    : "No data"}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Topics Mastered
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {analytics?.weeklyComparison?.topics?.thisWeek ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {analytics?.weeklyComparison?.topics
                    ? formatChange(analytics.weeklyComparison.topics.change)
                    : "No data"}
                </p>
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Quizzes Taken
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {analytics?.weeklyComparison?.attempts?.thisWeek ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm">
                  {analytics?.weeklyComparison?.attempts
                    ? formatChange(analytics.weeklyComparison.attempts.change)
                    : "No data"}
                </p>
              </div>
            </div>

            {analytics?.time && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Total Time Spent</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatTime(analytics.time.totalTimeSpent)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Across all quizzes</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Average Time Spent</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatTime(analytics.time.averageTimeSpent)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Per quiz</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Total Time Allocated</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatTimeFromMs(analytics.time.totalTimeSet)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Time set for quizzes</p>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm">
                  <p className="text-sm font-medium text-gray-600">Time Efficiency</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {analytics.time.timeEfficiency > 0
                      ? `${Math.round(analytics.time.timeEfficiency)}%`
                      : "N/A"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {analytics.time.totalTimeSet > 0
                      ? `Spent ${Math.round((analytics.time.totalTimeSpent / (analytics.time.totalTimeSet / 1000)) * 100)}% of allocated time`
                      : "No time allocated"}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Your Performance Over Time
                  </h2>
                </div>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setTimeRange("last7Days")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeRange === "last7Days"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("last30Days")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeRange === "last30Days"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("last90Days")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeRange === "last90Days"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Last 90 Days
                  </button>
                </div>
                {(() => {
                  const chartData = getTimeSeriesData()
                  const hasAnyScores = chartData.some((item) => item.score > 0)
                  
                  if (chartData.length === 0) {
                    return (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        No data available for this period
                      </div>
                    )
                  }
                  
                  if (!hasAnyScores) {
                    return (
                      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                        <p className="text-lg font-medium mb-2">No quiz attempts yet</p>
                        <p className="text-sm">Start taking quizzes to see your performance over time!</p>
                      </div>
                    )
                  }
                  
                  return (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                          dataKey="date"
                          stroke="#6b7280"
                          style={{ fontSize: "12px" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="#6b7280"
                          style={{ fontSize: "12px" }}
                          label={{ value: "Score %", angle: -90, position: "insideLeft" }}
                        />
                        <Tooltip
                          formatter={(value: number) => [`${Math.round(value)}%`, "Average Score"]}
                          labelStyle={{ color: "#374151" }}
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e5e7eb",
                            borderRadius: "6px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: "#3b82f6", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )
                })()}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Topics Overview
                </h2>
                <div className="space-y-4">
                {!analytics?.topics || analytics.topics.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No topics yet. Start your first quiz!
                  </p>
                ) : (
                  analytics.topics.slice(0, 4).map((topic) => (
                    <div
                      key={topic.topicId}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <h3 className="font-medium text-gray-900">
                            {topic.topicName}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{Math.round(topic.progressPercentage)}% complete</span>
                          <span>
                            {topic.completedQuizzes}/{topic.totalQuizzes} quizzes
                          </span>
                          <span>Avg: {Math.round(topic.averageScore)}%</span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${topic.progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <Link href={`/topics/${topic.topicId}`}>
                        <Button variant="outline" size="sm" className="ml-4">
                          {topic.progressPercentage === 100
                            ? "Review"
                            : topic.progressPercentage > 0
                            ? "Continue"
                            : "Start Quiz"}
                        </Button>
                      </Link>
                    </div>
                  ))
                )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  )
}
