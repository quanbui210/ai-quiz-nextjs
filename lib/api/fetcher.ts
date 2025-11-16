import { apiClient } from "./client"

/**
 * SWR fetcher function
 * @param url - API endpoint URL
 * @returns Promise with the response data
 */
export const fetcher = async <T = any>(url: string): Promise<T> => {
  const response = await apiClient.get<T>(url)
  return response.data
}

/**
 * SWR fetcher with custom config
 */
export const fetcherWithConfig = async <T = any>(
  url: string,
  config?: any
): Promise<T> => {
  const response = await apiClient.get<T>(url, config)
  return response.data
}
