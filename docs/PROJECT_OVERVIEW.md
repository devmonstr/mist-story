# Myth Story - Project Overview

**Last updated:** 2026-03-31

## Executive Summary

Myth Story is a full-stack novel reading/writing platform built with Nostr authentication, Bitcoin Lightning payments, and a PostgreSQL/Redis backend. The application supports authors publishing serialized novels with paid chapters, readers building libraries and tracking progress, and a comprehensive moderation system.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Radix UI, shadcn/ui |
| **Backend API** | Express.js 5, TypeScript (ESM) |
| **Database** | PostgreSQL via Prisma 6 |
| **Cache/Session** | Redis (ioredis) |
| **Queues** | BullMQ |
| **Storage** | Cloudflare R2 (via AWS SDK S3) |
| **Auth** | Nostr (nsec/npub keys, schnorr signatures) |
| **Payments** | Bitcoin Lightning (SATS) |
| **Package Manager** | Bun 1.3 with Turborepo |

---

## Monorepo Structure

```
myth_story/
├── apps/
│   ├── web/          # Next.js 16 frontend application
│   ├── api/          # Express.js REST API
│   └── worker/       # BullMQ background job processor
├── packages/
│   ├── db/           # Prisma schema, client, repositories
│   ├── media/        # Cloudflare R2 storage, image processing
│   ├── queue/        # BullMQ queue definitions and producers
│   ├── redis/        # Redis client and key namespaces
│   └── shared/       # Zod schemas, DTOs, contracts, env parsing
├── docs/             # Documentation
└── docker-compose.yml
```

---

## Package Dependencies

### Internal Dependencies

```
@myth/web    → @myth/shared
@myth/api    → @myth/db, @myth/media, @myth/queue, @myth/redis, @myth/shared
@myth/worker → @myth/db, @myth/media, @myth/queue, @myth/redis, @myth/shared
```

### Shared Packages

| Package | Purpose | Key Dependencies |
|---------|---------|-----------------|
| `@myth/db` | Prisma client, repositories, migrations | `@prisma/client`, `prisma` |
| `@myth/shared` | Zod schemas, Nostr contracts, env parsing | `nostr-tools`, `zod`, `ws` |
| `@myth/redis` | Redis client wrapper, key namespaces | `ioredis` |
| `@myth/queue` | BullMQ queues, job producers | `bullmq`, `@myth/shared` |
| `@myth/media` | R2 uploads, image processing | `@aws-sdk/client-s3`, `sharp` |

---

## Database Schema

### Core Models

#### User & Authentication
- **User** - Core user profile with Nostr pubkey, display info, roles (reader/writer/admin)
- **AuthAuditLog** - Authentication event tracking (challenge/verify lifecycle)
- **UserSetting** - User preferences (theme, font size, notifications)
- **UserApiKey** - API key management for programmatic access
- **UserRelay** - Nostr relay configuration per user

#### Content (Novels & Chapters)
- **Novel** - Novel metadata (title, genre, tags, cover, status, visibility)
- **Chapter** - Chapter content with draft/published states, versioning
- **ChapterVersion** - Versioned chapter revisions with encryption metadata
- **ChapterPrice** - SATS pricing per chapter
- **ChapterVersionRelayPublish** - Nostr relay publishing status

#### Social Features
- **UserFollow** - Follow relationships
- **NovelBookmark** - Reader bookmarks
- **NovelRating** - 1-5 star ratings
- **ReadingProgress** - Per-user, per-novel reading progress
- **Comment** - Nested comments with Nostr cross-posting
- **CommentLike** / **CommentLikeDelete** - Comment reactions
- **CommentMention** - User mentions in comments

#### Commerce & Payments
- **Order** / **OrderItem** - Purchase orders for chapters
- **Payment** - Lightning payment tracking (invoice, settlement)
- **Entitlement** - Chapter access grants
- **LedgerEntry** - Revenue/fee accounting
- **PayoutRequest** / **Payout** - Author payout workflow

#### Moderation & Notifications
- **Report** - Content reports (spam, harassment, etc.)
- **ModerationAuditLog** - Moderator actions
- **Notification** - User notifications (18 types)
- **NotificationPreference** - Per-user notification settings

### Key Schema Features
- 44 total models
- Comprehensive audit logging
- Optimistic concurrency with `updatedAt` timestamps
- Composite indexes for common query patterns
- CUIDs for all primary keys
- Encrypted content fields for draft chapters

---

## API Architecture (apps/api)

### Middleware Stack
1. **request-logger** - Per-request logging
2. **error-handler** - Global error handling
3. **session** - Redis-backed session management
4. **require-auth** - Authentication requirement
5. **require-recent-auth** - Sensitive operation validation
6. **validate** - Zod request validation

### Route Structure

| Route | Purpose |
|-------|---------|
| `/api/v1/auth` | Nostr challenge/verify, session management |
| `/api/v1/novels` | Novel CRUD, listing, filtering |
| `/api/v1/chapters` | Chapter CRUD, publishing, versioning |
| `/api/v1/profiles` | User profile management |
| `/api/v1/me` | Current user endpoints |
| `/api/v1/library` | User's novel library |
| `/api/v1/discover` | Catalog search, browsing |
| `/api/v1/settings` | User settings management |

### Services Layer

| Service | Responsibility |
|---------|---------------|
| `auth-service` | Nostr challenge/verify, session tokens |
| `novel-service` | Novel CRUD, cover management |
| `chapter-service` | Chapter CRUD, publishing workflow |
| `profile-service` | Profile management, image storage |
| `settings-service` | User settings, preferences |
| `catalog-service` | Search, discover, filtering |
| `discover-search-service` | Full-text search |
| `profile-sync-service` | Nostr profile data sync |
| `notification-service` | Notification dispatch |
| `novel-cover-storage` | R2 cover upload handling |
| `profile-image-storage` | R2 avatar/banner handling |

---

## Frontend Architecture (apps/web)

### App Directory Structure

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/sign-in` | Nostr login |
| `/discover` | Novel discovery, browse |
| `/search` | Search results |
| `/library` | User's novel library |
| `/my-library` | Personal library |
| `/bookmarks` | Bookmarked novels |
| `/history` | Reading history |
| `/notifications` | Notification inbox |
| `/settings` | User settings |
| `/write` | Writing dashboard |
| `/studio/new` | Create new novel |
| `/studio/[novelId]` | Novel dashboard |
| `/studio/[novelId]/settings` | Novel settings |
| `/novel/[id]` | Novel detail page |
| `/novel/[id]/read/[chapter]` | Chapter reader |
| `/profile/[npub]` | User profile |
| `/profile/[npub]/followers` | Followers list |
| `/profile/[npub]/following` | Following list |

### Key Libraries
- **@dnd-kit** - Drag and drop (studio, library management)
- **@hookform/resolvers** + **zod** - Form validation
- **@radix-ui** - Accessible UI primitives
- **lucide-react** - Icon set
- **next-themes** - Theme switching
- **sonner** - Toast notifications
- **@noble/hashes**, **@noble/secp256k1** - Nostr cryptography

### Styling
- Tailwind CSS 4 with PostCSS
- Custom utilities via `tailwind-merge` and `clsx`
- Dark/light/system theme support

---

## Authentication Flow

### Nostr Authentication

```
1. Client generates nsec (private key) or uses existing
2. Client requests challenge from POST /api/v1/auth/challenge
3. Server returns random challenge string, stores in Redis
4. Client signs challenge with nsec (schnorr signature)
5. Client sends signature + pubkey to POST /api/v1/auth/verify
6. Server verifies signature against pubkey
7. On success: creates session in Redis, sets HTTP-only cookie
8. Session middleware validates cookie on each request
```

### Session Management
- Sessions stored in Redis with TTL
- HTTP-only, secure cookies
- Session includes: `pubkey`, `userId`, `iat`, `exp`
- `require-recent-auth` middleware for sensitive operations

---

## Background Jobs (apps/worker)

### Queue System

| Queue | Purpose |
|-------|---------|
| `chapter:publish` | Publish chapter to Nostr relays |
| `notification:dispatch` | Send notifications (email, push) |
| `profile:sync` | Sync Nostr profile metadata |
| `image:process` | Image optimization, thumbnails |

### BullMQ Integration
- Redis-backed job queues
- Retry logic with exponential backoff
- Job deduplication via idempotency keys
- Worker processes jobs concurrently

---

## Media Storage (packages/media)

### Cloudflare R2 Integration
- Novel covers
- Profile avatars/banners
- Image processing with Sharp
- S3-compatible API via `@aws-sdk/client-s3`

### Image Processing
- Resize, crop, optimize
- Multiple size variants
- Content-type detection
- Filesize tracking

---

## Infrastructure

### Local Development (docker-compose.yml)

```yaml
services:
  postgres:  # PostgreSQL database
  redis:     # Redis cache/sessions/queues
```

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `R2_*` - Cloudflare R2 credentials
- `NEXT_PUBLIC_*` - Client-side configuration

---

## Key Commands

```bash
# Development
bun run dev                   # Start all apps (web, api, worker)
bun run dev:web               # Frontend only
bun run dev:api               # Backend API only
bun run dev:worker            # Worker only

# Database
bun run db:generate           # Generate Prisma client
bun run db:migrate            # Run migrations
bun run db:studio             # Open Prisma Studio
bun run db:seed:sample-catalog # Seed sample data

# Infrastructure
bun run infra:up              # Start Postgres + Redis
bun run infra:down            # Stop containers

# Build
bun run build                 # Build all packages
bun run lint                  # Lint all packages
bun run typecheck             # Type check all packages
```

---

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   @myth/web     │────▶│    @myth/api    │────▶│   @myth/worker  │
│   Next.js 16    │◀────│  Express.js 5   │◀────│   BullMQ        │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐
            │@myth/db   │ │@myth/redis│ │@myth/media│
            │Prisma     │ │Sessions   │ │R2 Storage │
            └───────────┘ └───────────┘ └───────────┘
                                 │
                          ┌──────┴──────┐
                          ▼             ▼
                   ┌──────────┐  ┌──────────┐
                   │PostgreSQL│  │ Cloudflare│
                   │Database  │  │   R2      │
                   └──────────┘  └──────────┘
```

---

## Security Considerations

1. **Nostr-based Auth** - Schnorr signatures, no password storage
2. **HTTP-only Cookies** - Session tokens not accessible to JavaScript
3. **Content Encryption** - Draft chapters encrypted at rest
4. **Audit Logging** - Auth events, moderation actions tracked
5. **Role-based Access** - Admin, writer, reader roles
6. **Input Validation** - Zod schemas on all API inputs
7. **CORS** - Configured for specific origins

---

## Development Team Structure (Existing Agents)

This project has predefined Codex agents in `.codex/agents/`:

| Agent | Scope | Model |
|-------|-------|-------|
| `myth_architect` | Planning, cross-layer work | GPT-5.4 |
| `myth_web_builder` | `apps/web/**` | GPT-5.4 |
| `myth_api_builder` | `apps/api/**` | GPT-5.4 |
| `myth_data_builder` | `packages/db/**`, `packages/shared/**` | GPT-5.4 |
| `myth_media_builder` | `packages/media/**` | GPT-5.4 |
| `myth_jobs_builder` | `apps/worker/**`, `packages/queue/**`, `packages/redis/**` | GPT-5.4 |
| `myth_reviewer` | Code review | GPT-5.4 |

See `docs/agent-team-master-reference.md` for detailed usage.

---

## Project Statistics

- **Database:** 44 models, 20+ enums
- **API Routes:** 8 route files, 12+ services
- **Frontend Pages:** 32 page components
- **Packages:** 5 shared packages
- **Notifications:** 18 notification types
- **API Methods:** Full CRUD for all entities
