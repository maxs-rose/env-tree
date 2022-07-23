# Cloud Secret storage

## Tech
- Yarn
- Turbo Repo
- Next.js
- Prisma
- TRPC

## Setup POC

- `yarn install`
- Create `.env` file in `apps/cloud` with `DATABASE_URL="file:./dev.db"`
- `yarn primsa migrate dev`
- `yarn prisma generate`
- `yarn dev`