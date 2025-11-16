"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, Bot, FileText, Settings, LogOut, CreditCard, Crown, Zap } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "All Topics",
    href: "/topics",
    icon: BookOpen,
  },
  {
    name: "Quiz from Document",
    href: "/quizzes/quiz-from-document",
    icon: FileText,
  },
  {
    name: "AI Tutor",
    href: "/ai-tutor",
    icon: Bot,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { subscription } = useSubscription()
  const storedUser = localStorage.getItem("auth-storage")
  const parsedUser = storedUser ? JSON.parse(storedUser) : null
  const userData = parsedUser?.state?.session?.user || null

  const displayName =
    userData?.user_metadata?.name ||
    userData?.user_metadata?.full_name ||
    "User"
  const displayAvatar =
    userData?.user_metadata?.avatar_url ||
    userData?.user_metadata?.picture ||
    null
  const displayEmail = userData?.email || null

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("free")) return null
    if (planName.toLowerCase().includes("pro")) return Zap
    if (planName.toLowerCase().includes("premium")) return Crown
    return CreditCard
  }

  const PlanIcon = subscription?.plan ? getPlanIcon(subscription.plan.name) : null

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <span className="text-xl font-bold text-white">Q</span>
        </div>
        <span className="text-xl font-semibold text-gray-900">Quizzly</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Subscription Info */}
      {subscription && (
        <div className="border-t border-gray-200 px-4 py-3">
          <Link
            href="/subscription"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/subscription"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            {PlanIcon ? (
              <PlanIcon className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {subscription.plan.name}
              </p>
              {subscription.plan.price !== null && subscription.plan.price !== undefined && subscription.plan.price > 0 ? (
                <p className="truncate text-xs text-gray-500">
                  ${(subscription.plan.price / 100).toFixed(2)}
                  {subscription.plan.interval && `/${subscription.plan.interval === "month" ? "mo" : "yr"}`}
                </p>
              ) : (
                <p className="truncate text-xs text-gray-500">Free Plan</p>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* User Profile */}
      <div className="border-t border-gray-200 p-4">
        <div className="mb-4 flex items-center gap-3">
          <Avatar
            src={displayAvatar}
            alt={displayName}
            name={displayName}
            email={displayEmail}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {displayName}
            </p>
            {displayEmail && (
              <p className="truncate text-xs text-gray-500">{displayEmail}</p>
            )}
          </div>
        </div>

        {/* Settings and Logout */}
        <div className="space-y-1">
          <Link
            href="/subscription"
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/subscription"
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            )}
          >
            <CreditCard className="h-4 w-4" />
            Manage Subscription
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
