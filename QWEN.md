# Mist Story — Project Context

## Project Overview

**Mist Story** is a minimalist web platform for novel writers and readers, built with modern Next.js and integrated with the Nostr protocol for decentralized authentication.

### Core Purpose
- Provide a clean, distraction-free environment for writers to create and publish novels
- Offer readers a beautiful reading experience with discoverable stories
- Enable decentralized identity via Nostr NIP-07 browser extensions

### Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **React** | 19.2.4 |
| **Language** | TypeScript 5.7.3 |
| **Styling** | Tailwind CSS 4 + CSS custom properties (oklch) |
| **UI Library** | shadcn/ui (Radix UI primitives) |
| **Forms** | react-hook-form + zod validation |
| **Auth** | Nostr NIP-07 (browser extensions) |
| **Fonts** | Source Serif 4 (serif), Inter (sans-serif) |
| **Analytics** | Vercel Analytics |

## Building and Running

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (project uses `pnpm-lock.yaml`)

### Commands

```bash
pnpm dev          # Start dev server at localhost:3000
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

### Environment
- Uses `.env*.local` for environment variables (git-ignored)
- Nostr relays configured in code: `wss://relay.damus.io`, `wss://nos.lol`, `wss://relay.nostr.band`

## Architecture

### Directory Structure

```
mist-story/
├── app/                 # Next.js App Router pages & layouts
│   ├── about/           # Static pages
│   ├── novel/[id]/      # Novel detail & reader routes
│   ├── profile/[npub]/  # User profiles (Nostr npub)
│   ├── studio/          # Writer's studio
│   └── ...              # Other feature routes
├── components/          # React components
│   ├── ui/              # shadcn/ui primitives (auto-generated)
│   ├── sections/        # Page section components
│   └── ...              # Feature-specific components
├── context/             # React contexts
│   └── auth-context.tsx # Nostr authentication provider
├── hooks/               # Custom React hooks
│   ├── use-mobile.ts    # Mobile breakpoint detection
│   └── use-toast.ts     # Toast notifications
├── lib/                 # Utilities & types
│   ├── utils.ts         # cn() class merger
│   ├── nostr-types.ts   # Nostr type definitions
│   └── nostr-utils.ts   # Nostr NIP-07 utilities
├── public/              # Static assets
├── styles/              # Additional stylesheets
└── ...                  # Config files
```

### Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (hero, features, CTA) |
| `/library` | User's novel library |
| `/discover` | Browse stories |
| `/write` | Writing interface |
| `/novel/[id]` | Novel details |
| `/novel/[id]/read/[chapter]` | Chapter reader |
| `/studio` | Author dashboard |
| `/studio/[novelId]` | Novel editing studio |
| `/profile/[npub]` | User profile (Nostr-based) |
| `/sign-in` | Authentication page |

### Authentication Flow (Nostr NIP-07)

1. User clicks sign-in → triggers browser extension popup (e.g., nos2x, Alby)
2. Extension provides public key after user approval
3. Profile fetched from Nostr relays via WebSocket
4. Session persisted in `localStorage` (pubkey only)

**Key files:**
- `context/auth-context.tsx` — Auth provider with `useAuth()` hook
- `lib/nostr-types.ts` — TypeScript interfaces for Nostr
- `lib/nostr-utils.ts` — Bech32 encoding, relay communication, key utilities

**Authentication methods:**
- **Extension:** `signIn()` — uses `window.nostr` NIP-07 API
- **nsec:** `signInWithNsec(nsec)` — import private key directly

## Development Conventions

### Code Style
- **Strict TypeScript** — `strict: true` in `tsconfig.json`
- **ESLint** — configured via `eslint.config.mjs`
- **Path alias** — `@/*` maps to project root
- **Client components** — use `"use client"` directive when hooks/context needed

### Styling
- **CSS variables** — defined in `app/globals.css` using `oklch` color space
- **Dark mode** — `.dark` class on root element
- **Class merging** — use `cn()` utility from `lib/utils.ts`
- **Font stacks** — `--font-serif` (Source Serif 4), `--font-sans` (Inter)

### Git Workflow (from AGENTS.md)

| Rule | Description |
|------|-------------|
| 1 Task = 1 Branch | Separate branch per logical unit |
| No auto commit/push | Only when explicitly requested |
| No direct main/master | Unless explicitly requested |

**Branch naming:** `feature/<topic>`, `fix/<topic>`, `refactor/<topic>`, `docs/<topic>`, `chore/<topic>`

**Commit format:**
```
<type>: <short description>

[optional body]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Component Patterns
- **Layout components** — Navbar, Footer separate from UI primitives
- **AuthButton** — Conditional rendering via `useAuth()` hook
- **shadcn/ui** — Components in `components/ui/` follow New York style

## Key Configuration Files

| File | Purpose |
|------|---------|
| `next.config.mjs` | Next.js config (images, TypeScript settings) |
| `tsconfig.json` | TypeScript compiler options, path aliases |
| `components.json` | shadcn/ui configuration |
| `postcss.config.mjs` | Tailwind CSS + PostCSS setup |
| `package.json` | Dependencies and scripts |

## Testing

No test framework currently configured. Consider adding:
- Jest/Vitest for unit tests
- Playwright/Cypress for E2E tests

## Notes

- `pnpm-lock.yaml` present — prefer `pnpm` over `npm` for consistency
- `next.config.mjs` has `ignoreBuildErrors: true` — may need attention for production
- Images unoptimized (`images.unoptimized: true`) — useful for static exports
