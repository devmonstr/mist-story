# CLAUDE.md

This file provides guidance to Claude Code and similar coding assistants when working with this repository.

## Project Overview

**Mist Story** is a monorepo for a novel platform with:
- `apps/web` - Next.js 16 frontend
- `apps/api` - Express.js API
- `apps/worker` - BullMQ worker
- `packages/db` - Prisma/PostgreSQL access
- `packages/media` - Cloudflare R2 media helpers and image processing
- `packages/redis` - Redis helpers and key namespaces
- `packages/queue` - BullMQ queue contracts and producers
- `packages/shared` - shared Zod schemas, DTOs, and env parsing

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

## Workspace Layout

```text
apps/
  web/
  api/
  worker/

packages/
  db/
  media/
  queue/
  redis/
  shared/
```

## Architecture Notes

- Frontend talks to the backend through REST endpoints under `/api/v1`
- Auth uses Nostr challenge/verify and Redis-backed HTTP-only sessions
- PostgreSQL is accessed through Prisma in `packages/db`
- Cloudflare R2 media uploads and image processing helpers live in `packages/media`
- Redis is used for session storage, cache keys, and BullMQ connections
- Background jobs currently include chapter publishing and notification dispatch

## Important Files

- `package.json` - workspace definition via the `workspaces` field
- `turbo.json` - task orchestration
- `tsconfig.base.json` - shared TypeScript settings
- `docker-compose.yml` - local Postgres and Redis
- `packages/db/prisma/schema.prisma` - database schema

## Conventions

- Prefer `bun` over `npm`
- Keep shared contracts in `packages/shared`
- Keep reusable storage and image-processing logic in `packages/media`
- Do not access Prisma directly from `apps/web`
- Keep queue names and payloads in `packages/queue`
- Preserve user changes already present in the worktree
