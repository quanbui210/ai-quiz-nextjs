"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import {
  MessageSquare,
  Plus,
  TrendingUp,
  TrendingDown,
  BookOpen,
} from "lucide-react"
import { API_ENDPOINTS } from "@/lib/constants"
import { AnalyticsResponse } from "@/types/api"
import { useAPI } from "@/hooks/use-api"
import { useSubscription } from "@/hooks/use-subscription"
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
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth()
  const [timeRange, setTimeRange] = useState<TimeRange>("last7Days")
  const [displayName, setDisplayName] = useState<string>("User")
  const { subscription, usage } = useSubscription()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (isAdmin) {
      console.log("Admin detected, redirecting to admin dashboard")
    }
  }, [isAdmin])

  const {
    data: analyticsData,
    isLoading: isLoadingAnalytics,
    error: analyticsError,
  } = useAPI<
    | AnalyticsResponse
    | { analytics?: AnalyticsResponse; data?: AnalyticsResponse }
  >(isAuthenticated ? API_ENDPOINTS.ANALYTICS.ME : null, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const analytics: AnalyticsResponse | null = analyticsData
    ? (analyticsData as any).analytics ||
      (analyticsData as any).data ||
      (analyticsData as AnalyticsResponse)
    : null
  const error = analyticsError ? (analyticsError as Error).message : null

  useEffect(() => {
    if (analyticsData) {
      console.log("Analytics raw data:", analyticsData)
      console.log("Analytics parsed:", analytics)
    }
  }, [analyticsData, analytics])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = localStorage.getItem("auth-storage")
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      const userData = parsedUser?.state?.session?.user || null

      const name =
        userData?.user_metadata?.name ||
        userData?.user_metadata?.full_name ||
        "User"
      setDisplayName(name)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (isAdmin && !hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        router.replace("/admin/dashboard")
        return
      }
      if (!isAuthenticated) {
        router.replace("/login")
      }
    }
  }, [isAdmin, isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">
            Redirecting to admin dashboard...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    const sign = isPositive ? "+" : ""
    const Icon = isPositive ? TrendingUp : TrendingDown
    const roundedChange = Math.round(change * 10) / 10 // Round to 1 decimal place
    return (
      <span
        className={`flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}
      >
        <Icon className="h-4 w-4" />
        {sign}
        {roundedChange}
        {change === 0 ? "" : " this week"}
      </span>
    )
  }

  const formatTime = (seconds: number) => {
    const roundedSeconds = Math.round(seconds)
    if (roundedSeconds < 60) {
      return `${roundedSeconds}s`
    }
    const minutes = Math.floor(roundedSeconds / 60)
    const remainingSeconds = roundedSeconds % 60
    if (minutes < 60) {
      return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`
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
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-sm text-gray-600 sm:text-base">
              Let&apos;s continue your learning journey. Keep up the great work!
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            {/* <Button
              disabled
              variant="outline"
              size="lg"
              onClick={() => router.push("/ai-tutor")}
              className="w-full sm:w-auto"
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Chat with AI Tutor</span>
              <span className="sm:hidden">AI Tutor</span>
            </Button> */}
            <Button
              size="lg"
              onClick={() => router.push("/topics/new")}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-5 w-5" />
              Start New Topic
            </Button>
          </div>
        </div>

        {isLoadingAnalytics ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        ) : analyticsData ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      Overall Progress
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {analytics?.overview?.overallProgress != null
                        ? `${Math.round(analytics.overview.overallProgress)}%`
                        : "0%"}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm">
                  {analytics?.weeklyComparison?.progress
                    ? formatChange(analytics.weeklyComparison.progress.change)
                    : "No data"}
                </p>
              </div>

              <div className="hidden rounded-lg bg-white p-4 shadow-sm sm:block sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      Topics Mastered
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {analytics?.weeklyComparison?.topics?.thisWeek ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm">
                  {analytics?.weeklyComparison?.topics
                    ? formatChange(analytics.weeklyComparison.topics.change)
                    : "No data"}
                </p>
              </div>

              <div className="hidden rounded-lg bg-white p-4 shadow-sm sm:block sm:p-6 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-600 sm:text-sm">
                      Quizzes Taken
                    </p>
                    <p className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {analytics?.weeklyComparison?.attempts?.thisWeek ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs sm:text-sm">
                  {analytics?.weeklyComparison?.attempts
                    ? formatChange(analytics.weeklyComparison.attempts.change)
                    : "No data"}
                </p>
              </div>
            </div>

            {/* {subscription && usage && (
              <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {subscription.plan.name}
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600">
                        {usage.topicsCount}/{subscription.maxTopics} topics
                      </span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600">
                        {usage.quizzesCount}/{subscription.maxQuizzes} quizzes
                      </span>
                    </div>
                  </div>
                  <Link href="/subscription">
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      Manage
                    </Button>
                  </Link>
                </div>
              </div>
            )} */}

            {analytics?.time && (
              <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Total Time Spent
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {formatTime(analytics.time.totalTimeSpent)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Across all quizzes
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Average Time Spent
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {formatTime(analytics.time.averageTimeSpent)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">Per quiz</p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Total Time Allocated
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
                    {formatTimeFromMs(analytics.time.totalTimeSet)}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Time set for quizzes
                  </p>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                  <p className="text-xs font-medium text-gray-600 sm:text-sm">
                    Time Efficiency
                  </p>
                  <p className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl">
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
              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Your Performance Over Time
                  </h2>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setTimeRange("last7Days")}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                      timeRange === "last7Days"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("last30Days")}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
                      timeRange === "last30Days"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setTimeRange("last90Days")}
                    className={`rounded-md px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
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
                      <div className="flex h-[300px] items-center justify-center text-gray-500">
                        No data available for this period
                      </div>
                    )
                  }

                  if (!hasAnyScores) {
                    return (
                      <div className="flex h-[300px] flex-col items-center justify-center text-gray-500">
                        <p className="mb-2 text-lg font-medium">
                          No quiz attempts yet
                        </p>
                        <p className="text-sm">
                          Start taking quizzes to see your performance over
                          time!
                        </p>
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
                          label={{
                            value: "Score %",
                            angle: -90,
                            position: "insideLeft",
                          }}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${Math.round(value)}%`,
                            "Average Score",
                          ]}
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

              <div className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                    Topics Overview
                  </h2>
                </div>
                <div className="space-y-4">
                  {!analytics?.topics || analytics.topics.length === 0 ? (
                    <p className="py-8 text-center text-gray-500">
                      No topics yet. Start your first quiz!
                    </p>
                  ) : (
                    <>
                      {[...analytics.topics]
                        .sort((a, b) => {
                          // Sort by most recent: null lastAttemptAt (newly created) first,
                          // then by lastAttemptAt descending (most recent first)
                          if (
                            a.lastAttemptAt === null &&
                            b.lastAttemptAt === null
                          )
                            return 0
                          if (a.lastAttemptAt === null) return -1
                          if (b.lastAttemptAt === null) return 1
                          return (
                            new Date(b.lastAttemptAt).getTime() -
                            new Date(a.lastAttemptAt).getTime()
                          )
                        })
                        .slice(0, 3)
                        .map((topic) => (
                          <div
                            key={topic.topicId}
                            className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="mb-2 flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <h3 className="font-medium text-gray-900 truncate">
                                  {topic.topicName}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 sm:gap-4 sm:text-sm">
                                <span>
                                  {Math.round(topic.progressPercentage)}%
                                  complete
                                </span>
                                <span>
                                  {topic.completedQuizzes}/{topic.totalQuizzes}{" "}
                                  quizzes
                                </span>
                                <span>
                                  Avg: {Math.round(topic.averageScore)}%
                                </span>
                              </div>
                              <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                                <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{
                                    width: `${topic.progressPercentage}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                            <Link href={`/topics/${topic.topicId}`} className="w-full sm:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:ml-4 sm:w-auto"
                              >
                                {topic.progressPercentage === 100
                                  ? "Review"
                                  : topic.progressPercentage > 0
                                    ? "Continue"
                                    : "Start Quiz"}
                              </Button>
                            </Link>
                          </div>
                        ))}
                      {analytics.topics.length > 3 && (
                        <div className="pt-2">
                          <Link href="/topics">
                            <Button variant="outline" className="w-full">
                              View All Topics ({analytics.topics.length})
                            </Button>
                          </Link>
                        </div>
                      )}
                    </>
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
