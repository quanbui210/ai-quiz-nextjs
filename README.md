# Quiz Next.js Frontend

A modern, production-ready Next.js application built with TypeScript, shadcn/ui, Zustand, and SWR.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful UI components
- **Zustand** - Lightweight state management
- **SWR** - Data fetching and caching
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

```bash
# On Windows (PowerShell)
Copy-Item .env.example .env

# On Mac/Linux
cp .env.example .env
```

3. The `.env` file is already configured with:
   - `NEXT_PUBLIC_API_URL=http://localhost:3001/api` (your backend URL)
   - Additional placeholders for future API keys and features

   See `ENV_SETUP.md` for detailed environment variable documentation.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers.tsx     # App providers (SWR, etc.)
├── lib/                   # Utility functions
│   ├── api/              # API client and fetchers
│   ├── utils.ts          # Utility functions
│   └── swr-config.ts     # SWR configuration
├── stores/                # Zustand stores
│   └── use-app-store.ts  # App-wide state
├── hooks/                 # Custom React hooks
│   └── use-api.ts        # API hook with SWR
└── types/                 # TypeScript type definitions
    └── index.ts
```

## Features

- ✅ TypeScript for type safety
- ✅ shadcn/ui components
- ✅ Zustand for state management
- ✅ SWR for data fetching
- ✅ Axios with interceptors
- ✅ Professional folder structure
- ✅ Tailwind CSS with dark mode support
- ✅ ESLint configuration

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without emitting

## Adding shadcn/ui Components

To add more shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

Example:

```bash
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
```

## State Management

Zustand stores are located in the `stores/` directory. Example usage:

```typescript
import { useAppStore } from "@/stores/use-app-store"

function MyComponent() {
  const { user, setUser } = useAppStore()
  // ...
}
```

## Data Fetching

Use SWR hooks for data fetching:

```typescript
import { useAPI } from "@/hooks/use-api"

function MyComponent() {
  const { data, error, isLoading } = useAPI<User>("/users/me")
  // ...
}
```

## License

ISC
