# Mist Story Monorepo

This repository is a `pnpm` monorepo with:

- `apps/web`: Next.js frontend
- `apps/api`: Express API
- `apps/worker`: BullMQ workers
- `packages/db`: Prisma + PostgreSQL access
- `packages/redis`: Redis helpers
- `packages/queue`: BullMQ contracts and queue helpers
- `packages/shared`: Shared Zod contracts and env parsing

## Getting Started

1. Copy `.env.example` to `.env.local`
2. Start infrastructure
3. Install dependencies
4. Run the workspace

```bash
pnpm infra:up
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Environment Notes

- The repository expects `LF` line endings for source files. `.gitattributes` and `.editorconfig` are included to keep Git and editors aligned.
- On Windows/WSL setups, prefer using one Git environment consistently for the same working copy to avoid noisy `git status` metadata changes.
- If `pnpm install` fails with a Prisma `EPERM` error on `query_engine-windows.dll.node`, stop any running `pnpm dev`, Prisma Studio, or Node processes that may still be locking the engine file, then run `pnpm install` again.
- See [`docs/windows-wsl-workflow.md`](docs/windows-wsl-workflow.md) for the recommended Windows/WSL workflow.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
