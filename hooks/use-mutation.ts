import { useState } from "react"
import { apiMutations } from "@/lib/api/mutations"
import { APIError } from "@/lib/errors"

interface UseMutationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}


export function useMutation<T = any>(
  method: "post" | "put" | "patch" | "delete",
  options?: UseMutationOptions<T>
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = async (url: string, data?: any) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiMutations[method]<T>(url, data)
      options?.onSuccess?.(result)
      console.log("result", result)
      return result
    } catch (err: any) {
      let error: Error
      
      if (err.response) {
        const message = err.response.data?.message || 
                       err.response.data?.error || 
                       err.message || 
                       "An error occurred"
        const statusCode = err.response.status
        const data = err.response.data
        
        error = new APIError(message, statusCode, data)
      } else if (err instanceof Error) {
        error = err
      } else {
        error = new Error(err?.message || "An error occurred")
      }

      setError(error)
      options?.onError?.(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    mutate,
    isLoading,
    error,
  }
}
