import { SWRConfiguration } from "swr"
import { fetcher } from "./api/fetcher"

/**
 * Default SWR configuration
 * Can be customized per hook or component
 */
export const swrConfig: SWRConfiguration = {
  fetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000,
}
