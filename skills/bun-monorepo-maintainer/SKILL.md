---
name: bun-monorepo-maintainer
description: Maintain Bun-first monorepos with workspace scripts, Bun runtime execution, Prisma client generation, and repo-wide command/docs consistency. Use when migrating Mist Story or a similar repo from pnpm/npm to Bun, fixing Bun startup issues such as missing Prisma client generation, standardizing `bun run --filter` workflows, or updating docs and agent instructions to match a Bun-based setup.
---

# Bun Monorepo Maintainer

Use this skill to keep Mist Story's tooling truly Bun-first instead of leaving half-migrated pnpm or tsx remnants behind.

## Workflow

1. Audit package-manager drift.
Search for `pnpm`, `npm run`, `tsx`, `dotenv-cli`, and outdated lock/workspace files before changing scripts.

2. Normalize root workflow.
Set the root `packageManager` to Bun, keep workspace discovery in the root `package.json`, prefer `bun run --filter ...` for workspace scripts, and use `bun --bun` when a package binary should run under Bun instead of Node.

3. Normalize workspace scripts.
Use `bun --watch` or `bun <file>.ts` for Bun-runnable TypeScript entrypoints.
Use `bun --env-file=...` when a workspace needs `.env.local` from the repo root.
Use `bun --bun <cli>` for tools such as `turbo`, `next`, `tsc`, `eslint`, and `prisma`.

4. Stabilize Prisma startup.
Ensure the repo has a root install hook that runs `bun run db:generate` so API and worker processes do not fail with `@prisma/client did not initialize yet`.
If a user already hit that state, run `bun run db:generate` before deeper debugging.

5. Update supporting docs and prompts.
Replace stale `pnpm` guidance in repo docs, agent prompts, and onboarding notes so future contributors use the same Bun commands the repo now expects.

6. Validate the migration.
Prefer this sequence:
`bun install`
`bun run db:generate`
`bun run typecheck`
Targeted `bun run --filter <workspace> <script>` checks for the packages touched

## Repo Notes

- Mist Story keeps workspaces in the root `package.json`; do not recreate `pnpm-workspace.yaml`.
- Treat `bun.lock` as the source of truth after dependency changes.
- If Windows Prisma install errors mention `query_engine-windows.dll.node`, stop running dev servers or Prisma tooling before retrying `bun install`.

## References

Read [references/repo-playbook.md](references/repo-playbook.md) for the repo-specific command patterns and migration checklist.
