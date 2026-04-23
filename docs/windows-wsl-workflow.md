# Windows/WSL Workflow

This repository can work well on Windows and WSL, but it is important to use one consistent workflow for the same working copy.

## Recommended Setup

1. Use one Git environment per working copy.
2. Use one shell family consistently for install, dev, and Git operations.
3. Keep source files on a filesystem that matches the environment you use most.

Recommended options:

- Windows-first workflow:
  - keep the repo on `D:\...`
  - use Git, Bun, and `bun` commands from PowerShell or Windows Terminal
- WSL-first workflow:
  - keep the repo under your WSL home directory, for example `~/projects/myth_story`
  - use Git, Bun, and `bun` commands from WSL only

Avoid mixing Windows Git and WSL Git against the same working copy when possible. That is the most common cause of noisy `git status` metadata changes.

## Line Endings

The repo includes:

- `.gitattributes` to enforce `LF` for source files
- `.editorconfig` to help editors save files consistently

If your editor has its own line-ending setting, prefer `LF`.

## Installing Dependencies

Use:

```bash
bun install
```

If you hit a Prisma error like:

```text
EPERM: operation not permitted, unlink ... query_engine-windows.dll.node
```

do this:

1. Stop `bun run dev`
2. Stop Prisma Studio if it is running
3. Stop any extra Node.js or Bun processes that still hold Prisma engine files
4. Run `bun install` again

If Bun postinstall warns that Prisma could not replace `query_engine-windows.dll.node`, the install can still finish. In that case:

1. Stop any running app, worker, or Prisma Studio processes
2. Run `bun run db:generate`

## Dev Workflow

Suggested order:

```bash
bun run infra:up
bun install
bun run dev
```

Before switching environments or reinstalling packages:

1. Stop `bun run dev`
2. Stop Prisma Studio
3. Run your next commands from the same environment you plan to keep using

## Git Notes

This repository is configured locally to behave better with:

- `core.autocrlf=false`
- `core.eol=lf`

If `git status` still looks noisy on a mixed Windows/WSL setup, verify content with:

```bash
git diff
git diff --stat
```

If those are empty, the remaining noise is usually filesystem metadata rather than real source changes.
