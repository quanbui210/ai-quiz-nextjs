import useSWR from "swr"
import { fetcher } from "@/lib/api/fetcher"

/**
 * Generic API hook using SWR
 * @param endpoint - API endpoint (will be appended to base URL)
 * @param options - SWR options
 */
export function useAPI<T = any>(endpoint: string | null, options?: any) {
  const { data, error, isLoading, mutate } = useSWR<T>(
    endpoint,
    fetcher,
    options
  )

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}
