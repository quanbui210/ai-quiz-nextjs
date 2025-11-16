"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { usePlans, useSubscription, useSubscriptionActions } from "@/hooks/use-subscription"
import { Check, Loader2, Zap, Crown, Sparkles, CheckCircle2, CreditCard, ExternalLink } from "lucide-react"
import { AlertCircle } from "lucide-react"

export default function SubscriptionPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading, isAdmin } = useAuth()
  const { plans, isLoading: isLoadingPlans } = usePlans()
  const { subscription, usage, isLoading: isLoadingSubscription, refetch } = useSubscription()
  const { createCheckout, isCreatingCheckout, getPortal } = useSubscriptionActions(refetch)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)

  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (isAdmin && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      router.push("/admin/dashboard")
    } else if (!isAuthLoading && !isAuthenticated && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      router.push("/login")
    }
  }, [isAuthenticated, isAuthLoading, isAdmin, router])

  if (isAuthLoading || isLoadingPlans || isLoadingSubscription) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </MainLayout>
    )
  }

  const activePlans = plans.filter((plan) => plan.isActive && !plan.isCustom)
  const currentPlan = subscription?.plan

  const getPlanButtonText = (plan: typeof activePlans[0]) => {
    if (subscription?.planId === plan.id) {
      return "Current Plan"
    }
    
    if (!subscription?.stripeSubscriptionId) {
      return plan.stripePriceId ? "Subscribe" : "Contact Sales"
    }
    
    const currentPlanIndex = activePlans.findIndex((p) => p.id === subscription?.planId)
    const targetPlanIndex = activePlans.findIndex((p) => p.id === plan.id)
    
    if (currentPlanIndex === -1 || targetPlanIndex === -1) {
      return "Subscribe"
    }
    
    if (targetPlanIndex > currentPlanIndex) {
      return "Upgrade"
    } else if (targetPlanIndex < currentPlanIndex) {
      return "Downgrade"
    }
    
    return "Subscribe"
  }

  const handleSubscribe = async (planId: string) => {
    if (subscription?.planId === planId) {
      return
    }
    try {
      setSuccessMessage(null)
      const response = await createCheckout(planId)
      
      if (response?.updated) {
        setSuccessMessage(
          response.message || `Plan updated to ${response.planName || "Premium"}!`
        )
        await refetch()
        
        setTimeout(() => {
          setSuccessMessage(null)
        }, 5000)
      }
    } catch (error) {
      console.error("Failed to create checkout:", error)
    }
  }

  const handleManageSubscription = async () => {
    try {
      setIsOpeningPortal(true)
      await getPortal()
    } catch (error) {
      console.error("Failed to open portal:", error)
      setIsOpeningPortal(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes("free")) return null
    if (planName.toLowerCase().includes("pro")) return Zap
    if (planName.toLowerCase().includes("premium")) return Crown
    return Sparkles
  }

  const getPlanColor = (planName: string) => {
    if (planName.toLowerCase().includes("free")) return "border-gray-300"
    if (planName.toLowerCase().includes("pro")) return "border-blue-500"
    if (planName.toLowerCase().includes("premium")) return "border-purple-500"
    return "border-gray-300"
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl space-y-8 py-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-2 text-gray-600">
            Choose a plan that fits your learning needs
          </p>
        </div>

        {successMessage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {subscription && usage && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Current Plan: {currentPlan?.name || "Free"}
              </h2>
              {subscription.stripeSubscriptionId && (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isOpeningPortal}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isOpeningPortal ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Manage Subscription
                      <ExternalLink className="h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Topics</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {usage.topicsCount} / {subscription.maxTopics}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage.topicsRemaining} remaining
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Quizzes</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {usage.quizzesCount} / {subscription.maxQuizzes}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage.quizzesRemaining} remaining
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-600">Documents</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {usage.documentsCount} / {subscription.maxDocuments}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {usage.documentsRemaining} remaining
                </p>
              </div>
            </div>
            {subscription.status === "ACTIVE" && subscription.currentPeriodEnd && (
              <p className="mt-4 text-sm text-gray-600">
                Current period ends:{" "}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            {subscription.stripeSubscriptionId && (
              <p className="mt-4 text-sm text-gray-500">
                Click "Manage Subscription" to update payment methods, view invoices, or cancel your subscription in Stripe.
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {activePlans.map((plan) => {
            const Icon = getPlanIcon(plan.name)
            const isCurrentPlan = subscription?.planId === plan.id
            const borderColor = getPlanColor(plan.name)

            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border-2 ${borderColor} bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
                  isCurrentPlan ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute right-4 top-4">
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      Current
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  {Icon && (
                    <div className="mb-2 flex items-center gap-2">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    </div>
                  )}
                  {!Icon && <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>}
                  {plan.price !== null && plan.price !== undefined && (
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">
                        ${(plan.price / 100).toFixed(2)}
                      </span>
                      {plan.interval && (
                        <span className="ml-1 text-sm text-gray-600">
                          /{plan.interval === "month" ? "mo" : "yr"}
                        </span>
                      )}
                    </div>
                  )}
                  {(!plan.price || plan.price === 0) && plan.isDefault && (
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-gray-900">Free</span>
                    </div>
                  )}
                </div>

                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      {plan.maxTopics} topics
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      {plan.maxQuizzes} quizzes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-700">
                      {plan.maxDocuments} documents
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <div>
                      <span className="text-sm text-gray-700">AI Models: </span>
                      <span className="text-sm font-medium text-gray-900">
                        {plan.allowedModels.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || isCreatingCheckout || !plan.stripePriceId}
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                >
                  {isCurrentPlan
                    ? "Current Plan"
                    : isCreatingCheckout
                    ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      )
                    : getPlanButtonText(plan)}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </MainLayout>
  )
}

