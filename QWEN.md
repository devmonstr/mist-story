# Mist Story - Project Context

## Overview

Mist Story is a Bun monorepo for a writing and reading platform with a separated frontend, API, worker, and shared packages.

## Tech Stack

| Area | Technology |
|------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| API | Express.js |
| Worker | BullMQ |
| Database | PostgreSQL + Prisma |
| Cache / Queue backend | Redis |
| Validation | Zod |
| Tooling | Bun workspaces, Turborepo, ESLint |

## Repository Structure

```text
apps/
  web/       Next.js frontend
  api/       Express API
  worker/    BullMQ consumers

packages/
  db/        Prisma schema, client, repositories
  queue/     Queue names, payload contracts, producers
  redis/     Redis clients and key helpers
  shared/    Shared DTOs, Zod schemas, env parsing
```

## Commands

```bash
bun run dev
bun run build
bun run lint
bun run typecheck
bun run db:generate
bun run db:migrate
bun run db:studio
docker compose up -d
```

## Runtime Flow

1. `apps/web` requests auth challenge from `apps/api`
2. User signs with Nostr capability on the client
3. `apps/api` verifies the signed event and creates a Redis-backed session
4. CRUD requests for novels and chapters go through `apps/api`
5. Publish actions enqueue BullMQ jobs through `packages/queue`
6. `apps/worker` consumes jobs and updates database state through `packages/db`

## Key Rules

- Web should not import Prisma directly
- Shared request/response contracts belong in `packages/shared`
- Queue payloads belong in `packages/queue`
- Redis helpers belong in `packages/redis`
- Prefer root scripts via Turbo for validation and builds
