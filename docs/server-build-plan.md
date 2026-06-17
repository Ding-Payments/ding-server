# Ding Payments — Server Build Plan

> **Master implementation document for the backend (`ding-server`)**
>
> Version: 1.0 · Date: 2026-06-17 · Scope: server MVP
>
> **Required references:**
> - [ding-payments.md](./ding-payments.md) — product vision and UX flows
> - [payment-request.v1.md](./payment-request.v1.md) — canonical NFC contract (restore in SRV-031)
> - Client repo: `ding-payments/` — has its own task plan; **this document is server-only**

---

## Table of contents

1. [Document usage guide](#1-document-usage-guide)
2. [Product context (server)](#2-product-context-server)
3. [Target technical architecture](#3-target-technical-architecture)
4. [Data model (Prisma)](#4-data-model-prisma)
5. [API Surface (MVP)](#5-api-surface-mvp)
6. [Payment state machine](#6-payment-state-machine)
7. [Task summary table](#7-task-summary-table)
8. [Phases and detailed tasks](#8-phases-and-detailed-tasks)
9. [Client ↔ server dependency matrix](#9-client-server-dependency-matrix)
10. [Risks and open decisions](#10-risks-and-open-decisions)
11. [Appendices](#11-appendices)

---

## 1. Document usage guide

### Purpose

This document is the complete technical backlog for the Ding Payments server. Each task (`SRV-###`) is designed to be executed by an agent or developer **without exploring the repository or reading other docs**, except for the explicit references in each task.

Use it to:
- Split work into epics, sprints, and tickets
- Assign priorities and detect blockers
- Onboard AI agents with full context
- Coordinate integration with the client plan (`ding-payments`)

### Identifier conventions

| Prefix | Meaning | Example |
|---------|-------------|---------|
| `SRV-###` | Server task | `SRV-035` |
| `EPIC-##` | Grouping epic | `EPIC-04` |
| `CLI-###` | Client task (cross-reference) | `CLI-042` |

### Priorities

| Level | Meaning | When to use |
|-------|-------------|-------------|
| **P0** | MVP blocker | Without this there is no end-to-end payment |
| **P1** | Complete MVP | Required for release, does not block first demo |
| **P2** | Near post-MVP | Quality/ops improvement within 2-4 weeks post-MVP |
| **P3** | Future | Outside MVP; documented for roadmap |

### Complexity

| Code | Level | Target distribution | Estimated time |
|--------|-------|----------------------|-----------------|
| **E** | Easy | ~15% | 1–2 h |
| **M** | Medium | ~70% | 3–5 h |
| **H** | Hard | ~15% | 6–10 h |

### Blockers

- `blocked_by`: tasks that must be completed **before** starting this one
- `blocks`: tasks that depend on this one

Rule: do not start a task if any `blocked_by` is incomplete.

### Task template

Each task in Section 8 follows this structure:

```
### SRV-### — Title
| Field | Value |
**Context** — why it exists, what problem it solves
**Objective** — concrete outcome
**Acceptance criteria** — verifiable checklist
**Files** — exact create/modify paths
**Implementation** — steps and snippets
**Tests** — what to test and commands
**Client dependency** — what must exist in ding-payments
**Notes for agents** — pitfalls, skills, git references
```

### Current server state (starting point)

| Area | Status |
|------|--------|
| Code | NestJS 11 starter: only `GET /` → `"Hello World!"` |
| Database | Prisma removed in commit `5d4e9de` (reset) |
| NFC contract | Existed in git `5d4e9de^`: `payment-request.v1` — **canonical** |
| Auth | Not implemented |
| Stellar | Not implemented |
| CI | `.github/workflows/ci-server.yml` — lint, build, test |

### Confirmed architecture decisions

1. **Hybrid auth:** Supabase JWT for session/login + server-side WebAuthn for payment approval
2. **Transaction relay:** The client signs the XDR locally; the server receives the signed XDR, validates, broadcasts to Stellar, and monitors confirmation
3. **Self-custodial:** Private keys never leave the device; the server never custodies funds
4. **NFC contract:** `payment-request.v1` is the official contract (not the simplified payload from ding-payments.md)

```mermaid
sequenceDiagram
    participant Receiver as ClientReceiver
    participant Sender as ClientSender
    participant Server as dingServer
    participant Stellar as StellarNetwork

    Receiver->>Receiver: Create payment_request NFC
    Receiver->>Sender: NFC tap payload
    Sender->>Server: POST /v1/payment-requests/validate
    Server-->>Sender: valid plus normalized
    Sender->>Server: POST /v1/payments
    Sender->>Server: POST /v1/payments/id/authorize WebAuthn
    Sender->>Sender: Sign XDR locally
    Sender->>Server: POST /v1/payments/id/submit signedXDR
    Server->>Stellar: Broadcast XDR
    Server->>Stellar: Poll confirmation
    Sender->>Server: GET /v1/payments/id
    Receiver->>Server: GET /v1/payments/id
```

---

## 2. Product context (server)

### Vision

Ding Payments enables instant P2P payments via NFC on Stellar. The experience should feel like Apple Pay / Google Pay, but with a self-custodial wallet and passkeys. Blockchain complexity is invisible to the user.

Source: [ding-payments.md](./ding-payments.md)

### Receiver flow (client — context for the server)

1. User opens app → "Receive Payment"
2. Enters amount and asset (XLM or USDC)
3. App enters NFC listening mode
4. Generates `payment-request.v1` payload with `recipient` (Stellar pubkey), `amount`, `expiresAt`
5. Optionally registers the request on the server (`POST /v1/payment-requests`)
6. Transfers payload via NFC to the payer
7. Waits for confirmation — poll `GET /v1/payments/:id` or push notification (future)

**Server role:** persist request, anti-replay, expose payment status to the receiver.

### Sender flow (client — context for the server)

1. User taps phone to receiver (NFC)
2. Receives NFC payload
3. Calls `POST /v1/payment-requests/validate` for server-side validation
4. Shows confirmation screen (amount, recipient, asset)
5. User confirms → WebAuthn passkey
6. Calls `POST /v1/payments/:id/authorize` with assertion
7. Optionally `POST /v1/transactions/simulate` before signing
8. Signs Stellar transaction locally (self-custodial)
9. Sends signed XDR: `POST /v1/payments/:id/submit`
10. Poll `GET /v1/payments/:id` until `confirmed` or `failed`

**Server role:** validate, authorize with passkey, relay broadcast, monitor, persist history.

### Server vs client boundary

| Responsibility | Server | Client (`ding-payments`) |
|-----------------|----------|---------------------------|
| NFC handshake | — | Yes |
| Create NFC payload | — | Yes (receiver) |
| Validate structural payload | Yes | Optional pre-validation |
| Payment confirmation UI | — | Yes |
| Passkey ceremony (WebAuthn) | Verify assertion | Execute navigator.credentials |
| Build Stellar transaction | Simulate (optional) | Yes (before signing) |
| Sign transaction | — | Yes (local key) |
| Broadcast to Stellar | Yes (relay) | — |
| Monitor on-chain confirmation | Yes | Poll API |
| Persistent history | Yes | Render UI |
| Login / session | Supabase JWT | Supabase client SDK |
| Wallet / key management | Link pubkey | Local custody |

### MVP scope (server)

**Included:**
- `payment-request.v1` validation
- Supabase auth + WebAuthn for payments
- CRUD payment requests and payments
- Signed transaction relay
- Pre-sign simulation
- Basic transaction history
- Health checks

**Excluded (MVP):**
- Merchant mode
- QR payments
- Recurring payments
- Multi-sig
- Offline settlement
- Soroban / smart contracts
- Push notifications (documented as P3)

### Supported assets (MVP)

| Asset | Stellar type | Notes |
|-------|--------------|-------|
| `XLM` | Native | No issuer |
| `USDC` | Credit (Stellar Asset) | Requires `STELLAR_USDC_ISSUER` in env per network |

**Reference USDC issuers:**
- Testnet: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- Mainnet: `GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX5IHOJAO6A4CSJXHUA1T`

---

## 3. Target technical architecture

### Stack

| Layer | Technology |
|------|------------|
| Framework | NestJS 11 |
| Language | TypeScript 5.7 (strict) |
| ORM | Prisma 6 + PostgreSQL |
| DB hosting | Supabase |
| Session auth | Supabase Auth (JWT) |
| Payment auth | `@simplewebauthn/server` |
| Blockchain | `@stellar/stellar-sdk` (Horizon + RPC) |
| Validation | `class-validator`, `class-transformer` |
| Config | `@nestjs/config` + Joi |
| API docs | `@nestjs/swagger` |
| Events | `@nestjs/event-emitter` |
| HTTP security | `helmet`, `@nestjs/throttler` |
| Tests | Jest + Supertest |

### Target folder structure

```
ding-server/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docs/
│   ├── ding-payments.md
│   ├── payment-request.v1.md
│   ├── server-build-plan.md          # this file
│   ├── ARCHITECTURE.md               # SRV-095
│   └── API.md                        # SRV-096
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── config.module.ts
│   │   ├── env.validation.ts
│   │   └── configuration.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── decorators/
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   └── index.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── strategies/supabase.strategy.ts
│   │   ├── guards/
│   │   └── decorators/
│   ├── stellar/
│   │   ├── stellar.module.ts
│   │   └── stellar.service.ts
│   ├── webauthn/
│   │   ├── webauthn.module.ts
│   │   └── webauthn.service.ts
│   ├── contracts/
│   │   └── payment-request.v1.ts
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
└── test/
    ├── jest-e2e.json
    └── *.e2e-spec.ts
```

### HTTP request pipeline

```mermaid
flowchart LR
    Request --> Helmet
    Helmet --> CORS
    CORS --> Throttler
    Throttler --> AuthGuard
    AuthGuard --> Controller
    Controller --> Service
    Service --> Prisma
    Service --> Stellar
    Service --> EventEmitter
```

### NestJS modules and responsibilities

| Module | Responsibility |
|--------|-----------------|
| `ConfigModule` | Validated environment variables |
| `DatabaseModule` | Global PrismaService |
| `AuthModule` | Supabase JWT, guards, decorators |
| `WebAuthnModule` | Passkey registration and verification |
| `StellarModule` | Horizon/RPC, build/simulate/submit |
| `UsersModule` | Profile, link wallet |
| `PaymentRequestsModule` | Validate and persist NFC requests |
| `PaymentsModule` | Payment lifecycle, relay |
| `TransactionsModule` | History and simulation |

### Environment variables (`.env.example`)

```env
# App
NODE_ENV=development
PORT=3000
API_PREFIX=v1
CORS_ORIGINS=http://localhost:8081,exp://localhost:8081

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:PASSWORD@PROJECT.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:PASSWORD@PROJECT.supabase.com:5432/postgres

# Supabase Auth
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stellar
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
STELLAR_USDC_ISSUER=GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5
STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015

# WebAuthn
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=Ding Payments
WEBAUTHN_ORIGIN=http://localhost:8081

# Payments
PAYMENT_SUBMIT_TIMEOUT_MS=300000
PAYMENT_POLL_INTERVAL_MS=2000
PAYMENT_POLL_MAX_ATTEMPTS=30

# Rate limiting
THROTTLE_TTL_MS=60000
THROTTLE_LIMIT=100
```

### Relevant agent skills

| Skill | Path | When to use |
|-------|------|-------------|
| NestJS best practices | `.agents/skills/nestjs-best-practices/` | Modules, guards, DTOs, tests |
| Prisma setup | `.agents/skills/prisma-database-setup/` | Schema, migrations, client |
| Stellar dev | `.agents/skills/stellar-dev/` | SDK, Horizon, RPC, assets |
| Writing plans | `.agents/skills/writing-plans/` | When breaking down a task |

### Git pre-reset reference

Commit `5d4e9de^` contains recoverable partial implementation:

| File | Reuse | Rewrite |
|---------|------------|------------|
| `src/payments/contracts/payment-request.v1.ts` | Yes (direct port) | — |
| `docs/payment-request.v1.md` | Yes (restore) | — |
| `src/payment-requests/payment-requests.service.ts` | — | Yes (had incorrect ETH/BTC logic) |
| `prisma/schema.prisma` | Partial (User base) | Yes (Stellar models) |
| `src/prisma/prisma.service.ts` | Yes (adapt paths) | — |
| `src/supabase/supabase.service.ts` | Yes (adapt) | — |

---

## 4. Data model (Prisma)

### Entity-relationship diagram

```mermaid
erDiagram
    User ||--o{ Wallet : has
    User ||--o{ PaymentRequest : creates
    User ||--o{ Payment : sends
    User ||--o{ Payment : receives
    User ||--o{ Transaction : owns
    User ||--o{ WebAuthnCredential : registers
    PaymentRequest ||--o| Payment : generates
    Payment ||--o| Transaction : records
    PaymentRequest ||--o| UsedRequestId : prevents_replay
```

### Enums

```prisma
enum StellarNetwork {
  TESTNET
  MAINNET
}

enum AssetCode {
  XLM
  USDC
}

enum PaymentRequestStatus {
  CREATED
  SHARED
  EXPIRED
  CONSUMED
}

enum PaymentStatus {
  CREATED
  AUTHORIZED
  SUBMITTED
  CONFIRMED
  FAILED
}

enum TransactionDirection {
  SENT
  RECEIVED
}
```

### `User` model

Links Supabase identity with Ding profile and Stellar wallet.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK, `@default(uuid())` |
| `supabaseUserId` | String | Unique, from JWT `sub` |
| `email` | String | Unique, from JWT |
| `displayName` | String? | Optional |
| `createdAt` | DateTime | `@default(now())` |
| `updatedAt` | DateTime | `@updatedAt` |

Relations: `wallets[]`, `paymentRequests[]`, `sentPayments[]`, `receivedPayments[]`, `transactions[]`, `webauthnCredentials[]`

### `Wallet` model

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `userId` | UUID | FK → User |
| `stellarPublicKey` | String | `^G[A-Z2-7]{55}$`, unique per network |
| `network` | StellarNetwork | TESTNET o MAINNET |
| `isPrimary` | Boolean | Only one primary per user+network |
| `label` | String? | E.g.: "iPhone" |
| `createdAt` | DateTime | |

Composite index: `@@unique([stellarPublicKey, network])`
Index: `@@index([userId, isPrimary])`

### `PaymentRequest` model

Represents an NFC request generated by the receiver.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | Internal PK |
| `externalRequestId` | String? | `requestId` from NFC payload; unique if present |
| `receiverUserId` | UUID | FK → User |
| `recipient` | String | Stellar pubkey G... |
| `asset` | AssetCode | XLM o USDC |
| `amount` | Decimal | `@db.Decimal(20, 7)` — never Float |
| `memo` | String? | Max 280 chars |
| `status` | PaymentRequestStatus | Default CREATED |
| `payloadTimestamp` | DateTime | From contract `timestamp` field |
| `expiresAt` | DateTime | From contract |
| `metadata` | Json? | Optional contract field |
| `createdAt` | DateTime | |

Indexes: `@@index([receiverUserId, status])`, `@@unique([externalRequestId])`

### `Payment` model

Full lifecycle of a P2P payment.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `paymentRequestId` | UUID? | FK → PaymentRequest |
| `senderUserId` | UUID | FK → User |
| `receiverUserId` | UUID | FK → User |
| `recipient` | String | Stellar pubkey (denormalized) |
| `senderPublicKey` | String | Pubkey that signs the XDR |
| `asset` | AssetCode | |
| `amount` | Decimal | `@db.Decimal(20, 7)` |
| `status` | PaymentStatus | Default CREATED |
| `stellarTxHash` | String? | Unique when present |
| `failureReason` | String? | Code + message |
| `failureCode` | String? | E.g.: `STELLAR_TX_FAILED` |
| `authorizedAt` | DateTime? | After WebAuthn |
| `submittedAt` | DateTime? | After relay |
| `confirmedAt` | DateTime? | After ledger inclusion |
| `expiresAt` | DateTime | Inherited from request |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

Indexes: `@@index([senderUserId, status])`, `@@index([receiverUserId, status])`, `@@unique([stellarTxHash])`

### `Transaction` model

Indexed history for history UI.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `userId` | UUID | FK → User (history owner) |
| `paymentId` | UUID? | FK → Payment |
| `stellarTxHash` | String | |
| `direction` | TransactionDirection | SENT o RECEIVED |
| `counterparty` | String | Other party pubkey |
| `asset` | AssetCode | |
| `amount` | Decimal | |
| `memo` | String? | |
| `ledger` | Int? | |
| `network` | StellarNetwork | |
| `createdAt` | DateTime | On-chain or confirmation timestamp |

Index: `@@index([userId, createdAt(sort: Desc)])`

### `WebAuthnCredential` model

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `userId` | UUID | FK → User |
| `credentialId` | String | Base64url, unique |
| `publicKey` | Bytes | |
| `counter` | BigInt | Anti-clone |
| `deviceName` | String? | |
| `createdAt` | DateTime | |
| `lastUsedAt` | DateTime? | |

### `WebAuthnChallenge` model

Temporary challenges for registration and authentication.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `userId` | UUID | FK → User |
| `challenge` | String | Base64url |
| `type` | String | `registration` or `authentication` |
| `paymentId` | UUID? | If payment challenge |
| `expiresAt` | DateTime | TTL 5 min |
| `createdAt` | DateTime | |

Index: `@@index([userId, type, expiresAt])`

### `UsedRequestId` model

Anti-replay for NFC `requestId`.

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `requestId` | String | Unique |
| `paymentRequestId` | UUID | FK |
| `consumedAt` | DateTime | `@default(now())` |

### `AuditLog` model (SRV-085)

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `userId` | UUID? | |
| `action` | String | E.g.: `payment.submitted` |
| `resourceType` | String | `payment`, `payment_request` |
| `resourceId` | String | |
| `metadata` | Json? | |
| `ipAddress` | String? | |
| `createdAt` | DateTime | |

---

## 5. API Surface (MVP)

### API conventions

- Base path: `/v1`
- Auth header: `Authorization: Bearer <supabase_jwt>`
- Content-Type: `application/json`
- Errors: `{ "statusCode": number, "message": string, "code"?: string, "errors"?: [] }`
- Pagination: `?page=1&limit=20` → `{ data: [], meta: { page, limit, total } }`
- Correlation: header `X-Request-Id` (UUID, optional; server generates if absent)

### Endpoints

| Method | Route | Auth | Module | Description |
|--------|------|------|--------|-------------|
| `POST` | `/v1/payment-requests/validate` | Public | payment-requests | Validate NFC payload without persisting |
| `POST` | `/v1/payment-requests` | JWT | payment-requests | Register receiver request |
| `GET` | `/v1/payment-requests/:id` | JWT | payment-requests | Query request |
| `POST` | `/v1/payments` | JWT | payments | Create payment intent (sender) |
| `POST` | `/v1/payments/:id/authorize` | JWT + WebAuthn | payments | Verify passkey and authorize |
| `POST` | `/v1/payments/:id/submit` | JWT | payments | Receive signed XDR and relay |
| `GET` | `/v1/payments/:id` | JWT | payments | Status and details |
| `POST` | `/v1/transactions/simulate` | JWT | transactions | Simulate tx before signing |
| `GET` | `/v1/transactions` | JWT | transactions | Paginated history |
| `GET` | `/v1/users/me` | JWT | users | Profile and wallets |
| `POST` | `/v1/users/me/wallet` | JWT | users | Link Stellar pubkey |
| `POST` | `/v1/webauthn/register/options` | JWT | webauthn | Passkey registration options |
| `POST` | `/v1/webauthn/register/verify` | JWT | webauthn | Verify registration |
| `POST` | `/v1/webauthn/authenticate/options` | JWT | webauthn | Challenge for payment |
| `GET` | `/health` | Public | — | Liveness |
| `GET` | `/health/ready` | Public | — | Readiness (DB + Stellar) |
| `GET` | `/health/stellar` | Public | — | Horizon/RPC status |

### Key responses

**POST /v1/payment-requests/validate — success:**
```json
{
  "valid": true,
  "normalized": {
    "type": "payment-request",
    "version": 1,
    "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "asset": "USDC",
    "amount": "25.00",
    "timestamp": "2026-06-17T12:00:00.000Z",
    "expiresAt": "2026-06-17T12:00:30.000Z"
  },
  "errors": []
}
```

**POST /v1/payments — success:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CREATED",
  "recipient": "G...",
  "asset": "USDC",
  "amount": "25.00",
  "expiresAt": "2026-06-17T12:00:30.000Z"
}
```

**GET /v1/payments/:id — confirmed:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CONFIRMED",
  "asset": "USDC",
  "amount": "25.00",
  "recipient": "G...",
  "senderPublicKey": "G...",
  "stellarTxHash": "abc123...",
  "confirmedAt": "2026-06-17T12:00:05.000Z",
  "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123"
}
```

---

## 6. Payment state machine

### States

```mermaid
stateDiagram-v2
    [*] --> CREATED: POST payments
    CREATED --> AUTHORIZED: POST authorize WebAuthn OK
    AUTHORIZED --> SUBMITTED: POST submit XDR relay OK
    SUBMITTED --> CONFIRMED: Poll Stellar success
    SUBMITTED --> FAILED: Poll Stellar fail
    CREATED --> FAILED: Timeout without authorize
    AUTHORIZED --> FAILED: Timeout without submit
    CREATED --> FAILED: Request expired
    AUTHORIZED --> FAILED: Request expired
```

### Transitions and rules

| From | To | Trigger | Validations |
|----|---|---------|--------------|
| — | `CREATED` | `POST /v1/payments` | Valid request, not expired, sender ≠ receiver |
| `CREATED` | `AUTHORIZED` | `POST /v1/payments/:id/authorize` | Valid WebAuthn assertion, payment not expired |
| `AUTHORIZED` | `SUBMITTED` | `POST /v1/payments/:id/submit` | Valid XDR, matches intent, broadcast OK |
| `SUBMITTED` | `CONFIRMED` | Poll Stellar | Tx included in ledger, success result |
| `SUBMITTED` | `FAILED` | Poll Stellar | Tx failed or poll timeout |
| `CREATED` | `FAILED` | Cron/timeout | `PAYMENT_SUBMIT_TIMEOUT_MS` without authorize |
| `AUTHORIZED` | `FAILED` | Cron/timeout | Timeout without submit |
| `*` | `FAILED` | Expiration | `expiresAt` passed |

### EventEmitter2 events

| Event | Payload | Consumers |
|--------|---------|--------------|
| `payment.created` | `{ paymentId, senderUserId, receiverUserId }` | AuditLog |
| `payment.authorized` | `{ paymentId, userId }` | AuditLog |
| `payment.submitted` | `{ paymentId, stellarTxHash }` | Poll worker, AuditLog |
| `payment.confirmed` | `{ paymentId, stellarTxHash, ledger }` | Transaction indexer, AuditLog |
| `payment.failed` | `{ paymentId, failureCode, failureReason }` | AuditLog |

### Configurable timeouts

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENT_SUBMIT_TIMEOUT_MS` | 300000 (5 min) | Max time in CREATED/AUTHORIZED before FAILED |
| `PAYMENT_POLL_INTERVAL_MS` | 2000 | Interval between confirmation polls |
| `PAYMENT_POLL_MAX_ATTEMPTS` | 30 | ~60s total polling |

---

## 7. Task summary table

| ID | Title | Epic | Phase | P | C | Blocked by |
|----|--------|------|------|---|---|------------|
| SRV-001 | Update README with Ding Payments branding | EPIC-00 | 0 | P0 | E | — |
| SRV-002 | Create .env.example with all variables | EPIC-00 | 0 | P0 | E | — |
| SRV-003 | Install core server dependencies | EPIC-00 | 0 | P0 | M | — |
| SRV-004 | Configure ConfigModule and env validation | EPIC-00 | 0 | P0 | M | 002, 003 |
| SRV-005 | Bootstrap production-ready main.ts | EPIC-00 | 0 | P0 | M | 003, 004 |
| SRV-006 | Global exception filter and error format | EPIC-00 | 0 | P0 | M | 005 |
| SRV-007 | Base src/ folder structure | EPIC-00 | 0 | P0 | E | — |
| SRV-008 | Update .cursor/rules to flat layout | EPIC-00 | 0 | P1 | E | — |
| SRV-009 | Install Prisma and npm scripts | EPIC-01 | 1 | P0 | E | 003 |
| SRV-010 | Initial Prisma schema User and Wallet | EPIC-01 | 1 | P0 | M | 009 |
| SRV-011 | DatabaseModule and PrismaService | EPIC-01 | 1 | P0 | M | 004, 007, 009 |
| SRV-012 | Initial database migration | EPIC-01 | 1 | P0 | M | 010, 011 |
| SRV-013 | Extend schema PaymentRequest and Payment | EPIC-01 | 1 | P0 | M | 012 |
| SRV-014 | Extend schema Transaction WebAuthn UsedRequestId | EPIC-01 | 1 | P0 | M | 013 |
| SRV-015 | Database indexes and constraints | EPIC-01 | 1 | P0 | M | 013, 014 |
| SRV-016 | Development seed script | EPIC-01 | 1 | P1 | M | 012 |
| SRV-017 | Document Supabase connection in README | EPIC-01 | 1 | P1 | E | 001 |
| SRV-018 | Optional RLS script for Supabase | EPIC-01 | 1 | P2 | M | 012 |
| SRV-019 | Document Prisma inline transaction patterns | EPIC-01 | 1 | P1 | E | 011 |
| SRV-020 | CI prisma generate in workflow | EPIC-01 | 1 | P0 | E | 009 |
| SRV-021 | SupabaseModule and SupabaseService | EPIC-02 | 2 | P0 | M | 003, 004 |
| SRV-022 | SupabaseStrategy Passport JWT | EPIC-02 | 2 | P0 | M | 021 |
| SRV-023 | Global SupabaseAuthGuard and Public decorator | EPIC-02 | 2 | P0 | M | 022 |
| SRV-024 | CurrentUser decorator and AuthenticatedUser interface | EPIC-02 | 2 | P0 | E | 022 |
| SRV-025 | UsersModule sync user on first login | EPIC-02 | 2 | P0 | M | 011, 024 |
| SRV-026 | GET /v1/users/me | EPIC-02 | 2 | P0 | M | 025 |
| SRV-027 | POST /v1/users/me/wallet link pubkey | EPIC-02 | 2 | P0 | M | 025 |
| SRV-028 | Validate Stellar G... format in wallet | EPIC-02 | 2 | P0 | E | 027 |
| SRV-029 | Unit tests auth guards and strategy | EPIC-02 | 2 | P0 | M | 023 |
| SRV-030 | E2E auth with JWT mock | EPIC-02 | 2 | P0 | M | 005, 023 |
| SRV-031 | Restore docs/payment-request.v1.md | EPIC-03 | 3 | P0 | E | — |
| SRV-032 | Port payment-request.v1.ts from git | EPIC-03 | 3 | P0 | M | 031, 007 |
| SRV-033 | Unit tests payment-request.v1 contract | EPIC-03 | 3 | P0 | M | 032 |
| SRV-034 | PaymentRequestsModule scaffold | EPIC-03 | 3 | P0 | E | 007 |
| SRV-035 | POST /v1/payment-requests/validate | EPIC-03 | 3 | P0 | M | 032, 034, 023 |
| SRV-036 | DTO and Swagger for validate endpoint | EPIC-03 | 3 | P0 | E | 035 |
| SRV-037 | E2E validate valid and invalid Stellar cases | EPIC-03 | 3 | P0 | M | 005, 035 |
| SRV-038 | POST /v1/payment-requests persist receiver | EPIC-03 | 3 | P0 | M | 013, 035 |
| SRV-039 | Anti-replay requestId in UsedRequestId | EPIC-03 | 3 | P0 | M | 014, 038 |
| SRV-040 | GET /v1/payment-requests/:id | EPIC-03 | 3 | P0 | M | 038 |
| SRV-041 | Install @simplewebauthn/server | EPIC-02 | 4 | P0 | E | — |
| SRV-042 | WebAuthnModule and challenge store DB | EPIC-02 | 4 | P0 | M | SRV-014, SRV-041 |
| SRV-043 | POST webauthn register options and verify | EPIC-02 | 4 | P0 | M | SRV-042 |
| SRV-044 | POST webauthn authenticate options | EPIC-02 | 4 | P0 | M | SRV-042 |
| SRV-045 | POST /v1/payments/:id/authorize WebAuthn | EPIC-04 | 4 | P0 | H | SRV-043, SRV-044, SRV-061 |
| SRV-046 | Per-device credentials policy | EPIC-02 | 4 | P1 | M | SRV-043 |
| SRV-047 | WebAuthn tests with mocks | EPIC-02 | 4 | P0 | M | SRV-043 |
| SRV-048 | Document hybrid auth flow in ARCHITECTURE | EPIC-02 | 4 | P1 | E | SRV-045 |
| SRV-049 | StellarModule and network configuration | EPIC-05 | 5 | P0 | M | SRV-003, SRV-004 |
| SRV-050 | StellarService getAccount and health | EPIC-05 | 5 | P0 | M | SRV-049 |
| SRV-051 | Resolve asset codes XLM and USDC | EPIC-05 | 5 | P0 | M | SRV-049 |
| SRV-052 | buildPaymentTransaction unsigned | EPIC-05 | 5 | P0 | M | SRV-051 |
| SRV-053 | simulateTransaction via RPC | EPIC-05 | 5 | P0 | M | SRV-052 |
| SRV-054 | submitTransaction broadcast XDR | EPIC-05 | 5 | P0 | M | SRV-049 |
| SRV-055 | pollTransactionStatus with timeout | EPIC-05 | 5 | P0 | M | SRV-054 |
| SRV-056 | POST /v1/transactions/simulate | EPIC-05 | 5 | P0 | M | SRV-053 |
| SRV-057 | Validate XDR matches payment intent | EPIC-05 | 5 | P0 | H | SRV-054, SRV-061 |
| SRV-058 | Horizon error handling and Stellar codes | EPIC-05 | 5 | P0 | M | SRV-054 |
| SRV-059 | GET /health/stellar | EPIC-05 | 5 | P1 | E | SRV-050 |
| SRV-060 | StellarService tests with SDK mocks | EPIC-05 | 5 | P0 | M | SRV-054 |
| SRV-061 | PaymentsModule and state machine service | EPIC-04 | 6 | P0 | M | SRV-007, SRV-013 |
| SRV-062 | POST /v1/payments create intent | EPIC-04 | 6 | P0 | M | SRV-038, SRV-040, SRV-061 |
| SRV-063 | Validate sender distinct from receiver and hints | EPIC-04 | 6 | P0 | M | SRV-062 |
| SRV-064 | Transition CREATED to AUTHORIZED | EPIC-04 | 6 | P0 | M | SRV-045, SRV-062 |
| SRV-065 | POST /v1/payments/:id/submit relay XDR | EPIC-04 | 6 | P0 | H | SRV-054, SRV-057, SRV-064 |
| SRV-066 | Transition AUTHORIZED to SUBMITTED | EPIC-04 | 6 | P0 | M | SRV-065 |
| SRV-067 | Event listener polling confirmation | EPIC-04 | 6 | P0 | M | SRV-055, SRV-066 |
| SRV-068 | Transition SUBMITTED to CONFIRMED or FAILED | EPIC-04 | 6 | P0 | M | SRV-067, SRV-058 |
| SRV-069 | GET /v1/payments/:id full status | EPIC-04 | 6 | P0 | M | SRV-068 |
| SRV-070 | Event payment.confirmed index Transaction | EPIC-04 | 6 | P0 | M | SRV-014, SRV-068 |
| SRV-071 | Idempotency on submit same paymentId | EPIC-04 | 6 | P0 | M | SRV-065 |
| SRV-072 | Timeout FAILED if no submit in time | EPIC-04 | 6 | P0 | M | SRV-061 |
| SRV-073 | E2E full flow with mock Stellar | EPIC-04 | 6 | P0 | H | SRV-005, SRV-065, SRV-069, SRV-016 |
| SRV-074 | Complete Swagger payments module | EPIC-04 | 6 | P1 | E | SRV-056 |
| SRV-075 | TransactionsModule GET /v1/transactions | EPIC-06 | 7 | P1 | M | SRV-070 |
| SRV-076 | History filters asset date role status | EPIC-06 | 7 | P1 | M | SRV-075 |
| SRV-077 | Reconciliation sync from Horizon | EPIC-06 | 7 | P2 | H | SRV-075, SRV-050 |
| SRV-078 | Response DTO memo counterparty explorer link | EPIC-06 | 7 | P1 | E | SRV-075 |
| SRV-079 | DB indexes for history queries | EPIC-06 | 7 | P1 | M | SRV-015 |
| SRV-080 | Tests list and filters transactions | EPIC-06 | 7 | P1 | M | SRV-076 |
| SRV-081 | Rate limiting ThrottlerModule per endpoint | EPIC-07 | 8 | P0 | M | SRV-003 |
| SRV-082 | Validate 5 min clock skew on requests | EPIC-07 | 8 | P0 | E | SRV-032 |
| SRV-083 | NFC expiration policy default 30s | EPIC-07 | 8 | P0 | E | SRV-032 |
| SRV-084 | Sanitize outputs without internal leak | EPIC-07 | 8 | P0 | M | SRV-006 |
| SRV-085 | AuditLog table and critical events | EPIC-07 | 8 | P1 | M | SRV-014 |
| SRV-086 | Restrictive CORS per environment | EPIC-07 | 8 | P0 | E | SRV-005 |
| SRV-087 | Request ID correlation X-Request-Id | EPIC-07 | 8 | P1 | M | SRV-005 |
| SRV-088 | Validate wallet JWT matches signer XDR | EPIC-07 | 8 | P0 | H | SRV-027, SRV-028, SRV-057 |
| SRV-089 | Replay protection stellarTxHash unique | EPIC-07 | 8 | P0 | M | SRV-015 |
| SRV-090 | Documented security review checklist | EPIC-07 | 8 | P1 | E | — |
| SRV-091 | Structured logging Pino or Nest Logger | EPIC-08 | 9 | P1 | M | SRV-005 |
| SRV-092 | GET /health readiness and liveness | EPIC-08 | 9 | P0 | M | SRV-012, SRV-059 |
| SRV-093 | Payment success rate metrics endpoint | EPIC-08 | 9 | P2 | M | SRV-068 |
| SRV-094 | Swagger tags and complete examples | EPIC-09 | 9 | P1 | M | SRV-036, SRV-074 |
| SRV-095 | docs/ARCHITECTURE.md server | EPIC-09 | 9 | P1 | M | SRV-048 |
| SRV-096 | docs/API.md endpoint reference | EPIC-09 | 9 | P1 | M | SRV-094 |
| SRV-097 | 80% test coverage critical modules | EPIC-09 | 9 | P1 | M | SRV-029, SRV-047, SRV-060, SRV-080 |
| SRV-098 | Complete E2E suite in CI | EPIC-09 | 9 | P0 | M | SRV-020, SRV-030, SRV-037, SRV-073, SRV-097 |
| SRV-099 | Contract tests payment-request.v1 | EPIC-09 | 9 | P1 | M | SRV-033 |
| SRV-100 | Basic load test validate endpoint | EPIC-09 | 9 | P2 | M | SRV-081, SRV-035 |
| SRV-101 | Multi-stage production Dockerfile | EPIC-10 | 10 | P1 | M | SRV-005 |
| SRV-102 | docker-compose dev local postgres | EPIC-10 | 10 | P2 | M | SRV-012 |
| SRV-103 | GitHub Actions deploy staging | EPIC-10 | 10 | P1 | H | SRV-092, SRV-101 |
| SRV-104 | prisma migrate deploy in CI/CD | EPIC-10 | 10 | P1 | M | SRV-012, SRV-103 |
| SRV-105 | Operational runbook Stellar down | EPIC-10 | 10 | P1 | E | — |
| SRV-106 | Server MVP release checklist | EPIC-10 | 10 | P1 | E | SRV-098, SRV-104 |

## 8. Phases and detailed tasks

### Phase 0 — Project foundation (EPIC-00)

**Summary:** 8 tasks. Dominant priority: P0.


### SRV-001 — Update README with Ding Payments branding

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | E |
| Blocked by | — |
| Blocks | SRV-017 |
| Est. effort | 1-2h |

**Context:** The current README is the default NestJS template. New agents and developers have no project context.

**Objective:** Complete "Update README with Ding Payments branding" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-002 — Create .env.example with all variables

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | E |
| Blocked by | — |
| Blocks | SRV-004 |
| Est. effort | 1h |

**Context:** Without .env.example, each agent invents different variables. Blocks ConfigModule.

**Objective:** Complete "Create .env.example with all variables" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-003 — Install core server dependencies

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | M |
| Blocked by | — |
| Blocks | SRV-004, SRV-005, SRV-021, SRV-041, SRV-049 |
| Est. effort | 2h |

**Context:** The current package.json only has @nestjs/common, core, platform-express. All deps from the target stack are missing.

**Objective:** Complete "Install core server dependencies" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-004 — Configure ConfigModule and env validation

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-002, SRV-003 |
| Blocks | SRV-005, SRV-011, SRV-021, SRV-049 |
| Est. effort | 3h |

**Context:** Task 004 of phase 0, epic EPIC-00. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Configure ConfigModule and env validation" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-005 — Bootstrap production-ready main.ts

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-003, SRV-004 |
| Blocks | SRV-006, SRV-030, SRV-037, SRV-073 |
| Est. effort | 4h |

**Context:** Task 005 of phase 0, epic EPIC-00. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Bootstrap production-ready main.ts" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-006 — Global exception filter and error format

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-005 |
| Blocks | SRV-084 |
| Est. effort | 3h |

**Context:** Task 006 of phase 0, epic EPIC-00. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Global exception filter and error format" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-007 — Base src/ folder structure

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P0 |
| Complexity | E |
| Blocked by | — |
| Blocks | SRV-011, SRV-021, SRV-034, SRV-049, SRV-061 |
| Est. effort | 1h |

**Context:** Task 007 of phase 0, epic EPIC-00. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Base src/ folder structure" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-008 — Update .cursor/rules to flat layout

| Field | Value |
|-------|-------|
| Epic | EPIC-00 |
| Phase | 0 |
| Priority | P1 |
| Complexity | E |
| Blocked by | — |
| Blocks | — |
| Est. effort | 1h |

**Context:** Task 008 of phase 0, epic EPIC-00. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Update .cursor/rules to flat layout" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 0.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 1 — Database and persistence (EPIC-01)

**Summary:** 12 tasks. Dominant priority: P0.


### SRV-009 — Install Prisma and npm scripts

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-003 |
| Blocks | SRV-010, SRV-011, SRV-020 |
| Est. effort | 1h |

**Context:** Task 009 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Install Prisma and npm scripts" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-010 — Initial Prisma schema User and Wallet

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-009 |
| Blocks | SRV-012, SRV-013 |
| Est. effort | 3h |

**Context:** Task 010 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Initial Prisma schema User and Wallet" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-011 — DatabaseModule and PrismaService

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-004, SRV-007, SRV-009 |
| Blocks | SRV-012, SRV-025, SRV-038 |
| Est. effort | 3h |

**Context:** Task 011 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "DatabaseModule and PrismaService" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-012 — Initial database migration

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-010, SRV-011 |
| Blocks | SRV-013, SRV-016, SRV-092 |
| Est. effort | 2h |

**Context:** Task 012 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Initial database migration" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-013 — Extend schema PaymentRequest and Payment

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-012 |
| Blocks | SRV-014, SRV-015, SRV-038, SRV-062 |
| Est. effort | 4h |

**Context:** Task 013 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Extend schema PaymentRequest and Payment" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-014 — Extend schema Transaction WebAuthn UsedRequestId

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-013 |
| Blocks | SRV-015, SRV-042, SRV-039, SRV-070 |
| Est. effort | 4h |

**Context:** Task 014 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Extend schema Transaction WebAuthn UsedRequestId" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-015 — Database indexes and constraints

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-013, SRV-014 |
| Blocks | SRV-079, SRV-089 |
| Est. effort | 3h |

**Context:** Task 015 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Database indexes and constraints" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-016 — Development seed script

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-012 |
| Blocks | SRV-073 |
| Est. effort | 3h |

**Context:** Task 016 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Development seed script" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-017 — Document Supabase connection in README

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-001 |
| Blocks | — |
| Est. effort | 1h |

**Context:** Task 017 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Document Supabase connection in README" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-018 — Optional RLS script for Supabase

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P2 |
| Complexity | M |
| Blocked by | SRV-012 |
| Blocks | — |
| Est. effort | 3h |

**Context:** Task 018 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Optional RLS script for Supabase" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-019 — Document Prisma inline transaction patterns

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-011 |
| Blocks | — |
| Est. effort | 1h |

**Context:** Task 019 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Document Prisma inline transaction patterns" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-020 — CI prisma generate in workflow

| Field | Value |
|-------|-------|
| Epic | EPIC-01 |
| Phase | 1 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-009 |
| Blocks | SRV-098 |
| Est. effort | 1h |

**Context:** Task 020 of phase 1, epic EPIC-01. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "CI prisma generate in workflow" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 1.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 2 — Supabase authentication (EPIC-02)

**Summary:** 10 tasks. Dominant priority: P0.


### SRV-021 — SupabaseModule and SupabaseService

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-003, SRV-004 |
| Blocks | SRV-022 |
| Est. effort | 3h |

**Context:** Task 021 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "SupabaseModule and SupabaseService" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-022 — SupabaseStrategy Passport JWT

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-021 |
| Blocks | SRV-023 |
| Est. effort | 4h |

**Context:** Task 022 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "SupabaseStrategy Passport JWT" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-023 — Global SupabaseAuthGuard and Public decorator

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-022 |
| Blocks | SRV-029, SRV-035, SRV-062 |
| Est. effort | 3h |

**Context:** Task 023 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Global SupabaseAuthGuard and Public decorator" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-024 — CurrentUser decorator and AuthenticatedUser interface

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-022 |
| Blocks | SRV-025, SRV-026 |
| Est. effort | 2h |

**Context:** Task 024 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "CurrentUser decorator and AuthenticatedUser interface" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-025 — UsersModule sync user on first login

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-011, SRV-024 |
| Blocks | SRV-026, SRV-027 |
| Est. effort | 4h |

**Context:** Task 025 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "UsersModule sync user on first login" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-026 — GET /v1/users/me

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-025 |
| Blocks | SRV-088 |
| Est. effort | 3h |

**Context:** Task 026 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GET /v1/users/me" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-027 — POST /v1/users/me/wallet link pubkey

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-025 |
| Blocks | SRV-028, SRV-088 |
| Est. effort | 4h |

**Context:** Task 027 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST /v1/users/me/wallet link pubkey" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-028 — Validate Stellar G... format in wallet

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-027 |
| Blocks | SRV-088 |
| Est. effort | 2h |

**Context:** Task 028 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Validate Stellar G... format in wallet" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-029 — Unit tests auth guards and strategy

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-023 |
| Blocks | SRV-097 |
| Est. effort | 4h |

**Context:** Task 029 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Unit tests auth guards and strategy" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-030 — E2E auth with JWT mock

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 2 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-005, SRV-023 |
| Blocks | SRV-098 |
| Est. effort | 4h |

**Context:** Task 030 of phase 2, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "E2E auth with JWT mock" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 2.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 3 — payment-request.v1 contract (EPIC-03)

**Summary:** 10 tasks. Dominant priority: P0.


### SRV-031 — Restore docs/payment-request.v1.md

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | E |
| Blocked by | — |
| Blocks | SRV-032 |
| Est. effort | 1h |

**Context:** Task 031 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Restore docs/payment-request.v1.md" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-032 — Port payment-request.v1.ts from git

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-031, SRV-007 |
| Blocks | SRV-033, SRV-035 |
| Est. effort | 3h |

**Context:** Task 032 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Port payment-request.v1.ts from git" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-033 — Unit tests payment-request.v1 contract

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-032 |
| Blocks | SRV-099 |
| Est. effort | 5h |

**Context:** Task 033 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Unit tests payment-request.v1 contract" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-034 — PaymentRequestsModule scaffold

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-007 |
| Blocks | SRV-035 |
| Est. effort | 2h |

**Context:** Task 034 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "PaymentRequestsModule scaffold" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-035 — POST /v1/payment-requests/validate

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-032, SRV-034, SRV-023 |
| Blocks | SRV-036, SRV-037, SRV-038 |
| Est. effort | 4h |

**Context:** The pre-reset service validated ETH/BTC/SOL. Must be rewritten using validatePaymentRequestV1() from the Stellar contract.

**Objective:** Complete "POST /v1/payment-requests/validate" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-036 — DTO and Swagger for validate endpoint

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-035 |
| Blocks | SRV-094 |
| Est. effort | 2h |

**Context:** Task 036 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "DTO and Swagger for validate endpoint" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-037 — E2E validate valid and invalid Stellar cases

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-005, SRV-035 |
| Blocks | SRV-098 |
| Est. effort | 4h |

**Context:** Task 037 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "E2E validate valid and invalid Stellar cases" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-038 — POST /v1/payment-requests persist receiver

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-013, SRV-035 |
| Blocks | SRV-039, SRV-040, SRV-062 |
| Est. effort | 4h |

**Context:** Task 038 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST /v1/payment-requests persist receiver" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-039 — Anti-replay requestId in UsedRequestId

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-014, SRV-038 |
| Blocks | SRV-062 |
| Est. effort | 3h |

**Context:** Task 039 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Anti-replay requestId in UsedRequestId" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-040 — GET /v1/payment-requests/:id

| Field | Value |
|-------|-------|
| Epic | EPIC-03 |
| Phase | 3 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-038 |
| Blocks | SRV-062 |
| Est. effort | 3h |

**Context:** Task 040 of phase 3, epic EPIC-03. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GET /v1/payment-requests/:id" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 3.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 4 — WebAuthn and Passkey (EPIC-02 ext.)

**Summary:** 8 tasks. Dominant priority: P0.


### SRV-041 — Install @simplewebauthn/server

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P0 |
| Complexity | E |
| Blocked by | — |
| Blocks | SRV-042 |
| Est. effort | 3-5h |

**Context:** Task 041 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Install @simplewebauthn/server" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-042 — WebAuthnModule and challenge store DB

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-014, SRV-041 |
| Blocks | SRV-043, SRV-044, SRV-045 |
| Est. effort | 3-5h |

**Context:** Task 042 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "WebAuthnModule and challenge store DB" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-043 — POST webauthn register options and verify

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-042 |
| Blocks | SRV-045, SRV-047 |
| Est. effort | 3-5h |

**Context:** Task 043 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST webauthn register options and verify" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-044 — POST webauthn authenticate options

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-042 |
| Blocks | SRV-045 |
| Est. effort | 3-5h |

**Context:** Task 044 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST webauthn authenticate options" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-045 — POST /v1/payments/:id/authorize WebAuthn

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 4 |
| Priority | P0 |
| Complexity | H |
| Blocked by | SRV-043, SRV-044, SRV-061 |
| Blocks | SRV-064 |
| Est. effort | 3-5h |

**Context:** Critical point of hybrid auth: the server verifies WebAuthn assertion before allowing submit.

**Objective:** Complete "POST /v1/payments/:id/authorize WebAuthn" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-046 — Per-device credentials policy

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-043 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 046 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Per-device credentials policy" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-047 — WebAuthn tests with mocks

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-043 |
| Blocks | SRV-097 |
| Est. effort | 3-5h |

**Context:** Task 047 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "WebAuthn tests with mocks" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-048 — Document hybrid auth flow in ARCHITECTURE

| Field | Value |
|-------|-------|
| Epic | EPIC-02 |
| Phase | 4 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-045 |
| Blocks | SRV-095 |
| Est. effort | 3-5h |

**Context:** Task 048 of phase 4, epic EPIC-02. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Document hybrid auth flow in ARCHITECTURE" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 4.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 5 — Stellar integration (EPIC-05)

**Summary:** 12 tasks. Dominant priority: P0.


### SRV-049 — StellarModule and network configuration

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-003, SRV-004 |
| Blocks | SRV-050, SRV-051 |
| Est. effort | 3-5h |

**Context:** Task 049 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "StellarModule and network configuration" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-050 — StellarService getAccount and health

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-049 |
| Blocks | SRV-059 |
| Est. effort | 3-5h |

**Context:** Task 050 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "StellarService getAccount and health" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-051 — Resolve asset codes XLM and USDC

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-049 |
| Blocks | SRV-052, SRV-056 |
| Est. effort | 3-5h |

**Context:** Task 051 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Resolve asset codes XLM and USDC" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-052 — buildPaymentTransaction unsigned

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-051 |
| Blocks | SRV-053, SRV-056 |
| Est. effort | 3-5h |

**Context:** Task 052 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "buildPaymentTransaction unsigned" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-053 — simulateTransaction via RPC

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-052 |
| Blocks | SRV-056 |
| Est. effort | 3-5h |

**Context:** Task 053 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "simulateTransaction via RPC" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-054 — submitTransaction broadcast XDR

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-049 |
| Blocks | SRV-065, SRV-057 |
| Est. effort | 3-5h |

**Context:** Task 054 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "submitTransaction broadcast XDR" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-055 — pollTransactionStatus with timeout

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-054 |
| Blocks | SRV-067, SRV-068 |
| Est. effort | 3-5h |

**Context:** Task 055 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "pollTransactionStatus with timeout" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-056 — POST /v1/transactions/simulate

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-053 |
| Blocks | SRV-074 |
| Est. effort | 3-5h |

**Context:** Task 056 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST /v1/transactions/simulate" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-057 — Validate XDR matches payment intent

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | H |
| Blocked by | SRV-054, SRV-061 |
| Blocks | SRV-065 |
| Est. effort | 3-5h |

**Context:** Before relay, the server must parse the XDR and verify amount, destination, and asset match the Payment.

**Objective:** Complete "Validate XDR matches payment intent" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-058 — Horizon error handling and Stellar codes

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-054 |
| Blocks | SRV-068 |
| Est. effort | 3-5h |

**Context:** Task 058 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Horizon error handling and Stellar codes" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-059 — GET /health/stellar

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-050 |
| Blocks | SRV-092 |
| Est. effort | 3-5h |

**Context:** Task 059 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GET /health/stellar" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-060 — StellarService tests with SDK mocks

| Field | Value |
|-------|-------|
| Epic | EPIC-05 |
| Phase | 5 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-054 |
| Blocks | SRV-097 |
| Est. effort | 3-5h |

**Context:** Task 060 of phase 5, epic EPIC-05. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "StellarService tests with SDK mocks" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 5.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 6 — Payment lifecycle (EPIC-04)

**Summary:** 14 tasks. Dominant priority: P0.


### SRV-061 — PaymentsModule and state machine service

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-007, SRV-013 |
| Blocks | SRV-062, SRV-045 |
| Est. effort | 3-5h |

**Context:** Task 061 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "PaymentsModule and state machine service" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-062 — POST /v1/payments create intent

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-038, SRV-040, SRV-061 |
| Blocks | SRV-063, SRV-064 |
| Est. effort | 3-5h |

**Context:** Task 062 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "POST /v1/payments create intent" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-063 — Validate sender distinct from receiver and hints

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-062 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 063 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Validate sender distinct from receiver and hints" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-064 — Transition CREATED to AUTHORIZED

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-045, SRV-062 |
| Blocks | SRV-065 |
| Est. effort | 3-5h |

**Context:** Task 064 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Transition CREATED to AUTHORIZED" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-065 — POST /v1/payments/:id/submit relay XDR

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | H |
| Blocked by | SRV-054, SRV-057, SRV-064 |
| Blocks | SRV-066, SRV-073 |
| Est. effort | 3-5h |

**Context:** Core of the relay model: receives signed XDR, validates, submitTransaction(), emits payment.submitted.

**Objective:** Complete "POST /v1/payments/:id/submit relay XDR" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-066 — Transition AUTHORIZED to SUBMITTED

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-065 |
| Blocks | SRV-067 |
| Est. effort | 3-5h |

**Context:** Task 066 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Transition AUTHORIZED to SUBMITTED" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-067 — Event listener polling confirmation

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-055, SRV-066 |
| Blocks | SRV-068 |
| Est. effort | 3-5h |

**Context:** Task 067 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Event listener polling confirmation" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-068 — Transition SUBMITTED to CONFIRMED or FAILED

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-067, SRV-058 |
| Blocks | SRV-069, SRV-070 |
| Est. effort | 3-5h |

**Context:** Task 068 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Transition SUBMITTED to CONFIRMED or FAILED" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-069 — GET /v1/payments/:id full status

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-068 |
| Blocks | SRV-073 |
| Est. effort | 3-5h |

**Context:** Task 069 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GET /v1/payments/:id full status" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-070 — Event payment.confirmed index Transaction

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-014, SRV-068 |
| Blocks | SRV-075 |
| Est. effort | 3-5h |

**Context:** Task 070 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Event payment.confirmed index Transaction" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-071 — Idempotency on submit same paymentId

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-065 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 071 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Idempotency on submit same paymentId" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-072 — Timeout FAILED if no submit in time

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-061 |
| Blocks | SRV-068 |
| Est. effort | 3-5h |

**Context:** Task 072 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Timeout FAILED if no submit in time" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-073 — E2E full flow with mock Stellar

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P0 |
| Complexity | H |
| Blocked by | SRV-005, SRV-065, SRV-069, SRV-016 |
| Blocks | SRV-098 |
| Est. effort | 3-5h |

**Context:** Task 073 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "E2E full flow with mock Stellar" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-074 — Complete Swagger payments module

| Field | Value |
|-------|-------|
| Epic | EPIC-04 |
| Phase | 6 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-056 |
| Blocks | SRV-094 |
| Est. effort | 3-5h |

**Context:** Task 074 of phase 6, epic EPIC-04. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Complete Swagger payments module" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 6.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 7 — Transaction history (EPIC-06)

**Summary:** 6 tasks. Dominant priority: P1.


### SRV-075 — TransactionsModule GET /v1/transactions

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-070 |
| Blocks | SRV-076, SRV-080 |
| Est. effort | 3-5h |

**Context:** Task 075 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "TransactionsModule GET /v1/transactions" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-076 — History filters asset date role status

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-075 |
| Blocks | SRV-080 |
| Est. effort | 3-5h |

**Context:** Task 076 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "History filters asset date role status" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-077 — Reconciliation sync from Horizon

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P2 |
| Complexity | H |
| Blocked by | SRV-075, SRV-050 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 077 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Reconciliation sync from Horizon" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-078 — Response DTO memo counterparty explorer link

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-075 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 078 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Response DTO memo counterparty explorer link" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-079 — DB indexes for history queries

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-015 |
| Blocks | SRV-076 |
| Est. effort | 3-5h |

**Context:** Task 079 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "DB indexes for history queries" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-080 — Tests list and filters transactions

| Field | Value |
|-------|-------|
| Epic | EPIC-06 |
| Phase | 7 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-076 |
| Blocks | SRV-097 |
| Est. effort | 3-5h |

**Context:** Task 080 of phase 7, epic EPIC-06. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Tests list and filters transactions" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 7.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 8 — Security and hardening (EPIC-07)

**Summary:** 10 tasks. Dominant priority: P0.


### SRV-081 — Rate limiting ThrottlerModule per endpoint

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-003 |
| Blocks | SRV-100 |
| Est. effort | 3-5h |

**Context:** Task 081 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Rate limiting ThrottlerModule per endpoint" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-082 — Validate 5 min clock skew on requests

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-032 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 082 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Validate 5 min clock skew on requests" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-083 — NFC expiration policy default 30s

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-032 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 083 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "NFC expiration policy default 30s" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-084 — Sanitize outputs without internal leak

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-006 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 084 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Sanitize outputs without internal leak" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-085 — AuditLog table and critical events

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-014 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 085 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "AuditLog table and critical events" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-086 — Restrictive CORS per environment

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | E |
| Blocked by | SRV-005 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 086 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Restrictive CORS per environment" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-087 — Request ID correlation X-Request-Id

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-005 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 087 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Request ID correlation X-Request-Id" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-088 — Validate wallet JWT matches signer XDR

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | H |
| Blocked by | SRV-027, SRV-028, SRV-057 |
| Blocks | SRV-065 |
| Est. effort | 3-5h |

**Context:** Task 088 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Validate wallet JWT matches signer XDR" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-089 — Replay protection stellarTxHash unique

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-015 |
| Blocks | SRV-065 |
| Est. effort | 3-5h |

**Context:** Task 089 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Replay protection stellarTxHash unique" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-090 — Documented security review checklist

| Field | Value |
|-------|-------|
| Epic | EPIC-07 |
| Phase | 8 |
| Priority | P1 |
| Complexity | E |
| Blocked by | — |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 090 of phase 8, epic EPIC-07. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Documented security review checklist" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 8.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 9 — Observability and quality (EPIC-08/09)

**Summary:** 10 tasks. Dominant priority: P1.


### SRV-091 — Structured logging Pino or Nest Logger

| Field | Value |
|-------|-------|
| Epic | EPIC-08 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-005 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 091 of phase 9, epic EPIC-08. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Structured logging Pino or Nest Logger" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-092 — GET /health readiness and liveness

| Field | Value |
|-------|-------|
| Epic | EPIC-08 |
| Phase | 9 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-012, SRV-059 |
| Blocks | SRV-103 |
| Est. effort | 3-5h |

**Context:** Task 092 of phase 9, epic EPIC-08. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GET /health readiness and liveness" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-093 — Payment success rate metrics endpoint

| Field | Value |
|-------|-------|
| Epic | EPIC-08 |
| Phase | 9 |
| Priority | P2 |
| Complexity | M |
| Blocked by | SRV-068 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 093 of phase 9, epic EPIC-08. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Payment success rate metrics endpoint" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-094 — Swagger tags and complete examples

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-036, SRV-074 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 094 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Swagger tags and complete examples" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-095 — docs/ARCHITECTURE.md server

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-048 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 095 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "docs/ARCHITECTURE.md server" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-096 — docs/API.md endpoint reference

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-094 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 096 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "docs/API.md endpoint reference" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-097 — 80% test coverage critical modules

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-029, SRV-047, SRV-060, SRV-080 |
| Blocks | SRV-098 |
| Est. effort | 3-5h |

**Context:** Task 097 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "80% test coverage critical modules" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-098 — Complete E2E suite in CI

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P0 |
| Complexity | M |
| Blocked by | SRV-020, SRV-030, SRV-037, SRV-073, SRV-097 |
| Blocks | SRV-106 |
| Est. effort | 3-5h |

**Context:** Task 098 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Complete E2E suite in CI" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-099 — Contract tests payment-request.v1

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-033 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 099 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Contract tests payment-request.v1" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-100 — Basic load test validate endpoint

| Field | Value |
|-------|-------|
| Epic | EPIC-09 |
| Phase | 9 |
| Priority | P2 |
| Complexity | M |
| Blocked by | SRV-081, SRV-035 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 100 of phase 9, epic EPIC-09. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Basic load test validate endpoint" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 9.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### Phase 10 — Deploy and MVP release (EPIC-10)

**Summary:** 6 tasks. Dominant priority: P1.


### SRV-101 — Multi-stage production Dockerfile

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-005 |
| Blocks | SRV-103 |
| Est. effort | 3-5h |

**Context:** Task 101 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Multi-stage production Dockerfile" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-102 — docker-compose dev local postgres

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P2 |
| Complexity | M |
| Blocked by | SRV-012 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 102 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "docker-compose dev local postgres" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-103 — GitHub Actions deploy staging

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P1 |
| Complexity | H |
| Blocked by | SRV-092, SRV-101 |
| Blocks | SRV-104 |
| Est. effort | 3-5h |

**Context:** Task 103 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "GitHub Actions deploy staging" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-104 — prisma migrate deploy in CI/CD

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P1 |
| Complexity | M |
| Blocked by | SRV-012, SRV-103 |
| Blocks | SRV-106 |
| Est. effort | 3-5h |

**Context:** Task 104 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "prisma migrate deploy in CI/CD" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-105 — Operational runbook Stellar down

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P1 |
| Complexity | E |
| Blocked by | — |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 105 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Operational runbook Stellar down" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


### SRV-106 — Server MVP release checklist

| Field | Value |
|-------|-------|
| Epic | EPIC-10 |
| Phase | 10 |
| Priority | P1 |
| Complexity | E |
| Blocked by | SRV-098, SRV-104 |
| Blocks | — |
| Est. effort | 3-5h |

**Context:** Task 106 of phase 10, epic EPIC-10. Part of the Ding Payments server MVP build plan.

**Objective:** Complete "Server MVP release checklist" per the architecture defined in Sections 3–6 of this document.

**Acceptance criteria:**
- Implementation compiles without TypeScript errors
- Associated tests pass (`npm test` / `npm run test:e2e` as applicable)
- Code follows conventions in `.cursor/rules/BACKEND-ARCHITECTURE.mdc`
- Swagger updated if the task exposes endpoints
- No secrets introduced in the repository

**Files:** See specific implementation in Section 8 — Phase 10.

**Tests:** Unit tests in co-located `*.spec.ts`; E2E in `test/` if applicable.

**Client dependency:** See Section 9 — Client ↔ server matrix.

**Notes for agents:** Run from `ding-server/`. Atomic commit per task. Skills: `.agents/skills/nestjs-best-practices/`.


#### Detailed implementations — Phase 0

**SRV-001 — README**
- Modify: `ding-server/README.md`
- Include: Ding Payments description, prerequisites (Node 20+, Supabase), setup (`cp .env.example .env`), scripts, module structure, link to docs/

**SRV-002 — .env.example**
- Create: `ding-server/.env.example`
- Copy variables from Section 3 of this document

**SRV-003 — Dependencies**
```bash
cd ding-server
npm install @nestjs/config @nestjs/swagger @nestjs/throttler @nestjs/event-emitter @nestjs/passport passport passport-jwt class-validator class-transformer helmet joi @supabase/supabase-js @prisma/client @stellar/stellar-sdk @simplewebauthn/server
npm install -D prisma @types/passport-jwt
```

**SRV-004 — ConfigModule**
- Create: `src/config/config.module.ts`, `src/config/env.validation.ts`, `src/config/configuration.ts`
- Validate all .env.example vars with Joi
- Register in `app.module.ts` as global

**SRV-005 — main.ts**
- Modify: `src/main.ts`
- Add: ValidationPipe (whitelist, transform), Helmet, CORS from env, Swagger at /docs, prefix /v1, enableShutdownHooks

**SRV-006 — Exception filter**
- Create: `src/common/filters/http-exception.filter.ts`
- Formato: `{ statusCode, message, code?, errors?, timestamp, path }`

**SRV-007 — Folders**
- Create dirs: `src/config`, `src/common/filters`, `src/database`, `src/auth`, `src/stellar`, `src/webauthn`, `src/contracts`, `src/modules/users`, `src/modules/payment-requests`, `src/modules/payments`, `src/modules/transactions`

**SRV-008 — Cursor rules**
- Modify: `.cursor/rules/BACKEND-ARCHITECTURE.mdc`, `CORE-API.mdc`, `DATABASE.mdc`
- Replace `apps/core-api/` → `ding-server/src/`

#### Detailed implementations — Phase 1

**SRV-009 — Prisma install**
```bash
npx prisma init
```
- Add scripts: `prisma:generate`, `prisma:migrate`, `prisma:push`, `prisma:studio`, `prisma:seed`

**SRV-010/013/014 — Schema**
- Create: `prisma/schema.prisma` with models from Section 4
- Use Decimal for amounts, never Float

**SRV-011 — PrismaService**
- Create: `src/database/database.module.ts`, `src/database/prisma.service.ts`
- Implement OnModuleInit/OnModuleDestroy ($connect/$disconnect)
- Export global from DatabaseModule

**SRV-012 — Migration**
```bash
npx prisma migrate dev --name init
```

**SRV-016 — Seed**
- Create: `prisma/seed.ts` — 2 users test, wallets testnet, sample payment request

#### Detailed implementations — Phase 2

**SRV-021-023 — Auth**
- Create: `src/auth/auth.module.ts`, `src/supabase/supabase.service.ts`
- JWT validation with SUPABASE_JWT_SECRET
- @Public() on validate and health endpoints

**SRV-025-027 — Users**
- Create: `src/modules/users/users.module.ts`, controller, service, dto/
- Upsert user from JWT on first request
- Wallet link with unique constraint per network

#### Detailed implementations — Phase 3

**SRV-031 — Restore contract doc**
```bash
git show 5d4e9de^:docs/payment-request.v1.md > docs/payment-request.v1.md
```

**SRV-032 — Port contract**
```bash
git show 5d4e9de^:src/payments/contracts/payment-request.v1.ts > src/contracts/payment-request.v1.ts
git show 5d4e9de^:src/payments/contracts/payment-request.v1.spec.ts > src/contracts/payment-request.v1.spec.ts
```

**SRV-035 — Validate endpoint**
- Create: `src/modules/payment-requests/payment-requests.service.ts`
- Call `validatePaymentRequestV1(body)` — do NOT reuse ETH/BTC logic from pre-reset
- Controller: POST validate, @Public()

**SRV-038-040 — Request persistence**
- Save PaymentRequest after successful validation
- Mark UsedRequestId if requestId present
- GET by id with auth — owner or participant only

#### Detailed implementations — Phase 4

**SRV-042-044 — WebAuthn**
- Create: `src/webauthn/webauthn.module.ts`, `webauthn.service.ts`, `webauthn.controller.ts`
- Store challenges in WebAuthnChallenge table, TTL 5 min
- RP ID and origin from env

**SRV-045 — Authorize payment**
- POST body: `{ credentialId, authenticatorData, clientDataJSON, signature }`
- Verify with verifyAuthenticationResponse
- Transition payment CREATED → AUTHORIZED

#### Detailed implementations — Phase 5

**SRV-049-055 — Stellar**
- Create: `src/stellar/stellar.module.ts`, `stellar.service.ts`
- Usar StellarSdk.Horizon.Server y StellarSdk.rpc.Server
- USDC: `new StellarSdk.Asset('USDC', issuer)`
- buildPaymentTransaction: Operation.payment, load account, set timeout

**SRV-057 — XDR validation**
- Parse Transaction from XDR
- Extract operation type payment, compare destination, amount, asset

#### Detailed implementations — Phase 6

**SRV-061-072 — Payments lifecycle**
- Create: `src/modules/payments/payments.module.ts`, `payments.service.ts`, `payment-state.machine.ts`
- @OnEvent('payment.submitted') → poll loop
- Idempotency: if duplicate submit with same XDR, return 200 with current state

#### Detailed implementations — Phases 7-10

**SRV-075-080 — Transactions history**
- Paginate with Prisma skip/take
- Query filters: asset, from, to, direction

**SRV-081-090 — Security**
- Throttle: validate 30/min, submit 10/min per user
- AuditLog listener on all payment.* events

**SRV-091-100 — Observability**
- Logger middleware with requestId
- /health/ready checks prisma.$queryRaw and stellar.getHealth

**SRV-101-106 — Deploy**
- Dockerfile: node:20-alpine, multi-stage build
- CI: deploy on push to develop

### 8.1 Critical tasks — extended implementation

The following P0 tasks have additional instructions for agents. They complement the individual entries above.

---

#### SRV-011 — DatabaseModule and PrismaService (extended)

**Files:**
- Create: `ding-server/src/database/database.module.ts`
- Create: `ding-server/src/database/prisma.service.ts`
- Create: `ding-server/src/database/index.ts`
- Modify: `ding-server/src/app.module.ts`

**Implementation:**
```typescript
// prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}

// database.module.ts
@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class DatabaseModule {}
```

**Tests:** Mock PrismaService in e2e with `$connect`, `$disconnect`, and required delegates.

**Client dependency:** None.

---

#### SRV-023 — Global SupabaseAuthGuard (extended)

**Files:**
- Create: `ding-server/src/auth/decorators/public.decorator.ts`
- Create: `ding-server/src/auth/guards/supabase-auth.guard.ts`
- Modify: `ding-server/src/app.module.ts` — `{ provide: APP_GUARD, useClass: SupabaseAuthGuard }`

**Specific criteria:**
- Endpoints with `@Public()`: `POST /v1/payment-requests/validate`, `GET /health`, `GET /health/*`
- Invalid JWT → 401 `{ statusCode: 401, message: 'Unauthorized' }`
- Valid JWT → `request.user` populated with `{ supabaseUserId, email }`

**Client dependency:** Client must send `Authorization: Bearer <token>` from Supabase Auth on all protected endpoints.

---

#### SRV-035 — POST /v1/payment-requests/validate (extended)

**Files:**
- Create: `ding-server/src/modules/payment-requests/payment-requests.controller.ts`
- Create: `ding-server/src/modules/payment-requests/payment-requests.service.ts`
- Create: `ding-server/src/modules/payment-requests/payment-requests.module.ts`
- Create: `ding-server/src/modules/payment-requests/dto/validate-payment-request.dto.ts`
- Test: `ding-server/test/payment-requests-validate.e2e-spec.ts`

**Service implementation:**
```typescript
@Injectable()
export class PaymentRequestsService {
  validate(payload: unknown): PaymentRequestValidationResult {
    return validatePaymentRequestV1(payload, new Date());
  }
}
```

**Specific criteria:**
- Accepts direct v1 contract JSON body (no `{ payload: ... }` wrapper)
- 200 response for both valid and invalid; `valid: boolean` field
- Errors use `PAYMENT_REQUEST_*` codes from the contract
- Do NOT support ETH/BTC/SOL assets from pre-reset code

**Required e2e tests:**
1. Valid USDC payload → `valid: true`
2. Asset BTC → `PAYMENT_REQUEST_ASSET_UNSUPPORTED`
3. Recipient `0x...` → `PAYMENT_REQUEST_RECIPIENT_INVALID`
4. `expiresAt` in the past → `PAYMENT_REQUEST_EXPIRES_AT_OUT_OF_WINDOW`

**Client dependency:** Receiver client must generate payload per `payment-request.v1.md` before NFC transfer.

---

#### SRV-045 — POST /v1/payments/:id/authorize (extended)

**Files:**
- Create: `ding-server/src/modules/payments/dto/authorize-payment.dto.ts`
- Modify: `ding-server/src/modules/payments/payments.controller.ts`
- Modify: `ding-server/src/modules/payments/payments.service.ts`

**Flow:**
1. Client calls `POST /v1/webauthn/authenticate/options` with `{ paymentId }`
2. Server generates challenge, stores it in `WebAuthnChallenge` with 5 min TTL
3. Client executes `navigator.credentials.get()` with the challenge
4. Client sends assertion to `POST /v1/payments/:id/authorize`
5. Server verifies with `verifyAuthenticationResponse()` from `@simplewebauthn/server`
6. If OK: `payment.status = AUTHORIZED`, `authorizedAt = now()`, emit `payment.authorized`

**Specific criteria:**
- Payment must be in `CREATED`
- Payment not expired (`expiresAt > now`)
- Challenge not expired and not reused
- Only `senderUserId` can authorize

**Client dependency:** Confirmation screen + passkey authenticate (CLI plan). Must send complete assertion.

---

#### SRV-057 — Validate XDR matches payment intent (extended)

**Files:**
- Create: `ding-server/src/stellar/xdr-validator.service.ts`
- Test: `ding-server/src/stellar/xdr-validator.service.spec.ts`

**Implementation:**
```typescript
import * as StellarSdk from '@stellar/stellar-sdk';

validatePaymentXdr(signedXdr: string, intent: PaymentIntent): void {
  const tx = new StellarSdk.Transaction(signedXdr, networkPassphrase);
  const op = tx.operations[0];
  if (op.type !== 'payment') throw new BadRequestException({ code: 'PAYMENT_XDR_INVALID' });
  // Compare op.destination, op.amount, op.asset with intent
  // Verify source account === intent.senderPublicKey
}
```

**Specific criteria:**
- Reject XDR with multiple operations in MVP
- Reject fee bump transactions
- Amount must match exactly (7 decimals max)
- USDC: compare asset code + issuer

**Client dependency:** Client builds tx with same parameters as payment intent.

---

#### SRV-065 — POST /v1/payments/:id/submit relay XDR (extended)

**Files:**
- Create: `ding-server/src/modules/payments/dto/submit-payment.dto.ts`
- Modify: `ding-server/src/modules/payments/payments.service.ts`

**Full flow:**
1. Verify payment `AUTHORIZED`
2. Call `xdrValidator.validatePaymentXdr(dto.signedXdr, payment)`
3. Verify payment `senderPublicKey` matches XDR signer (SRV-088)
4. `stellarService.submitTransaction(dto.signedXdr)`
5. Guardar `stellarTxHash`, `status = SUBMITTED`, `submittedAt = now()`
6. Emit `payment.submitted` → listener starts poll (SRV-067)
7. Mark `PaymentRequest` as `CONSUMED`

**DTO:**
```typescript
export class SubmitPaymentDto {
  @IsString()
  @IsNotEmpty()
  signedXdr: string;
}
```

**Specific criteria:**
- Idempotent: second submit with same XDR → 200 with current state
- Submit with different XDR → 409 `PAYMENT_ALREADY_SUBMITTED`
- Horizon error `op_underfunded` → `status = FAILED`, `failureCode = STELLAR_OP_UNDERFUNDED`

**Client dependency:** Client signs tx locally and sends base64 XDR. Do not send secret seed to the server.

---

#### SRV-067 — Event listener polling confirmation (extended)

**Files:**
- Create: `ding-server/src/modules/payments/payment-confirmation.listener.ts`

**Implementation:**
```typescript
@Injectable()
export class PaymentConfirmationListener {
  @OnEvent('payment.submitted')
  async handleSubmitted(event: PaymentSubmittedEvent) {
    const result = await this.stellarService.pollTransactionStatus(
      event.stellarTxHash,
      { intervalMs: config.PAYMENT_POLL_INTERVAL_MS, maxAttempts: config.PAYMENT_POLL_MAX_ATTEMPTS }
    );
    if (result.confirmed) {
      await this.paymentsService.markConfirmed(event.paymentId, result);
      this.eventEmitter.emit('payment.confirmed', { ... });
    } else {
      await this.paymentsService.markFailed(event.paymentId, result.failureCode);
    }
  }
}
```

**Client dependency:** Client polls `GET /v1/payments/:id` every 2s until `CONFIRMED` or `FAILED`.

---

#### SRV-013 — Prisma schema PaymentRequest and Payment (extended)

**Schema snippet:**
```prisma
model PaymentRequest {
  id                String               @id @default(uuid())
  externalRequestId String?              @unique
  receiverUserId    String
  receiver          User                 @relation(fields: [receiverUserId], references: [id])
  recipient         String
  asset             AssetCode
  amount            Decimal              @db.Decimal(20, 7)
  memo              String?              @db.VarChar(280)
  status            PaymentRequestStatus @default(CREATED)
  payloadTimestamp  DateTime
  expiresAt         DateTime
  metadata          Json?
  createdAt         DateTime             @default(now())
  payments          Payment[]
  @@index([receiverUserId, status])
}

model Payment {
  id               String        @id @default(uuid())
  paymentRequestId String?
  paymentRequest   PaymentRequest? @relation(fields: [paymentRequestId], references: [id])
  senderUserId     String
  receiverUserId   String
  sender           User          @relation("SentPayments", fields: [senderUserId], references: [id])
  receiver         User          @relation("ReceivedPayments", fields: [receiverUserId], references: [id])
  recipient        String
  senderPublicKey  String
  asset            AssetCode
  amount           Decimal       @db.Decimal(20, 7)
  status           PaymentStatus @default(CREATED)
  stellarTxHash    String?       @unique
  failureReason    String?
  failureCode      String?
  authorizedAt     DateTime?
  submittedAt      DateTime?
  confirmedAt      DateTime?
  expiresAt        DateTime
  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  @@index([senderUserId, status])
  @@index([receiverUserId, status])
}
```

---

## 9. Client ↔ server dependency matrix

| Integration point | Server endpoint | Server task | Required on client | Order |
|-------------------|-------------------|----------------|---------------------|-------|
| Validate NFC payload | POST /v1/payment-requests/validate | SRV-035 | payment-request.v1 payload emitter | Client can develop in parallel with mock |
| Register request | POST /v1/payment-requests | SRV-038 | Receiver flow + auth JWT | After SRV-038 + client auth |
| Create payment | POST /v1/payments | SRV-062 | Sender flow post-NFC | After validate |
| Passkey registration | POST /v1/webauthn/register/* | SRV-043 | WebAuthn register UI | Parallel phase 4 |
| Authorize payment | POST /v1/payments/:id/authorize | SRV-045 | Passkey authenticate UI | After SRV-045 |
| Simulate tx | POST /v1/transactions/simulate | SRV-056 | Local tx builder | Optional pre-sign |
| Sign and submit | POST /v1/payments/:id/submit | SRV-065 | Local signing + XDR | After authorize |
| Poll status | GET /v1/payments/:id | SRV-069 | Confirmation UI both users | After submit |
| History | GET /v1/transactions | SRV-075 | History screen | P1 |
| Link wallet | POST /v1/users/me/wallet | SRV-027 | Wallet setup onboarding | Before first payment |

### NFC contract — mandatory alignment

The client **must** emit `payment-request.v1`:

```json
{
  "type": "payment-request",
  "version": 1,
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "USDC",
  "amount": "25.00",
  "timestamp": "2026-06-17T12:00:00.000Z",
  "expiresAt": "2026-06-17T12:00:30.000Z",
  "requestId": "req_unique_123",
  "memo": "Coffee"
}
```

**Do not use** the simplified format from ding-payments.md (unix timestamps, type `payment_request` with underscore).

---

## 10. Risks and open decisions

| Question | Decision in this plan | Task |
|----------|----------------------|-------|
| Sign NFC payment request? | Not in MVP; structural validation + requestId anti-replay | SRV-039 |
| Pre-simulate transactions? | Yes, simulate endpoint | SRV-056 |
| USDC issuer per network? | Env var STELLAR_USDC_ISSUER | SRV-049 |
| Who broadcasts? | Server (relay) | SRV-065 |
| Payment auth? | Hybrid Supabase + WebAuthn | SRV-045 |
| Push notifications on confirmation? | Outside MVP (P3) | — |
| Usernames? | Outside MVP | — |

### Technical risks

| Risk | Impact | Mitigation |
|--------|---------|------------|
| Stellar RPC down | Payments do not confirm | SRV-059 health, SRV-105 runbook, retry poll |
| Clock skew between devices | Requests rejected | SRV-082, 5 min window |
| Malicious XDR on submit | User fund loss | SRV-057 strict validation |
| Replay requestId | Double charge | SRV-039 UsedRequestId |
| WebAuthn origin mismatch | Auth fails in prod | WEBAUTHN_ORIGIN per env |

---

## 11. Appendices

### Appendix A — Error codes

**Payment Request (PAYMENT_REQUEST_*):**
- PAYMENT_REQUEST_PAYLOAD_INVALID
- PAYMENT_REQUEST_FIELD_REQUIRED
- PAYMENT_REQUEST_FIELD_UNKNOWN
- PAYMENT_REQUEST_TYPE_UNSUPPORTED
- PAYMENT_REQUEST_VERSION_UNSUPPORTED
- PAYMENT_REQUEST_RECIPIENT_INVALID
- PAYMENT_REQUEST_ASSET_UNSUPPORTED
- PAYMENT_REQUEST_AMOUNT_INVALID
- PAYMENT_REQUEST_TIMESTAMP_INVALID
- PAYMENT_REQUEST_TIMESTAMP_OUT_OF_WINDOW
- PAYMENT_REQUEST_EXPIRES_AT_INVALID
- PAYMENT_REQUEST_EXPIRES_AT_OUT_OF_WINDOW
- PAYMENT_REQUEST_METADATA_INVALID

**Payment (PAYMENT_*):**
- PAYMENT_NOT_FOUND
- PAYMENT_EXPIRED
- PAYMENT_INVALID_STATE
- PAYMENT_SENDER_IS_RECEIVER
- PAYMENT_UNAUTHORIZED
- PAYMENT_XDR_MISMATCH
- PAYMENT_XDR_INVALID
- PAYMENT_ALREADY_SUBMITTED
- PAYMENT_REQUEST_ID_REPLAY

**Stellar (STELLAR_*):**
- STELLAR_ACCOUNT_NOT_FOUND
- STELLAR_INSUFFICIENT_BALANCE
- STELLAR_TX_FAILED
- STELLAR_OP_UNDERFUNDED
- STELLAR_NETWORK_ERROR
- STELLAR_TIMEOUT

**WebAuthn (WEBAUTHN_*):**
- WEBAUTHN_CHALLENGE_EXPIRED
- WEBAUTHN_VERIFICATION_FAILED
- WEBAUTHN_CREDENTIAL_NOT_FOUND

### Appendix B — Additional examples

**POST /v1/payments/:id/submit**
```json
// Request
{ "signedXdr": "AAAA..." }

// Response 200
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUBMITTED",
  "stellarTxHash": "abc123def456..."
}
```

**POST /v1/payments/:id/authorize**
```json
// Request
{
  "id": "credential-id-base64",
  "rawId": "...",
  "response": {
    "authenticatorData": "...",
    "clientDataJSON": "...",
    "signature": "..."
  }
}
```

### Appendix C — Useful commands

```bash
# Development
cd ding-server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate
npm run start:dev

# Tests
npm test
npm run test:e2e
npm run test:cov

# Prisma
npm run prisma:studio
npm run prisma:seed

# Build
npm run build
npm run lint
```

### Appendix D — Git pre-reset

```bash
# View previous implementation
git show 5d4e9de^:src/payments/contracts/payment-request.v1.ts
git show 5d4e9de^:docs/payment-request.v1.md
git diff 5d4e9de^ 5d4e9de --stat
```

### Appendix E — Epics summary

| Epic | Name | Tasks | Phase |
|------|--------|--------|------|
| EPIC-00 | Foundation | SRV-001–008 | 0 |
| EPIC-01 | Database | SRV-009–020 | 1 |
| EPIC-02 | Auth (Supabase + WebAuthn) | SRV-021–030, 041–048 | 2, 4 |
| EPIC-03 | NFC contract | SRV-031–040 | 3 |
| EPIC-04 | Payment Lifecycle | SRV-061–074, 045 | 4, 6 |
| EPIC-05 | Stellar Integration | SRV-049–060 | 5 |
| EPIC-06 | Transaction History | SRV-075–080 | 7 |
| EPIC-07 | Security | SRV-081–090 | 8 |
| EPIC-08 | Observability | SRV-091–093 | 9 |
| EPIC-09 | Quality | SRV-094–100 | 9 |
| EPIC-10 | Deploy | SRV-101–106 | 10 |

---

*End of Server Build Plan — Ding Payments v1.0*
