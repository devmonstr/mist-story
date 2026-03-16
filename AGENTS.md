# Mist Story - Git Workflow

Git workflow guide for Claude Code and contributors.

## Core Rules

1. **1 Task = 1 Branch** - Create separate branch for each logical unit of work
2. **No auto commit/push** - Only when user explicitly requests
3. **No direct work on main/master** - Unless user explicitly requests

## Branch Naming

```text
feature/<topic>   → feature/nostr-auth
fix/<topic>       → fix/reader-cache
refactor/<topic>  → refactor/auth-flow
docs/<topic>      → docs/api-reference
chore/<topic>     → chore/update-deps
```

## Decision Matrix

| Situation | Action |
| --------- | ------ |
| New task + clean worktree | Create new branch |
| Same task (continuing) | Use current branch |
| Dirty worktree + unrelated new task | Ask user first |
| Minor edits within same task | No new branch needed |

## Commit Message

```text
<type>: <short description>

[optional body]

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

**Examples:**

- `feat: add Nostr login flow`
- `fix: resolve reader cache issue`
- `refactor: simplify auth context`
- `docs: update API reference`

## Safety Rules

- ❌ Never use `git reset --hard`
- ❌ Never use `git checkout --`
- ❌ Never amend existing commits
- ❌ Never discard user changes
- ✅ Stop and ask if conflict or unclear situation

## Start-of-Task Checklist

```sh
git status --short         # Check current state
git branch --show-current  # Check current branch
```

If worktree is clean + new task → Create new branch from master

## Commit Flow (when user requests)

```bash
git add <files>            # Stage relevant files
git commit                 # With clear message
git push origin <branch>   # When user requests
```
