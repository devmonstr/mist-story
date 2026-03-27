# Agent Team Master Reference

Last reviewed: 2026-03-26

This guide turns the current Claude Code agent-team guidance and OpenAI Codex subagent guidance into a project-specific operating model for `mist-story`.

## Sources

- Claude Code agent teams: [code.claude.com/docs/en/agent-teams](https://code.claude.com/docs/en/agent-teams)
- OpenAI Codex subagents: [developers.openai.com/codex/subagents](https://developers.openai.com/codex/subagents)
- OpenAI Codex subagent concepts: [developers.openai.com/codex/concepts/subagents](https://developers.openai.com/codex/concepts/subagents)

## What The External Docs Mean In Practice

### Claude agent teams

Claude agent teams are best when teammates need to communicate with each other, share a task list, challenge each other's findings, and self-coordinate. The current docs emphasize:

- Start with `3-5` teammates, not a large swarm.
- Keep tasks bounded and give each teammate enough task-specific context because they do not inherit the lead's chat history.
- Avoid same-file work. Explicit ownership is the main protection against overwrite conflicts.
- Research, review, and debugging with competing hypotheses are the highest-leverage starting points.
- Agent teams are still experimental and must be enabled explicitly.

### Codex subagents

Codex subagents are better when the lead only needs distilled results back from focused workers. The current docs emphasize:

- Subagents are explicit. Codex should only spawn them when asked.
- Parallel work is useful because it reduces context pollution and context rot in the main thread.
- Read-heavy exploration, review, triage, and summarization are the safest early use cases.
- Write-heavy parallel work is fine only when ownership boundaries are crisp.
- Custom agents should be narrow, opinionated, and easy to choose from.
- Keep `agents.max_depth = 1` unless there is a very good reason to allow recursive fan-out.

## Repo Fit

Mist Story is a `pnpm` monorepo with these working areas:

| Area | Purpose | Typical change pressure |
| --- | --- | --- |
| `apps/web` | Next.js 16 product UI and studio | UI flows, auth UX, search, discover, reading and writing screens |
| `apps/api` | Express API under `/api/v1` | auth/session flow, REST behavior, uploads, orchestration |
| `apps/worker` | BullMQ background jobs | publish jobs, notifications, profile sync |
| `packages/db` | Prisma schema and repositories | schema, query behavior, search prep, persistence |
| `packages/media` | Cloudflare R2 helpers and image processing | upload flows, object keys, cache headers, optimization |
| `packages/queue` | queue contracts and producers | payload shapes and job producers |
| `packages/redis` | Redis helpers and key namespaces | sessions, cache keys, queue connections |
| `packages/shared` | shared contracts and env parsing | DTO drift, env expectations, cross-app compatibility |

The cross-layer hotspots that most often benefit from a team are:

- Nostr auth and Redis-backed session behavior
- Chapter publishing and notification flows across API, worker, queue, and DB
- Profile sync and discover/catalog behavior across API, worker, DB, and shared contracts
- Cover upload work that crosses web UX, API validation, and storage integration
- Any change to `packages/shared/**` or `packages/db/prisma/schema.prisma`

## Installed Codex Agents

Project-scoped Codex agents now live under `.codex/agents/`, with shared agent settings in `.codex/config.toml`.

| Agent | Mode | Model | Owns | Use when |
| --- | --- | --- | --- | --- |
| `mist_architect` | read-only | `gpt-5.4` high | planning only | multi-layer work, risky refactors, schema or contract changes, team shaping |
| `mist_web_builder` | workspace-write | `gpt-5.4` medium | `apps/web/**` | UI work, client flows, studio UX, app-router behavior |
| `mist_api_builder` | workspace-write | `gpt-5.4` medium | `apps/api/**` | routes, middleware, auth/session server logic, service behavior |
| `mist_data_builder` | workspace-write | `gpt-5.4` high | `packages/db/**`, `packages/shared/**`, `schema.prisma` | schema work, repositories, shared contracts, env definitions |
| `mist_media_builder` | workspace-write | `gpt-5.4` medium | `packages/media/**` | Cloudflare R2 helpers, image processing, media storage behavior |
| `mist_jobs_builder` | workspace-write | `gpt-5.4` medium | `apps/worker/**`, `packages/queue/**`, `packages/redis/**` | BullMQ, queue payloads, Redis-backed async behavior |
| `mist_reviewer` | read-only | `gpt-5.4` high | review only | correctness, regression, security, contract drift, missing tests |

Built-in Codex agents are still useful:

- `explorer` for quick read-only scanning when repo-specific guardrails are not needed
- `worker` for one-off implementation work when a project-specific role would be overkill

## Default Management Rules

1. Use a single agent first unless the work is clearly parallel.
2. If more than one layer is involved, start with `mist_architect`.
3. Keep active write agents to `2-4` most of the time. The full roster is a menu, not a default spawn set.
4. Keep `packages/shared/**` and `packages/db/prisma/schema.prisma` under one owner, usually `mist_data_builder`.
5. Do not let two writers touch the same file tree at once.
6. Ask each worker for file ownership, assumptions, and a short validation plan before large edits.
7. Wait for write agents to finish before running `mist_reviewer`.
8. Use the reviewer last, then integrate, summarize, and close completed agent threads.
9. Keep `agents.max_depth = 1` so the lead delegates once and children do not create uncontrolled fan-out.

## Claude Team Usage In This Repo

Claude agent teams do not use project agent manifest files the way Codex does, so the reusable value is the operating model and prompt shape.

For this repository:

- Use Claude teams when you want debate, direct teammate communication, or a shared task list.
- Prefer Claude research and review teams before using Claude for parallel write-heavy implementation.
- On Windows, prefer `teammateMode = "in-process"`. Claude's split-pane mode depends on `tmux` or iTerm2 and is not the safe default in Windows Terminal.
- This repo now enables Claude agent teams locally through `.claude/settings.local.json` with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- Keep the repo workflow consistent with [docs/windows-wsl-workflow.md](./windows-wsl-workflow.md) so teammate sessions do not add avoidable environment noise.

## Standard Team Recipes

### 1. Cross-layer feature team

Use for features that touch one UI surface plus one or two backend layers.

Recommended agents:

- `mist_architect`
- one or more of `mist_web_builder`, `mist_api_builder`, `mist_data_builder`, `mist_media_builder`, `mist_jobs_builder`
- `mist_reviewer`

Codex prompt starter:

```text
Use subagents for this task. First spawn mist_architect to map impact, split the work,
and assign file ownership. Then spawn mist_web_builder for apps/web changes and
mist_api_builder for apps/api changes. Keep packages/shared and schema files under
mist_data_builder if they need to change. Use mist_media_builder for packages/media
or Cloudflare R2 image pipeline work. Wait for the write agents, then run
mist_reviewer and summarize the outcome plus residual risk.
```

### 2. Auth and session team

Use for Nostr auth, cookies, session validation, and protected-route behavior.

Recommended agents:

- `mist_architect`
- `mist_api_builder`
- `mist_web_builder`
- `mist_data_builder` only if contracts or env definitions change
- `mist_reviewer`

Ownership rule:

- `mist_api_builder` owns session and middleware behavior in `apps/api/**`
- `mist_web_builder` owns sign-in UX and client auth flow in `apps/web/**`
- `mist_data_builder` owns shared auth contracts and env changes

### 3. Publishing and notification team

Use for chapter publishing, notification dispatch, or profile sync work.

Recommended agents:

- `mist_architect`
- `mist_api_builder`
- `mist_jobs_builder`
- `mist_data_builder`
- `mist_reviewer`

Ownership rule:

- `mist_jobs_builder` owns `apps/worker/**`, `packages/queue/**`, and `packages/redis/**`
- `mist_data_builder` owns queue payload contract changes only if they live in shared or DB-owned files

### 4. Media and image pipeline team

Use for profile images, cover uploads, R2 object lifecycle, or image optimization work.

Recommended agents:

- `mist_architect`
- `mist_api_builder`
- `mist_media_builder`
- `mist_jobs_builder` if a worker touches optimization or async cleanup
- `mist_data_builder` only if shared media contracts or env definitions change
- `mist_reviewer`

Ownership rule:

- `mist_media_builder` owns `packages/media/**`
- `mist_api_builder` owns upload endpoints and request validation in `apps/api/**`
- `mist_jobs_builder` owns background image optimization or cleanup in `apps/worker/**`, `packages/queue/**`, and `packages/redis/**`

### 5. PR review team

Use when you want maximum signal with minimal edit risk.

Recommended agents:

- `mist_architect` or built-in `explorer` for affected-area mapping
- `mist_reviewer`
- optional second read-only specialist if the review needs deep docs verification

Codex prompt starter:

```text
Review this branch with subagents. Spawn mist_architect to map the affected code paths,
spawn mist_reviewer to find correctness, auth/session, queue, and test risks, wait for
both, then summarize findings by severity with file references.
```

### 6. Bug hunt with competing hypotheses

This is the place where Claude teams can outperform Codex subagents because teammate-to-teammate debate matters.

Claude prompt starter:

```text
Create an agent team to investigate this bug. Use 4 teammates:
- one focused on web reproduction
- one on API behavior
- one on worker or queue behavior
- one acting as skeptic who challenges the leading theory

Have them share findings with each other, keep a task list, and converge on the most
likely root cause before proposing fixes. Use in-process mode.
```

## File Ownership Matrix

Use this matrix before spawning writers:

| File tree | Default owner |
| --- | --- |
| `apps/web/**` | `mist_web_builder` |
| `apps/api/**` | `mist_api_builder` |
| `apps/worker/**` | `mist_jobs_builder` |
| `packages/db/**` | `mist_data_builder` |
| `packages/media/**` | `mist_media_builder` |
| `packages/shared/**` | `mist_data_builder` |
| `packages/queue/**` | `mist_jobs_builder` |
| `packages/redis/**` | `mist_jobs_builder` |

If a task needs multiple owners in one tree, the split is probably still too broad.

## Prompting Checklist For Future Teams

Before spawning agents, the lead should explicitly state:

1. What the task is.
2. Which files or trees each agent owns.
3. Whether the lead should wait for all agents before continuing.
4. What validation each agent should run or report.
5. What final output format is needed.

Good prompt fragments:

- `Map the affected code paths first and propose file ownership.`
- `Stay read-only and return findings with file references.`
- `Do not edit packages/shared unless you are the assigned owner.`
- `Wait for all write agents before reviewing.`
- `Summarize outcome, residual risk, and any skipped validation.`

## Maintenance Rules

- Update `.codex/agents/*.toml` when new packages, major workflows, or ownership boundaries appear.
- If one agent repeatedly needs exceptions to edit another agent's files, split the roles again.
- Revisit this guide after major architecture shifts, especially auth, queues, schema, storage, or monorepo package changes.
- Re-check the upstream docs periodically because both Claude agent teams and Codex subagent guidance can evolve.
