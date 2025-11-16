"use client"

import { useState } from "react"
import { ProtectedAdminRoute } from "@/components/admin/protected-admin-route"
import { useAdminDashboard, useAdminUsers } from "@/hooks/use-admin"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, TrendingUp, BookOpen, FileText, CreditCard, Search, LogOut } from "lucide-react"
import { EditUserLimitsDialog } from "@/components/admin/edit-user-limits-dialog"
import Link from "next/link"

function AdminDashboardContent() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { isAdmin, signOut, isLoading: isAuthLoading, user: currentUser } = useAuth()
  const isAuthorized = isAdmin === true && !isAuthLoading

  const { stats, isLoading: isLoadingStats } = useAdminDashboard(isAuthorized)
  const { users: allUsers, pagination, isLoading: isLoadingUsers, refetch } = useAdminUsers(
    page,
    20,
    search,
    isAuthorized
  )

  const users = allUsers.filter((user) => {
    if (!currentUser) return true
    return user.id !== currentUser.id && user.email !== currentUser.email
  })

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleEditLimits = (userId: string) => {
    setSelectedUserId(userId)
    setIsEditDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsEditDialogOpen(false)
    setSelectedUserId(null)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {isLoadingStats ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading stats...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.totalUsers || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.activeSubscriptions || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {stats?.freeSubscriptions || 0} free • {stats?.paidSubscriptions || 0} paid
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.revenue?.currency || "$"}
                      {((stats?.revenue?.total || 0) / 100).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Monthly: {stats?.revenue?.currency || "$"}
                      {((stats?.revenue?.monthly || 0) / 100).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Content</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">
                      {((stats?.totalTopics || 0) + (stats?.totalQuizzes || 0) + (stats?.totalDocuments || 0)).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {stats?.totalTopics || 0} topics • {stats?.totalQuizzes || 0} quizzes •{" "}
                      {stats?.totalDocuments || 0} docs
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Topics</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.totalTopics || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Usage: {stats?.totalUsage?.topics || 0}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quizzes</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.totalQuizzes || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Usage: {stats?.totalUsage?.quizzes || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Documents</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stats?.totalDocuments || 0}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Usage: {stats?.totalUsage?.documents || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {stats?.subscriptions && stats.subscriptions.length > 0 && (() => {
              const paidSubscriptions = stats.subscriptions.filter(
                (sub) => sub.plan.name.toLowerCase() !== "free"
              )
              
              if (paidSubscriptions.length === 0) return null
              
              return (
                <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Active Subscriptions</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            User
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Plan
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Period Start
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Period End
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Cancels At End
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Limits
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Created
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {paidSubscriptions.map((subscription) => (
                        <tr key={subscription.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user.name || "No name"}
                              </div>
                              <div className="text-sm text-gray-500">{subscription.user.email}</div>
                              <div className="text-xs text-gray-400">
                                Joined: {new Date(subscription.user.joinedAt).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {subscription.plan.name}
                            </div>
                            {subscription.plan.stripePriceId && (
                              <div className="text-xs text-gray-500">
                                {subscription.plan.stripePriceId.substring(0, 20)}...
                              </div>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                subscription.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : subscription.status === "CANCELED"
                                  ? "bg-gray-100 text-gray-800"
                                  : subscription.status === "PAST_DUE"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subscription.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                            {new Date(subscription.currentPeriodStart).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                              {new Date(subscription.currentPeriodStart).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                            {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                              {new Date(subscription.currentPeriodEnd).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            {subscription.cancelAtPeriodEnd ? (
                              <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                                Yes
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">No</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            <div className="space-y-1">
                              <div className="text-xs">
                                Topics: {subscription.limits.maxTopics}
                              </div>
                              <div className="text-xs">
                                Quizzes: {subscription.limits.maxQuizzes}
                              </div>
                              <div className="text-xs">
                                Docs: {subscription.limits.maxDocuments}
                              </div>
                              <div className="text-xs text-gray-400">
                                Models: {subscription.limits.allowedModels.length}
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500">
                            {new Date(subscription.createdAt).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                              {new Date(subscription.updatedAt).toLocaleDateString()} (updated)
                            </div>
                          </td>
                        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })()}
          </>
        )}

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Users</h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email or name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch()
                    }
                  }}
                  className="w-64"
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Usage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              {user.avatarUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.avatarUrl}
                                  alt={user.name || user.email}
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                  <span className="text-sm font-medium text-blue-600">
                                    {(user.name || user.email)[0].toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || "No name"}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {user.subscription?.plan.name || "Free"}
                          </div>
                          {user.subscription && (
                            <div className="text-xs text-gray-500">
                              {user.usage.topicsCount}/{user.subscription.maxTopics} topics •{" "}
                              {user.usage.quizzesCount}/{user.subscription.maxQuizzes} quizzes
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {user.usage.topicsCount} topics • {user.usage.quizzesCount} quizzes
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              user.subscription?.status === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {user.subscription?.status || "Free"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <Button
                            onClick={() => handleEditLimits(user.id)}
                            variant="outline"
                            size="sm"
                          >
                            Edit Limits
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((page - 1) * 20) + 1} to{" "}
                      {Math.min(page * 20, pagination.total)} of {pagination.total} users
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                        disabled={page === pagination.totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedUserId && (
        <EditUserLimitsDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          userId={selectedUserId}
          onSuccess={handleCloseDialog}
        />
      )}
    </div>
  )
}

function AdminDashboardPage() {
  return (
    <ProtectedAdminRoute>
      <AdminDashboardContent />
    </ProtectedAdminRoute>
  )
}

export default AdminDashboardPage

