# Ding Payments — Server

Backend API for **Ding Payments**: peer-to-peer NFC payments on the [Stellar](https://stellar.org) network (testnet MVP).

The server validates NFC payment requests against the `payment-request.v1` contract, orchestrates the payment lifecycle, relays signed transactions to Stellar, and exposes transaction history.

> **Mobile client:** The Expo app lives in a separate repository — [Ding-Payments/ding-payments](https://github.com/Ding-Payments/ding-payments).

## Tech stack

| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Framework        | NestJS 11                              |
| Language         | TypeScript 5.7 (strict)                |
| ORM              | Prisma + PostgreSQL                    |
| Database hosting | Supabase                               |
| Session auth     | Supabase Auth (JWT)                    |
| Payment auth     | WebAuthn (passkeys)                    |
| Blockchain       | `@stellar/stellar-sdk` (Horizon + RPC) |
| Validation       | `class-validator`, `class-transformer` |
| Config           | `@nestjs/config` + Joi                 |
| API docs         | `@nestjs/swagger`                      |
| Tests            | Jest + Supertest                       |

## Prerequisites

- **Node.js 20+** and npm
- A **Supabase** project with PostgreSQL (`DATABASE_URL` and `DIRECT_URL`)
- Stellar **testnet** access (default URLs are provided in `.env.example`)

## Project setup

```bash
# Install dependencies
npm install

# Configure environment (Windows: copy .env.example .env)
cp .env.example .env
# Edit .env with your Supabase credentials and secrets

npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run start:dev
```

The API is versioned under `/v1`. Swagger UI is available at `/docs` when the server is running.

## Scripts

| Command                   | Description             |
| ------------------------- | ----------------------- |
| `npm run start:dev`       | Start with hot reload   |
| `npm run start:prod`      | Run compiled build      |
| `npm run build`           | Compile TypeScript      |
| `npm run lint`            | Run ESLint              |
| `npm test`                | Unit tests              |
| `npm run test:e2e`        | End-to-end tests        |
| `npm run test:cov`        | Coverage report         |
| `npm run prisma:generate` | Generate Prisma client  |
| `npm run prisma:migrate`  | Create/apply migrations |
| `npm run prisma:studio`   | Open Prisma Studio      |
| `npm run prisma:seed`     | Seed development data   |

## Project structure

Project structure:

```
ding-server/
├── prisma/                 # Schema, migrations, seed
├── docs/                   # Architecture, build plan, contracts
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/             # ConfigModule + env validation
│   ├── common/             # Filters, interceptors, decorators
│   ├── database/           # PrismaService (global)
│   ├── auth/               # Supabase JWT guards
│   ├── stellar/            # Horizon/RPC integration
│   ├── webauthn/           # Passkey verification
│   ├── contracts/          # payment-request.v1 contract
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
└── test/                   # E2E tests
```

## Documentation

| Document                                                                           | Description                        |
| ---------------------------------------------------------------------------------- | ---------------------------------- |
| [docs/ding-payments.md](./docs/ding-payments.md)                                   | Product vision and UX flows        |
| [docs/server-build-plan.md](./docs/server-build-plan.md)                           | Full server build plan (SRV tasks) |
| [docs/server-build-plan-consolidated.md](./docs/server-build-plan-consolidated.md) | Consolidated task reference        |

## Supported assets (MVP)

| Asset | Network         | Notes                                      |
| ----- | --------------- | ------------------------------------------ |
| XLM   | Stellar testnet | Native asset                               |
| USDC  | Stellar testnet | Issuer via `STELLAR_USDC_ISSUER` in `.env` |

## Environment variables

Copy `.env.example` to `.env` and replace placeholders with your values. Variable groups:

- **App** — `NODE_ENV`, `PORT`, `API_PREFIX`, `CORS_ORIGINS`
- **Database** — `DATABASE_URL`, `DIRECT_URL` (Supabase PostgreSQL)
- **Supabase Auth** — `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
- **Stellar** — network, Horizon/RPC URLs, USDC issuer, network passphrase
- **WebAuthn** — RP ID, name, and origin (must match the Expo client)
- **Payments / rate limiting** — submit timeouts, poll intervals, throttle settings

See `.env.example` for the full list with placeholder values.

## Security notes

- Never commit `.env` or real secrets to the repository.
- Do not log JWTs, service role keys, or raw WebAuthn challenges.
- Hybrid auth model: Supabase session for API access + WebAuthn for payment approval.
