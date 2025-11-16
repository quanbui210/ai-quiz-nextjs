import { apiClient } from "./client"

/**
 * API mutation helpers
 * Use these for POST, PUT, DELETE requests
 */

export const apiMutations = {
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data)
    return response.data
  },

  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put<T>(url, data)
    return response.data
  },

  patch: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.patch<T>(url, data)
    return response.data
  },

  delete: async <T = any>(url: string): Promise<T> => {
    const response = await apiClient.delete<T>(url)
    return response.data
  },
}
