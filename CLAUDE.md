# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Inkwell** is a minimalist web platform for novel writers and readers built with Next.js 16, React 19, and Tailwind CSS 4. The platform integrates with the Nostr protocol via NIP-07 browser extensions for decentralized authentication.

## Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **React**: 19.2.4
- **Styling**: Tailwind CSS 4 with CSS custom properties for theming
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Forms**: react-hook-form with zod validation
- **Fonts**: Source Serif 4 (serif), Inter (sans-serif)

### Directory Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - Shared React components
- `components/ui/` - shadcn/ui components (auto-generated)
- `lib/` - Utility functions and types
- `context/` - React contexts (currently: auth)
- `hooks/` - Custom React hooks

### Key Routes
- `/` - Landing page with hero, features, and CTA
- `/library`, `/discover`, `/write` - Core app features
- `/novel/[id]` - Novel details, `/novel/[id]/read/[chapter]` - Reader
- `/studio` and `/studio/[novelId]` - Writing studio for authors
- `/profile/[npub]` - User profiles using Nostr npub identifiers
- `/sign-in` - Authentication page

### Authentication Flow
The app uses Nostr NIP-07 browser extensions (e.g., nos2x, Alby) for authentication:
1. User clicks sign in, triggering extension popup
2. Extension provides public key after user approval
3. Profile fetched from Nostr relays (currently using wss://relay.damus.io)
4. Session persisted via localStorage pubkey

See [lib/nostr-types.ts](lib/nostr-types.ts) for type definitions and [lib/nostr-utils.ts](lib/nostr-utils.ts) for NIP-07 utilities.

### Styling Conventions
- CSS variables defined in [app/globals.css](app/globals.css) using `oklch` color space
- Dark mode via `.dark` class selector
- Use the `cn()` utility from [lib/utils.ts](lib/utils.ts) for conditional class merging
- Path alias `@/*` maps to project root

### Component Patterns
- Components use `"use client"` directive when using hooks/context
- Layout components (Navbar, Footer) are separate from UI primitives
- AuthButton handles conditional rendering based on auth state via `useAuth()` hook
