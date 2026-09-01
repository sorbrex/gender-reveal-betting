# Gender Reveal Betting

A small, self-hosted app for placing friendly bets on a baby's gender and birth date.

## First setup

1. Create a PostgreSQL database and copy `.env.example` to `.env`.
2. Set `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`. Generate the secret with `openssl rand -base64 32`.
3. Install dependencies and start the app:

   ```bash
   npm ci
   npx prisma migrate deploy
   npm run dev
   ```

The first registered account becomes the administrator. It can reveal the result, close betting, and reset user passwords from `/admin`.

## Dockge deployment

Build the Docker image from this repository or use the GitHub Container Registry image produced by the workflow. Configure these environment variables in Dockge:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/gender_reveal?schema=public
NEXTAUTH_SECRET=a-long-random-secret
NEXTAUTH_URL=https://your-public-domain.example
```

The container applies Prisma migrations before starting. Do not use the build-only placeholder database URL as the runtime `DATABASE_URL`.

## Checks

```bash
npm run lint
npx tsc --noEmit
DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" npx prisma validate
```
