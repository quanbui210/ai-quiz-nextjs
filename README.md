# Quiz Next.js Frontend

A full-stack quiz application built with Next.js 14, TypeScript, and modern React patterns. Features AI-powered quiz generation, suggestion and explanation, real-time progress tracking, AI tutor and RAG-based quiz generation from documentation.

## Tech Stack

- **Next.js 14** (App Router) - Server-side rendering and routing
- **TypeScript** - Type safety across the application
- **React 18** - Component-based UI
- **Zustand** - Global state management (auth, UI state)
- **SWR** - Data fetching with caching and revalidation
- **Axios** - HTTP client with interceptors
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Component library built on Radix UI
- **Recharts** - Data visualization for analytics
- **Playwright** - E2E testing

## Core Features

### Quiz Generation
- AI-powered topic suggestions via API
- Real-time topic validation before quiz creation
- Configurable difficulty levels (Beginner, Intermediate, Advanced)
- Custom timer settings (5/10/15/30 minutes or no timer)
- Multiple quiz types support

### Quiz Taking
- Question-by-question navigation
- Real-time countdown timer
- **Pause/Resume functionality**: Save quiz state, resume later with preserved answers and elapsed time
- Auto-save answers as user progresses
- Progress indicator showing answered/total questions

### Analytics Dashboard
- Weekly comparison metrics (attempts, topics, progress)
- Time range filters (7/30/90 days)
- Line charts for progress visualization
- Topic-specific statistics
- Trend indicators (up/down) for weekly changes

### Topic Management
- CRUD operations for topics
- Inline editing with optimistic updates
- Topic detail view with associated quizzes
- Statistics per topic (attempts, average score, time spent)

### Authentication
- Google OAuth integration
- Session management with token refresh
- Protected routes with middleware
- Client-side auth state with Zustand

## Architecture

### State Management
- **Zustand store** (`stores/use-auth-store.ts`) - Authentication state
- **SWR hooks** (`hooks/use-api.ts`) - Server state with caching
- **Custom mutation hook** (`hooks/use-mutation.ts`) - POST/PUT/DELETE operations

### API Integration
- Centralized endpoints in `lib/constants.ts`
- Axios interceptors for auth token injection
- Error handling with custom `APIError` class
- Response normalization for varying API response formats

### Component Structure
```
components/
  ├── layout/          # MainLayout, Sidebar
  ├── quiz/            # QuizGenerationDialog, quiz components
  ├── topics/          # Topic-related components
  └── ui/              # shadcn/ui components
```

### Data Flow
1. **GET requests**: `useAPI` hook → SWR → Axios → API
2. **Mutations**: `useMutation` hook → Axios → API → Optimistic updates
3. **Auth**: Zustand store → localStorage → API interceptors

## Key Technical Decisions

### Pause/Resume Implementation
- Quiz state stored on backend with `attemptId`
- Frontend tracks `elapsedTime` and `timeSpent` separately
- Resume endpoint returns saved answers and elapsed time
- Timer resumes from saved elapsed time on quiz load

### Data Fetching Strategy
- SWR for GET requests (caching, revalidation, error retry)
- Custom `useMutation` for mutations (loading states, error handling)
- Response unwrapping handles different API response formats (`data`, `analytics`, direct response)

### Error Handling
- Custom `APIError` class with status codes
- Centralized error handling in hooks
- User-friendly error messages in UI
- 401 handling redirects to login

### Type Safety
- TypeScript interfaces for all API responses
- Prisma types for database models
- Type-safe hooks with generics

## Pages & Routes

- `/login` - Landing page with OAuth
- `/dashboard` - Analytics and overview
- `/topics` - Topic list with CRUD
- `/topics/[id]` - Topic detail with quiz list
- `/quizzes/[id]` - Quiz taking interface
- `/quizzes/[id]/results` - Quiz results review

## Testing

- **Playwright E2E tests** - Quiz pause/resume, validation, creation flows
- **Vitest** - Unit tests for utilities
- **Testing Library** - Component tests

## API Endpoints Used

- `GET /api/v1/auth/session` - Session validation
- `GET /api/v1/auth/me` - User info
- `GET /api/v1/topic` - List topics
- `GET /api/v1/topic/:id` - Topic detail
- `PUT /api/v1/topic/:id` - Update topic
- `DELETE /api/v1/topic/:id` - Delete topic
- `GET /api/v1/quiz/:id` - Get quiz
- `POST /api/v1/quiz/:id/pause` - Pause quiz
- `POST /api/v1/quiz/:id/resume` - Resume quiz
- `POST /api/v1/quiz/:id/submit` - Submit quiz
- `GET /api/v1/quiz/:id/results` - Get results
- `GET /api/v1/results/analytics/me` - Analytics data

## Development Notes

- Uses Next.js App Router (not Pages Router)
- Client components marked with `"use client"`
- Protected routes handled client-side with `ProtectedRoute` component
- OAuth callback handled via `/callback` page
- Environment variables for API URL configuration

## Future Enhancements

- AI Tutor chat interface
- Document upload for quiz generation (RAG)
- Advanced analytics and recommendations
- Social features and sharing

