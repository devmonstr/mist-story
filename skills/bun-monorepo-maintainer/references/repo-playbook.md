# Myth Story Bun Playbook

## Primary Commands

```bash
bun install
bun run dev
bun run dev:web
bun run dev:api
bun run dev:worker
bun run db:generate
bun run db:migrate
bun run typecheck
```

## Script Conventions

- Root workspace fan-out: `bun run --filter @mist/<pkg> <script>`
- Bun runtime for CLIs: `bun --bun <cli>`
- Bun runtime for TS entrypoints: `bun <file>.ts`
- Watch mode: `bun --watch <file>.ts`
- Shared env file: `bun --env-file=../../.env.local ...` inside workspaces

## Migration Checklist

1. Update `package.json` scripts and `packageManager`.
2. Remove pnpm-specific files when the repo no longer supports pnpm.
3. Replace `tsx watch` and `tsx <file>` with Bun runtime equivalents when compatible.
4. Add or confirm a Prisma generation step after install.
5. Refresh docs and agent instructions that still mention pnpm.
6. Regenerate `bun.lock` with `bun install`.

## Common Failure Pattern

If `apps/api` or `apps/worker` fail with:

```text
Error: @prisma/client did not initialize yet.
```

Run:

```bash
bun run db:generate
```

If the failure happened right after dependency installation, re-run:

```bash
bun install
```
