# Arc Tech Assistant

A personal assistant web app for managing daily tasks and finances in one place.  
Built with Next.js App Router, Convex, Clerk, Tailwind CSS, and shadcn/ui.

## Features

- Task management with realtime create, complete, and delete.
- Financial tracking for income, expenses, and transaction history.
- Account and wallet balances with transfer flow support.
- Credit/loan tracking with payment progress and due-date monitoring.
- Clerk authentication integrated with Convex data access.
- PWA-ready configuration for installable app behavior.

## Tech Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Convex (database + backend functions)
- Clerk (authentication)
- Tailwind CSS v4
- shadcn/ui + Radix UI
- Zustand (client-side state where needed)
- `@ducanh2912/next-pwa` (service worker/PWA support)

## Project Structure

```text
app/                  # App Router pages and dashboard UI
  (dashboard)/        # Dashboard routes: tasks, financials, credits, accounts
components/           # Shared UI components
convex/               # Convex schema and backend functions
public/               # Static assets and web manifests
lib/                  # Utilities
```

## Prerequisites

- Node.js 20+ (recommended)
- npm
- A Convex account/project
- A Clerk application

## Environment Variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
```

Notes:

- `NEXT_PUBLIC_CONVEX_URL` is required by `app/ConvexClientProvider.tsx`.
- Clerk keys are required for authenticated flows and middleware in `proxy.ts`.
- Convex auth provider settings are defined in `convex/auth.config.ts`.

## Installation

```bash
npm install
```

## Local Development

Run the frontend:

```bash
npm run dev
```

In another terminal, run Convex development sync:

```bash
npx convex dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start Next.js dev server (Turbopack)
- `npm run build` - Build production app
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Data Model (High Level)

Core Convex tables in `convex/schema.ts`:

- `tasks`
- `financials`
- `accounts`
- `income`
- `credits`
- `categories`

## Deployment Notes

- Frontend can be deployed to Vercel or any Next.js-compatible host.
- Backend functions/data are deployed through Convex.
- PWA support is enabled in production via `next.config.ts`.

## License

No license file is currently included. Add one if needed for distribution.
