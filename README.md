<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" />
</p>

# Ding Payments — Server

Backend API for Ding Payments: a self-custodial Stellar P2P payment app with NFC and passkey support.

Built with NestJS 11, Prisma 6, Supabase, and the Stellar SDK.

## Prerequisites

- Node.js 20+
- npm
- Supabase project (PostgreSQL)
- Access to `.env` credentials from the team

## Setup

```bash
cp .env.example .env
# Fill in credentials from the team, then:
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

## Scripts

```bash
npm run start:dev          # Development with watch
npm run build              # Production build
npm run start:prod         # Run production build
npm run test               # Unit tests
npm run test:e2e           # E2E tests
npm run test:cov           # Coverage report
npm run lint               # Lint and fix
```

## Prisma scripts

```bash
npm run prisma:generate        # Regenerate Prisma client after schema changes
npm run prisma:migrate         # Apply pending migrations (uses DIRECT_URL)
npm run prisma:migrate:deploy  # Deploy migrations in CI/CD
npm run prisma:studio          # Open Prisma Studio
npm run prisma:seed            # Seed development data
npm run prisma:reset           # Reset DB and re-apply all migrations
```

## Database — Supabase + Prisma

This project uses **Supabase** as the PostgreSQL host with two connection strings:

| Variable | Purpose | Port |
|----------|---------|------|
| `DATABASE_URL` | Pooled connection via PgBouncer (runtime queries) | 6543 |
| `DIRECT_URL` | Direct PostgreSQL connection (migrations only) | 5432 |

Both are required. `DIRECT_URL` is needed so `prisma migrate dev` bypasses PgBouncer,
which does not support DDL statements in transaction mode.

### Getting the connection strings

1. Open your Supabase project → **Settings → Database**
2. Copy **Connection string → URI** (port 6543) → `DATABASE_URL` (append `?pgbouncer=true`)
3. Copy **Direct connection** (port 5432) → `DIRECT_URL`

### Important

- Never run `prisma migrate dev` without coordinating with the team — migrations are shared state.
- Schema changes must go through a PR before applying to the shared dev database.
- The schema source of truth is `prisma/schema.prisma`.

## Project structure