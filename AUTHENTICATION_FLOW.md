# Complete Authentication Flow Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Zustand Store Setup](#zustand-store-setup)
3. [Local Storage Persistence](#local-storage-persistence)
4. [Axios Interceptors](#axios-interceptors)
5. [Authentication Hooks](#authentication-hooks)
6. [API Endpoints](#api-endpoints)
7. [Login Flows](#login-flows)
8. [Route Protection](#route-protection)
9. [Session Management](#session-management)
10. [Data Flow Diagrams](#data-flow-diagrams)

---

## Architecture Overview

The authentication system uses a **client-side state management** approach with:
- **Zustand** for global state management
- **Zustand Persist** middleware for localStorage persistence
- **Axios** with interceptors for automatic token injection
- **SWR** for data fetching and caching
- **Next.js App Router** for routing

### Key Files Structure
```
stores/
  └── use-auth-store.ts        # Zustand store with persistence
hooks/
  ├── use-auth.ts              # Main auth hook
  ├── use-api.ts               # SWR-based API hook
  └── use-mutation.ts          # Mutation hook for POST/PUT/DELETE
lib/
  ├── api/
  │   ├── client.ts            # Axios instance with interceptors
  │   ├── fetcher.ts           # SWR fetcher function
  │   └── mutations.ts         # Mutation helpers
  └── constants.ts             # API endpoint constants
app/
  ├── login/page.tsx           # Regular user login (Google OAuth)
  ├── admin/login/page.tsx     # Admin login (email/password)
  ├── callback/page.tsx        # OAuth callback handler
  └── page.tsx                 # Root redirect logic
components/
  ├── protected-route.tsx      # Regular user route guard
  └── admin/protected-admin-route.tsx  # Admin route guard
```

---

## Zustand Store Setup

### File: `stores/use-auth-store.ts`

The Zustand store is the **single source of truth** for authentication state.

#### Store Structure

```typescript
interface AuthState {
  // User data
  user: SupabaseUser | null
  
  // Session tokens
  session: Session | null
  
  // Computed states
  isAuthenticated: boolean
  isLoading: boolean
  
  // Admin-specific
  isAdmin: boolean
  admin: { role: string; permissions: string[] } | null
  
  // Actions
  setAuth: (data: AuthLoginResponse | AuthSessionResponse) => void
  setUser: (user, adminData?) => void
  setSession: (session) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}
```

#### Initial State

```typescript
{
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  isAdmin: false,
  admin: null
}
```

#### Persistence Configuration

```typescript
export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({ /* store implementation */ }),
      {
        name: "auth-storage"  // localStorage key
      }
    ),
    {
      name: "AuthStore"  // Redux DevTools name
    }
  )
)
```

**Key Points:**
- `persist` middleware automatically saves state to `localStorage` under key `"auth-storage"`
- State is **automatically rehydrated** on page load
- `devtools` enables Redux DevTools integration for debugging

#### Store Actions

##### 1. `setAuth(data)`
**Purpose:** Sets complete auth state from login/callback response

**Input:** `AuthLoginResponse | AuthSessionResponse`
```typescript
{
  user: User,
  session: { access_token, refresh_token, expires_at, ... },
  isAdmin?: boolean,
  admin?: { role, permissions }
}
```

**Behavior:**
- Extracts `user` and `session` from response
- Sets `isAuthenticated = !!user && !!session`
- Sets `isAdmin` and `admin` from response
- **Automatically persists** to localStorage via Zustand persist

##### 2. `setUser(user, adminData?)`
**Purpose:** Updates user data separately (e.g., from `/auth/me` endpoint)

**Behavior:**
- Updates user while preserving existing session
- Can update admin status independently
- Recalculates `isAuthenticated` based on user + session presence

##### 3. `setSession(session)`
**Purpose:** Updates session tokens independently

**Behavior:**
- Updates session while preserving user
- Recalculates `isAuthenticated`

##### 4. `logout()`
**Purpose:** Clears all auth state

**Behavior:**
- Resets all state to initial values
- **Automatically clears** localStorage via Zustand persist

---

## Local Storage Persistence

### Storage Key: `"auth-storage"`

### Storage Format

Zustand persist stores data in this structure:

```json
{
  "state": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "user_metadata": { ... }
    },
    "session": {
      "access_token": "eyJ...",
      "refresh_token": "eyJ...",
      "expires_at": 1234567890,
      "expires_in": 3600,
      "token_type": "Bearer"
    },
    "isAuthenticated": true,
    "isLoading": false,
    "isAdmin": false,
    "admin": null
  },
  "version": 0
}
```

### Hydration Process

1. **On Page Load:**
   - Zustand persist middleware automatically reads from `localStorage.getItem("auth-storage")`
   - Parses JSON and restores state
   - Store is immediately available with persisted values

2. **Hydration Check in `useAuth`:**
   ```typescript
   const [hasHydrated, setHasHydrated] = useState(() => {
     if (typeof window !== "undefined") {
       try {
         const stored = localStorage.getItem("auth-storage")
         if (stored) {
           const parsed = JSON.parse(stored)
           if (parsed.state) {
             return true  // State exists in storage
           }
         }
       } catch (e) {
         // Invalid storage
       }
     }
     return true  // Default to true (no blocking)
   })
   ```

3. **Why Hydration Check?**
   - Prevents API calls before state is restored
   - Ensures `session.access_token` is available before making authenticated requests
   - Prevents race conditions during initial render

### Manual Token Access

The Axios interceptor manually reads from localStorage:

```typescript
const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  const authData = localStorage.getItem("auth-storage")
  if (!authData) return null
  try {
    const parsed = JSON.parse(authData)
    return parsed?.state?.session?.access_token || null
  } catch {
    return null
  }
}
```

**Why manual access?**
- Zustand store might not be initialized when interceptor runs
- Ensures token is always available for API requests
- Works independently of React component lifecycle

---

## Axios Interceptors

### File: `lib/api/client.ts`

### Axios Instance Setup

```typescript
export const apiClient = axios.create({
  baseURL: API_URL,  // NEXT_PUBLIC_API_URL or "http://localhost:3001"
  headers: {
    "Content-Type": "application/json",
  },
})
```

### Request Interceptor

**Purpose:** Automatically injects `Authorization` header with Bearer token

```typescript
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken()  // Reads from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)
```

**Flow:**
1. Every API request goes through this interceptor
2. Reads token from `localStorage.getItem("auth-storage")`
3. Extracts `parsed.state.session.access_token`
4. Adds `Authorization: Bearer <token>` header
5. Request proceeds with token attached

**Key Points:**
- Runs **before every request** automatically
- No need to manually add headers in components
- Works for both `apiClient.get/post/put/delete` and SWR fetcher

### Response Interceptor

**Purpose:** Handles 401 Unauthorized errors globally

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        const isDev = process.env.NODE_ENV === "development"
        const isLocalhost = 
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1"

        if (!isDev || !isLocalhost || error.response) {
          localStorage.removeItem("auth-storage")  // Clear auth
          window.location.href = "/login"  // Force redirect
        }
      }
    }
    return Promise.reject(error)
  }
)
```

**Behavior:**
- Catches **any 401 response** from any API call
- Clears localStorage immediately
- Redirects to `/login` (hard redirect, not router.push)
- Prevents infinite loops in development

**Why hard redirect?**
- Ensures complete page reload
- Clears all React state
- Prevents stale state issues

---

## Authentication Hooks

### File: `hooks/use-auth.ts`

### Hook Structure

```typescript
export function useAuth() {
  // 1. Hydration check
  const [hasHydrated, setHasHydrated] = useState(...)
  
  // 2. Zustand store access
  const { user, session, isAuthenticated, isLoading, isAdmin, admin, ... } = useAuthStore()
  
  // 3. Session validation API call
  const { data: sessionData, error: sessionError } = useAPI<AuthSessionResponse>(...)
  
  // 4. User data API call
  const { data: userData, error: userError } = useAPI<AuthMeResponse>(...)
  
  // 5. Error handling effects
  useEffect(() => { /* 401 handling */ })
  
  // 6. Data sync effects
  useEffect(() => { /* sync userData to store */ })
  useEffect(() => { /* sync sessionData to store */ })
  
  // 7. Actions
  const login = useCallback(...)
  const signOut = useCallback(...)
  const handleCallback = useCallback(...)
  
  return { user, session, isAuthenticated, isLoading, isAdmin, ... }
}
```

### Session Validation

```typescript
const { data: sessionData, error: sessionError } = useAPI<AuthSessionResponse>(
  hasHydrated && session && session.access_token 
    ? API_ENDPOINTS.AUTH.SESSION 
    : null,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    onErrorRetry: () => {},
    errorRetryCount: 0,
    shouldRetryOnError: false,
  }
)
```

**Conditional Fetching:**
- Only fetches if `hasHydrated === true` (state restored)
- Only fetches if `session` exists
- Only fetches if `session.access_token` exists
- Returns `null` as endpoint to disable SWR when conditions not met

**SWR Configuration:**
- `revalidateOnFocus: false` - Don't refetch on window focus
- `revalidateOnReconnect: true` - Refetch when network reconnects
- `shouldRetryOnError: false` - Don't retry on error (handled by interceptor)

### User Data Fetching

```typescript
const { data: userData, error: userError } = useAPI<AuthMeResponse>(
  hasHydrated && session && session.access_token 
    ? API_ENDPOINTS.AUTH.ME 
    : null,
  { /* same config */ }
)
```

**Purpose:** Fetches fresh user data and admin status

### Error Handling Effect

```typescript
useEffect(() => {
  if (!session || !session.access_token) {
    return
  }

  const sessionIs401 = sessionError && 
    ((sessionError as any)?.response?.status === 401 || 
     (sessionError as any)?.status === 401)
  const userIs401 = userError && 
    ((userError as any)?.response?.status === 401 || 
     (userError as any)?.status === 401)

  if (sessionIs401 || userIs401) {
    clearAuth()  // Clear Zustand store
    router.push("/login")  // Redirect
  }
}, [session, sessionError, userError, clearAuth, router])
```

**Purpose:** Handles 401 errors from session/user endpoints
- Clears auth state
- Redirects to login
- Prevents unauthorized access

### Data Sync Effects

```typescript
// Sync userData to store
useEffect(() => {
  if (userData?.user) {
    setUser(userData.user as any, {
      isAdmin: userData.isAdmin,
      admin: userData.admin || null,
    })
  }
}, [userData, setUser])

// Sync sessionData to store
useEffect(() => {
  if (sessionData) {
    setAuth(sessionData)  // Updates both user and session
  }
}, [sessionData, setAuth])
```

**Purpose:** Keeps Zustand store in sync with API responses
- Updates user data when `/auth/me` returns
- Updates session when `/auth/session` returns
- Ensures admin status is always current

### Login Action

```typescript
const login = useCallback(async () => {
  setLoading(true)
  try {
    const response = await fetch("/api/auth/login", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      throw new Error("Failed to initiate login")
    }

    const data = await response.json()
    
    if (data.url) {
      window.location.href = data.url  // Redirect to OAuth provider
    } else {
      throw new Error("No redirect URL in response")
    }
  } catch (error) {
    setLoading(false)
    throw error
  }
}, [setLoading])
```

**Flow:**
1. Calls Next.js API route `/api/auth/login` (server-side)
2. Server returns OAuth URL (e.g., Google OAuth)
3. Redirects browser to OAuth provider
4. User authenticates with Google
5. Google redirects back to `/callback` with tokens

**Note:** Uses `fetch` not `apiClient` because:
- No auth token needed (public endpoint)
- Happens before authentication

### Sign Out Action

```typescript
const { mutate: signOutMutation, isLoading: isSigningOut } = useMutation<{
  message: string
}>("post", {
  onSuccess: () => {
    clearAuth()
    router.push("/login")
  },
  onError: () => {
    clearAuth()  // Clear even on error
    router.push("/login")
  },
})

const signOut = useCallback(() => {
  signOutMutation(API_ENDPOINTS.AUTH.SIGNOUT)
}, [signOutMutation])
```

**Flow:**
1. Calls `POST /api/v1/auth/signout` (tells backend to invalidate session)
2. On success/error: Clears Zustand store
3. Redirects to `/login`

**Why clear on error?**
- Ensures user is logged out even if API call fails
- Prevents stuck authentication state

### Callback Handler

```typescript
const handleCallback = useCallback(
  async (code: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/auth/callback?code=${code}`)

      if (!response.ok) {
        throw new Error("Callback failed")
      }

      const data: AuthLoginResponse = await response.json()
      setAuth(data)  // Store auth state
      router.push("/dashboard")
    } catch (error) {
      setLoading(false)
      router.push("/login?error=callback_failed")
    } finally {
      setLoading(false)
    }
  },
  [setAuth, setLoading, router]
)
```

**Flow:**
1. Receives OAuth `code` from query params
2. Calls Next.js API route `/api/auth/callback?code=...`
3. Server exchanges code for tokens
4. Server returns `AuthLoginResponse` with user, session, isAdmin
5. Stores in Zustand via `setAuth`
6. Redirects to dashboard

---

## API Endpoints

### File: `lib/constants.ts`

### Endpoint Structure

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/v1/auth/login",           // POST - Email/password login
    CALLBACK: "/api/v1/auth/callback",     // POST - OAuth callback
    SESSION: "/api/v1/auth/session",       // GET - Validate session
    ME: "/api/v1/auth/me",                 // GET - Get current user
    SIGNOUT: "/api/v1/auth/signout",       // POST - Sign out
  },
  // ... other endpoints
}
```

### Endpoint Details

#### 1. `POST /api/v1/auth/login`
**Purpose:** Email/password authentication (admin login)

**Request:**
```json
{
  "email": "admin@admin.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": { "id": "...", "email": "...", "name": "..." },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1234567890
  },
  "isAdmin": true,
  "admin": {
    "role": "admin",
    "permissions": ["read", "write"]
  }
}
```

**Used by:** `app/admin/login/page.tsx`

#### 2. `POST /api/v1/auth/callback`
**Purpose:** Exchange OAuth tokens for app session

**Request:**
```json
{
  "access_token": "supabase_token",
  "refresh_token": "supabase_refresh",
  "provider_token": "google_token",
  "expires_at": 1234567890,
  "expires_in": 3600,
  "token_type": "bearer"
}
```

**Response:** Same as login response

**Used by:** `app/callback/page.tsx`, `hooks/use-auth.ts` (handleCallback)

#### 3. `GET /api/v1/auth/session`
**Purpose:** Validate current session and get fresh session data

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": { ... },
  "session": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "expires_at": 1234567890,
    "expires_in": 3600,
    "token_type": "Bearer"
  },
  "isAdmin": false,
  "admin": null
}
```

**Used by:** `hooks/use-auth.ts` (session validation)

#### 4. `GET /api/v1/auth/me`
**Purpose:** Get current user data and admin status

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "isAdmin": false,
  "admin": null
}
```

**Used by:** `hooks/use-auth.ts` (user data sync)

#### 5. `POST /api/v1/auth/signout`
**Purpose:** Invalidate session on backend

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "message": "Signed out successfully"
}
```

**Used by:** `hooks/use-auth.ts` (signOut)

---

## Login Flows

### Flow 1: Regular User (Google OAuth)

#### Step-by-Step Flow

1. **User clicks "Sign in with Google"**
   - Location: `app/login/page.tsx`
   - Action: `handleGoogleLogin()` calls `login()` from `useAuth()`

2. **Login Hook Executes**
   - Calls `GET /api/auth/login` (Next.js API route)
   - Server returns OAuth URL: `{ url: "https://accounts.google.com/..." }`
   - Browser redirects: `window.location.href = data.url`

3. **User Authenticates with Google**
   - User selects Google account
   - Google validates credentials
   - Google redirects to: `https://yourapp.com/callback#access_token=...&refresh_token=...`

4. **Callback Page Handles Response**
   - Location: `app/callback/page.tsx`
   - Extracts tokens from URL hash: `#access_token=...&refresh_token=...`
   - Calls `POST /api/v1/auth/callback` with tokens
   - Backend exchanges tokens, creates session, returns `AuthLoginResponse`

5. **Auth State Stored**
   - `setAuth(data)` called
   - Zustand store updated with user, session, isAdmin
   - State persisted to localStorage

6. **Redirect Based on Role**
   - If `isAdmin === true`: `router.push("/admin/dashboard")`
   - Else: `router.push("/dashboard")`

#### Code Flow

```
app/login/page.tsx
  └─> handleGoogleLogin()
      └─> useAuth().login()
          └─> fetch("/api/auth/login")
              └─> window.location.href = data.url
                  └─> Google OAuth
                      └─> Redirect to /callback#tokens
                          └─> app/callback/page.tsx
                              └─> fetch("/api/v1/auth/callback", { tokens })
                                  └─> setAuth(response)
                                      └─> router.push("/dashboard")
```

### Flow 2: Admin User (Email/Password)

#### Step-by-Step Flow

1. **User navigates to `/admin/login`**
   - Location: `app/admin/login/page.tsx`
   - Form with email and password fields

2. **User submits form**
   - Action: `handleLogin(e)`
   - Calls `apiClient.post("/api/v1/auth/login", { email, password })`
   - **Axios interceptor** adds `Authorization` header (if token exists, but won't for login)

3. **Backend validates credentials**
   - Checks email/password against database
   - Returns `AuthLoginResponse` with `isAdmin: true`

4. **Auth State Stored**
   - `setAuth(data)` called with full response
   - Zustand store updated
   - State persisted to localStorage

5. **Admin Check and Redirect**
   - If `data.isAdmin === true`: `router.push("/admin/dashboard")`
   - Else: Show error "You do not have admin privileges"

#### Code Flow

```
app/admin/login/page.tsx
  └─> handleLogin()
      └─> apiClient.post("/api/v1/auth/login", { email, password })
          └─> Backend validates
              └─> Returns AuthLoginResponse
                  └─> setAuth(data)
                      └─> router.push("/admin/dashboard")
```

---

## Route Protection

### Regular User Routes

#### File: `components/protected-route.tsx`

```typescript
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      if (!isAuthenticated) {
        router.push("/login")
      } else if (isAdmin) {
        router.push("/admin/dashboard")  // Admins can't access user routes
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated || isAdmin) {
    return null  // Don't render children
  }

  return <>{children}</>
}
```

**Protection Logic:**
- ✅ Authenticated + Not Admin → Render children
- ❌ Not Authenticated → Redirect to `/login`
- ❌ Authenticated + Admin → Redirect to `/admin/dashboard`

**Usage:**
```tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### Admin Routes

#### File: `components/admin/protected-admin-route.tsx`

```typescript
export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (!isAdmin) {
        router.push("/dashboard")  // Regular users can't access admin routes
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <AccessDenied message="Please log in. Redirecting..." />
  }

  if (!isAdmin) {
    return <AccessDenied message="Access denied. Redirecting..." />
  }

  return <>{children}</>
}
```

**Protection Logic:**
- ✅ Authenticated + Admin → Render children
- ❌ Not Authenticated → Redirect to `/admin/login`
- ❌ Authenticated + Not Admin → Redirect to `/dashboard`

**Usage:**
```tsx
<ProtectedAdminRoute>
  <AdminDashboardPage />
</ProtectedAdminRoute>
```

### Root Page Redirect

#### File: `app/page.tsx`

```typescript
export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!isLoading && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true
      if (isAuthenticated) {
        if (isAdmin) {
          router.push("/admin/dashboard")
        } else {
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, router])

  return <LoadingSpinner />
}
```

**Purpose:** Handles root `/` route
- Authenticated + Admin → `/admin/dashboard`
- Authenticated + User → `/dashboard`
- Not Authenticated → `/login`

---

## Session Management

### Session Refresh

Currently, the app does **not** implement automatic token refresh. Tokens are:
- Stored in Zustand store
- Persisted to localStorage
- Validated on each API call via `/auth/session`
- Cleared on 401 errors

### Token Expiration

Tokens have an `expires_at` timestamp. The app:
- Stores `expires_at` in session object
- Backend validates expiration on each request
- If expired, backend returns 401
- Axios interceptor catches 401 and logs out user

### Session Validation Flow

1. **On App Load:**
   - Zustand restores state from localStorage
   - `useAuth` hook initializes
   - If `session.access_token` exists, calls `GET /auth/session`
   - Backend validates token, returns fresh session data
   - Store updated with fresh data

2. **On Each API Call:**
   - Axios interceptor adds `Authorization: Bearer <token>` header
   - Backend validates token
   - If valid: Request proceeds
   - If invalid/expired: Returns 401

3. **On 401 Response:**
   - Axios response interceptor catches 401
   - Clears localStorage
   - Redirects to `/login`

---

## Data Flow Diagrams

### Complete Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INITIATES LOGIN                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/login/page.tsx                                             │
│  - User clicks "Sign in with Google"                            │
│  - handleGoogleLogin() → useAuth().login()                      │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  hooks/use-auth.ts                                              │
│  - Calls GET /api/auth/login (Next.js API route)                │
│  - Receives OAuth URL                                           │
│  - window.location.href = data.url                             │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH                                 │
│  - User authenticates                                            │
│  - Google redirects to /callback#tokens                       │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/callback/page.tsx                                          │
│  - Extracts tokens from URL hash                                │
│  - Calls POST /api/v1/auth/callback with tokens                │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                    │
│  - Exchanges OAuth tokens for app session                       │
│  - Creates/updates user in database                            │
│  - Returns AuthLoginResponse                                     │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  stores/use-auth-store.ts                                       │
│  - setAuth(data) called                                         │
│  - Updates Zustand state: user, session, isAdmin                │
│  - Zustand persist saves to localStorage                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  app/callback/page.tsx                                          │
│  - Checks data.isAdmin                                          │
│  - Redirects to /admin/dashboard or /dashboard                  │
└─────────────────────────────────────────────────────────────────┘
```

### API Request Flow with Interceptors

```
┌─────────────────────────────────────────────────────────────────┐
│  Component calls apiClient.get("/api/v1/topic/list")            │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/api/client.ts - Request Interceptor                        │
│  - Reads localStorage.getItem("auth-storage")                    │
│  - Extracts session.access_token                                │
│  - Adds Authorization: Bearer <token> header                     │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  HTTP Request Sent                                              │
│  GET /api/v1/topic/list                                         │
│  Headers: { Authorization: "Bearer eyJ..." }                    │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Backend API                                                    │
│  - Validates token                                              │
│  - Returns data or 401                                          │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  lib/api/client.ts - Response Interceptor                        │
│  - If 401:                                                       │
│    • localStorage.removeItem("auth-storage")                     │
│    • window.location.href = "/login"                             │
│  - Else: Returns response                                       │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Component receives data or error                               │
└─────────────────────────────────────────────────────────────────┘
```

### State Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Page Load / App Initialization                                │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Zustand Persist Middleware                                    │
│  - Reads localStorage.getItem("auth-storage")                    │
│  - Parses JSON                                                  │
│  - Restores state to Zustand store                              │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  hooks/use-auth.ts                                              │
│  - hasHydrated check (synchronous)                              │
│  - Reads from useAuthStore()                                    │
│  - If session exists: Calls GET /auth/session                   │
│  - If session exists: Calls GET /auth/me                         │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Responses                                                  │
│  - sessionData from /auth/session                               │
│  - userData from /auth/me                                       │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  useEffect hooks in use-auth.ts                                 │
│  - setAuth(sessionData) → Updates store                        │
│  - setUser(userData) → Updates store                            │
│  - Zustand persist saves to localStorage                        │
└──────────────────────────┬────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Components use useAuth() hook                                  │
│  - Get current state: user, session, isAuthenticated, isAdmin   │
│  - State is reactive (updates automatically)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### 1. Why Zustand + Persist?
- **Lightweight:** Smaller than Redux
- **Simple API:** Easy to use hooks
- **Built-in Persistence:** No need for custom localStorage logic
- **TypeScript Support:** Full type safety

### 2. Why Axios Interceptors?
- **Automatic Token Injection:** No manual header management
- **Global Error Handling:** Centralized 401 handling
- **Consistent:** Works for all API calls

### 3. Why SWR for Data Fetching?
- **Caching:** Reduces unnecessary API calls
- **Revalidation:** Keeps data fresh
- **Error Handling:** Built-in error states
- **Conditional Fetching:** Easy to disable when not needed

### 4. Why Separate Admin Login?
- **Different Flow:** Email/password vs OAuth
- **Different Endpoint:** Same endpoint, different validation
- **Clear Separation:** Easier to maintain

### 5. Why Hydration Check?
- **Prevents Race Conditions:** Ensures state is restored before API calls
- **Prevents Flickering:** Avoids loading states during hydration
- **Better UX:** Smooth transitions

---

## Security Considerations

### Token Storage
- ✅ Stored in localStorage (accessible to JavaScript)
- ⚠️ Vulnerable to XSS attacks
- ✅ Protected by HTTPS in production
- ✅ Tokens expire automatically

### Token Transmission
- ✅ Always sent via HTTPS
- ✅ Included in Authorization header (not URL)
- ✅ Axios interceptor ensures consistency

### Session Validation
- ✅ Backend validates token on every request
- ✅ 401 responses trigger immediate logout
- ✅ No token refresh (simpler, but requires re-login on expiry)

### Admin Access
- ✅ Backend validates admin status
- ✅ Frontend checks `isAdmin` flag
- ✅ Route guards prevent unauthorized access
- ⚠️ Frontend checks can be bypassed (backend is source of truth)

---

## Troubleshooting

### Issue: User gets logged out on refresh
**Cause:** Hydration not completing before API calls
**Solution:** Ensure `hasHydrated` check is synchronous

### Issue: 401 errors but user is logged in
**Cause:** Token expired or invalid
**Solution:** Check `expires_at` timestamp, implement token refresh

### Issue: Admin can't access admin routes
**Cause:** `isAdmin` not set in store
**Solution:** Ensure `setAuth` includes `isAdmin` and `admin` fields

### Issue: Infinite redirect loops
**Cause:** Multiple redirects happening simultaneously
**Solution:** Use `hasRedirectedRef` to prevent multiple redirects

### Issue: Token not sent in API requests
**Cause:** Interceptor not reading from localStorage correctly
**Solution:** Check `getAuthToken()` function, verify localStorage key

---

## Summary

The authentication system is a **client-side managed** system with:
- **Zustand** for state management
- **localStorage** for persistence
- **Axios interceptors** for automatic token handling
- **SWR** for data fetching
- **Route guards** for protection
- **Separate flows** for regular users (OAuth) and admins (email/password)

The system is designed to be:
- ✅ Simple and maintainable
- ✅ Type-safe with TypeScript
- ✅ Reactive with Zustand
- ✅ Persistent across page reloads
- ✅ Secure with backend validation

