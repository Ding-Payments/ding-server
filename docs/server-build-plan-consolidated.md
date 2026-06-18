# Ding Payments — Server Build Plan (Consolidated)

> **Executive backlog for `ding-server/`** — 20 deliverables across 4 stages.
>
> **Version: 1.2** · Date: 2026-06-17 · Scope: server MVP
>
> **v1.2 note:** GitHub Issue ready — copy each `### S##` section (from heading through Definition of done) as the issue body. One deliverable = one GitHub Issue = one sprint ticket (~1–2 weeks).
>
> **Companion document:** [server-build-plan.md](./server-build-plan.md) — atomic spec (106 `SRV-###` tasks). Use this consolidated plan for sprints and GitHub Issues; use the atomic plan for implementation detail per sub-task.

**Required references:**

- [ding-payments.md](./ding-payments.md) — product vision and UX flows
- [payment-request.v1.md](./payment-request.v1.md) — canonical NFC contract
- Client consolidated plan: `ding-payments/docs/build-plan-client-consolidated.md`

---

## How to use this document

### Sprint execution

1. Execute **ETA 1 → ETA 4** in order; respect `Depends on` in the task summary table.
2. Each deliverable (`S##`) is one **sprint-sized** ticket; atomic `SRV-###` IDs are a checklist inside the ticket.
3. For files, steps, tests and acceptance criteria per atomic task, open [server-build-plan.md](./server-build-plan.md) and search the `SRV-###` heading.
4. Target: **1 deliverable per 2-week sprint** ≈ 20 sprints to MVP release.

### How to use for GitHub Issues

1. **Create one Issue per deliverable** (`S01`–`S20`). Title format: `[S##] Short title` (e.g. `[S08] payment-request.v1 validation core`).
2. **Copy the entire `### S##` block** from this file into the Issue body (starts at `### S## — Title`, ends at Definition of done checkboxes).
3. **Add labels** (suggested): `server`, `eta-{1-4}`, priority (`P0`/`P1`), complexity (`easy`/`medium`/`hard`).
4. **Link dependencies** in the Issue sidebar: paste `Depends on: S##` and link sibling Issues.
5. **Use atomic sub-tasks** as checklist items (SRV-ID table) or spawn sub-issues for parallel agents.
6. **Acceptance criteria** are the merge gate — every checkbox must pass before closing the Issue.
7. **Cross-repo:** When Client coordination mentions client deliverables, link matching `C##` Issues in `ding-payments`.

### Field legend

| Field | Meaning |
|-------|---------|
| ETA | Macro stage (1–4), 5 deliverables each |
| Priority | P0 = MVP blocker, P1 = release quality, P2 = nice-to-have |
| Complexity | E = Easy, M = Medium, H = Hard (multi-day / multi-area) |
| Atomic tasks | Original `SRV-###` IDs merged into this deliverable |

### Stage flow

```mermaid
flowchart LR
  E1[ETA 1 Foundation and DB] --> E2[ETA 2 Auth and Contract]
  E2 --> E3[ETA 3 WebAuthn Stellar Payments]
  E3 --> E4[ETA 4 Confirm History Release]
```

---

## Task summary table

| ID | Title | ETA | P | C | Depends on | Atomic tasks |
|----|-------|-----|---|---|------------|--------------|
| S01 | Project bootstrap: README, env and dependencies | 1 | P0 | E | — | SRV-001, SRV-002, SRV-003 |
| S02 | Application core: config, main.ts and error handling | 1 | P0 | M | S01 | SRV-004, SRV-005, SRV-006 |
| S03 | Codebase structure and developer tooling | 1 | P0 | E | — | SRV-007, SRV-008 |
| S04 | Prisma setup, core schema and initial migration | 1 | P0 | M | S01, S02, S03 | SRV-009, SRV-010, SRV-011, SRV-012 |
| S05 | Extended schema, indexes, seed and DB documentation | 1 | P0/P1 | M | S04 | SRV-013–SRV-020 |
| S06 | Supabase authentication module and JWT strategy | 2 | P0 | M | S02 | SRV-021, SRV-022, SRV-023, SRV-024, SRV-025 |
| S07 | Users API, wallet linking and auth test suite | 2 | P0 | M | S04, S06 | SRV-026, SRV-027, SRV-028, SRV-029, SRV-030 |
| S08 | payment-request.v1 contract restore and validation core | 2 | P0 | M | S03 | SRV-031, SRV-032, SRV-033, SRV-034, SRV-035 |
| S09 | Payment requests API: Swagger, E2E, persist and retrieve | 2 | P0 | M | S05, S08, S06 | SRV-036, SRV-037, SRV-038, SRV-039, SRV-040 |
| S10 | WebAuthn module and payment authorization | 2 | P0 | H | S05, S09 | SRV-041, SRV-042, SRV-043, SRV-044, SRV-045 |
| S11 | WebAuthn hardening, tests and hybrid auth documentation | 3 | P0/P1 | M | S10 | SRV-046, SRV-047, SRV-048 |
| S12 | Stellar module: config, assets and transaction pipeline | 3 | P0 | H | S02 | SRV-049, SRV-050, SRV-051, SRV-052, SRV-053, SRV-054, SRV-055 |
| S13 | Stellar API surface: simulate, XDR validation and health | 3 | P0 | H | S12 | SRV-056, SRV-057, SRV-058, SRV-059, SRV-060 |
| S14 | Payment lifecycle: create, authorize and submit relay | 3 | P0 | H | S10, S12, S13, S09 | SRV-061, SRV-062, SRV-063, SRV-064, SRV-065, SRV-066 |
| S15 | Payment confirmation polling and failure handling | 3 | P0 | M | S14 | SRV-067, SRV-068, SRV-069, SRV-070, SRV-071, SRV-072 |
| S16 | Payment E2E, Swagger module and history API core | 4 | P0/P1 | H | S02, S15, S05 | SRV-073, SRV-074, SRV-075, SRV-076 |
| S17 | History reconciliation, DTOs and query optimization | 4 | P1/P2 | M | S16, S05 | SRV-077, SRV-078, SRV-079, SRV-080 |
| S18 | Security hardening: rate limits, validation and replay protection | 4 | P0 | H | S01, S08, S05, S13 | SRV-081, SRV-082, SRV-083, SRV-084, SRV-085, SRV-086, SRV-087, SRV-088 |
| S19 | Operational security, logging and quality gates | 4 | P0/P1 | M | S05, S02, S16 | SRV-089, SRV-090, SRV-091, SRV-092, SRV-093, SRV-094, SRV-095, SRV-096, SRV-097, SRV-099 |
| S20 | CI/CD, load testing, deploy and MVP release | 4 | P0/P1 | H | S19, S18, S16 | SRV-098, SRV-100, SRV-101, SRV-102, SRV-103, SRV-104, SRV-105, SRV-106 |

---



## ETA 1 — Foundation and database (5 deliverables)


NestJS bootstrap and complete Prisma schema. **Milestone: migrated database with all MVP models.**

### S01 — Project bootstrap: README, env and dependencies

| Field | Value |
|-------|-------|
| **ID** | S01 |
| **ETA** | 1 — Foundation and database |
| **Priority** | P0 |
| **Complexity** | Easy |
| **Depends on** | — |
| **Atomic tasks** | SRV-001, SRV-002, SRV-003 |
| **Milestone** | Repo bootstrapped with documented setup |

**Executive summary**

This deliverable consolidates 3 atomic server tasks into one sprint-sized ticket for **Project bootstrap: README, env and dependencies**.
Success means: Repo bootstrapped with documented setup.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S01 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- None (foundation deliverable)
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-001 | Update README with Ding Payments branding | Update README with Ding Payments branding |
| SRV-002 | Create .env.example with all variables | Create .env.example with all variables |
| SRV-003 | Install core server dependencies | Install core server dependencies |

**Scope — In**

- All atomic tasks SRV-001, SRV-002, SRV-003 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Ding Payments README with setup from Appendix C commands
- Complete `.env.example` matching ConfigModule validation

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Environment variables (full `.env.example` block):**

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

**Files to create/modify**

- `ding-server/README.md`
- `ding-server/.env.example`
- `ding-server/package.json`
- `See server-build-plan.md atomic files for SRV-001`
- `See server-build-plan.md atomic files for SRV-002`
- `See server-build-plan.md atomic files for SRV-003`

**Implementation guide**

1. Implement **SRV-001** — Update README with Ding Payments branding; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-002** — Create .env.example with all variables; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-003** — Install core server dependencies; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Run `npm run lint` and fix any new violations.
5. Run targeted unit tests for the module(s) touched.
6. Run `npm run test:e2e` when HTTP surface changed.
7. Update Swagger decorators if routes or DTOs changed.
8. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
9. Document any new env vars in `.env.example` and README.
10. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-001** — Update README with Ding Payments branding: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-002** — Create .env.example with all variables: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-003** — Install core server dependencies: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S01
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

No client dependency; ensure README links to client repo.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S02 — Application core: config, main.ts and error handling

| Field | Value |
|-------|-------|
| **ID** | S02 |
| **ETA** | 1 — Foundation and database |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S01 |
| **Atomic tasks** | SRV-004, SRV-005, SRV-006 |
| **Milestone** | Server boots with validated config and uniform errors |

**Executive summary**

This deliverable consolidates 3 atomic server tasks into one sprint-sized ticket for **Application core: config, main.ts and error handling**.
Success means: Server boots with validated config and uniform errors.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S02 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S01** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-004 | Configure ConfigModule and env validation | Configure ConfigModule and env validation |
| SRV-005 | Bootstrap production-ready main.ts | Bootstrap production-ready main.ts |
| SRV-006 | Global exception filter and error format | Global exception filter and error format |

**Scope — In**

- All atomic tasks SRV-004, SRV-005, SRV-006 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S02

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Environment variables (full `.env.example` block):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-004`
- `See server-build-plan.md atomic files for SRV-005`
- `See server-build-plan.md atomic files for SRV-006`

**Implementation guide**

1. Implement **SRV-004** — Configure ConfigModule and env validation; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-005** — Bootstrap production-ready main.ts; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-006** — Global exception filter and error format; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Run `npm run lint` and fix any new violations.
5. Run targeted unit tests for the module(s) touched.
6. Run `npm run test:e2e` when HTTP surface changed.
7. Update Swagger decorators if routes or DTOs changed.
8. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
9. Document any new env vars in `.env.example` and README.
10. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-004** — Configure ConfigModule and env validation: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-005** — Bootstrap production-ready main.ts: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-006** — Global exception filter and error format: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S02
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

Client `EXPO_PUBLIC_API_URL` must target this server's `/v1` prefix once C16 starts.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S03 — Codebase structure and developer tooling

| Field | Value |
|-------|-------|
| **ID** | S03 |
| **ETA** | 1 — Foundation and database |
| **Priority** | P0 |
| **Complexity** | Easy |
| **Depends on** | — |
| **Atomic tasks** | SRV-007, SRV-008 |
| **Milestone** | Flat module layout and agent rules aligned |

**Executive summary**

This deliverable consolidates 2 atomic server tasks into one sprint-sized ticket for **Codebase structure and developer tooling**.
Success means: Flat module layout and agent rules aligned.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S03 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- None (foundation deliverable)
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-007 | Base src/ folder structure | Base src/ folder structure |
| SRV-008 | Update .cursor/rules to flat layout | Update .cursor/rules to flat layout |

**Scope — In**

- All atomic tasks SRV-007, SRV-008 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S03

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Environment variables (full `.env.example` block):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-007`
- `See server-build-plan.md atomic files for SRV-008`

**Implementation guide**

1. Implement **SRV-007** — Base src/ folder structure; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-008** — Update .cursor/rules to flat layout; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Run `npm run lint` and fix any new violations.
4. Run targeted unit tests for the module(s) touched.
5. Run `npm run test:e2e` when HTTP surface changed.
6. Update Swagger decorators if routes or DTOs changed.
7. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
8. Document any new env vars in `.env.example` and README.
9. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-007** — Base src/ folder structure: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-008** — Update .cursor/rules to flat layout: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S03
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S04 — Prisma setup, core schema and initial migration

| Field | Value |
|-------|-------|
| **ID** | S04 |
| **ETA** | 1 — Foundation and database |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S01, S02, S03 |
| **Atomic tasks** | SRV-009, SRV-010, SRV-011, SRV-012 |
| **Milestone** | User/Wallet schema migrated |
| **Blocker** | Yes — see Hard blockers section |

**Executive summary**

This deliverable consolidates 4 atomic server tasks into one sprint-sized ticket for **Prisma setup, core schema and initial migration**.
Success means: User/Wallet schema migrated.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S04 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S01** merged and deployed to dev
- Deliverable **S02** merged and deployed to dev
- Deliverable **S03** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-009 | Install Prisma and npm scripts | Install Prisma and npm scripts |
| SRV-010 | Initial Prisma schema User and Wallet | Initial Prisma schema User and Wallet |
| SRV-011 | DatabaseModule and PrismaService | DatabaseModule and PrismaService |
| SRV-012 | Initial database migration | Initial database migration |

**Scope — In**

- All atomic tasks SRV-009, SRV-010, SRV-011, SRV-012 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S04

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Environment variables (full `.env.example` block):**

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

**Prisma enums (domain):**

```prisma
enum StellarNetwork { TESTNET MAINNET }
enum AssetCode { XLM USDC }
enum PaymentRequestStatus { CREATED SHARED EXPIRED CONSUMED }
enum PaymentStatus { CREATED AUTHORIZED SUBMITTED CONFIRMED FAILED }
enum TransactionDirection { SENT RECEIVED }
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-009`
- `See server-build-plan.md atomic files for SRV-010`
- `See server-build-plan.md atomic files for SRV-011`

**Implementation guide**

1. Implement **SRV-009** — Install Prisma and npm scripts; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-010** — Initial Prisma schema User and Wallet; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-011** — DatabaseModule and PrismaService; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-012** — Initial database migration; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Run `npm run lint` and fix any new violations.
6. Run targeted unit tests for the module(s) touched.
7. Run `npm run test:e2e` when HTTP surface changed.
8. Update Swagger decorators if routes or DTOs changed.
9. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
10. Document any new env vars in `.env.example` and README.
11. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-009** — Install Prisma and npm scripts: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-010** — Initial Prisma schema User and Wallet: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-011** — DatabaseModule and PrismaService: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-012** — Initial database migration: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S04
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S05 — Extended schema, indexes, seed and DB documentation

| Field | Value |
|-------|-------|
| **ID** | S05 |
| **ETA** | 1 — Foundation and database |
| **Priority** | P0/P1 |
| **Complexity** | Medium |
| **Depends on** | S04 |
| **Atomic tasks** | SRV-013, SRV-014, SRV-015, SRV-016, SRV-017, SRV-018, SRV-019, SRV-020 |
| **Milestone** | Full domain schema and seed |

**Executive summary**

This deliverable consolidates 8 atomic server tasks into one sprint-sized ticket for **Extended schema, indexes, seed and DB documentation**.
Success means: Full domain schema and seed.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S05 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S04** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-013 | Extend schema PaymentRequest and Payment | Extend schema PaymentRequest and Payment |
| SRV-014 | Extend schema Transaction WebAuthn UsedRequestId | Extend schema Transaction WebAuthn UsedRequestId |
| SRV-015 | Database indexes and constraints | Database indexes and constraints |
| SRV-016 | Development seed script | Development seed script |
| SRV-017 | Document Supabase connection in README | Document Supabase connection in README |
| SRV-018 | Optional RLS script for Supabase | Optional RLS script for Supabase |
| SRV-019 | Document Prisma inline transaction patterns | Document Prisma inline transaction patterns |
| SRV-020 | CI prisma generate in workflow | CI prisma generate in workflow |

**Scope — In**

- All atomic tasks SRV-013, SRV-014, SRV-015, SRV-016, SRV-017, SRV-018, SRV-019, SRV-020 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S05

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Environment variables (full `.env.example` block):**

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

**Prisma enums (domain):**

```prisma
enum StellarNetwork { TESTNET MAINNET }
enum AssetCode { XLM USDC }
enum PaymentRequestStatus { CREATED SHARED EXPIRED CONSUMED }
enum PaymentStatus { CREATED AUTHORIZED SUBMITTED CONFIRMED FAILED }
enum TransactionDirection { SENT RECEIVED }
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-013`
- `See server-build-plan.md atomic files for SRV-014`
- `See server-build-plan.md atomic files for SRV-015`

**Implementation guide**

1. Implement **SRV-013** — Extend schema PaymentRequest and Payment; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-014** — Extend schema Transaction WebAuthn UsedRequestId; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-015** — Database indexes and constraints; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-016** — Development seed script; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-017** — Document Supabase connection in README; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-018** — Optional RLS script for Supabase; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Implement **SRV-019** — Document Prisma inline transaction patterns; cross-check Section 8 in server-build-plan.md for files and snippets.
8. Implement **SRV-020** — CI prisma generate in workflow; cross-check Section 8 in server-build-plan.md for files and snippets.
9. Run `npm run lint` and fix any new violations.
10. Run targeted unit tests for the module(s) touched.
11. Run `npm run test:e2e` when HTTP surface changed.
12. Update Swagger decorators if routes or DTOs changed.
13. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
14. Document any new env vars in `.env.example` and README.
15. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-013** — Extend schema PaymentRequest and Payment: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-014** — Extend schema Transaction WebAuthn UsedRequestId: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-015** — Database indexes and constraints: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-016** — Development seed script: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-017** — Document Supabase connection in README: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-018** — Optional RLS script for Supabase: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-019** — Document Prisma inline transaction patterns: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-020** — CI prisma generate in workflow: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S05
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---


## ETA 2 — Auth and payment-request contract (5 deliverables)


Supabase JWT, users API, and NFC validation surface. **Milestone: client can validate and persist payment requests.**

### S06 — Supabase authentication module and JWT strategy

| Field | Value |
|-------|-------|
| **ID** | S06 |
| **ETA** | 2 — Auth and payment-request contract |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S02 |
| **Atomic tasks** | SRV-021, SRV-022, SRV-023, SRV-024, SRV-025 |
| **Milestone** | JWT guard on protected routes |
| **Blocker** | Yes — see Hard blockers section |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **Supabase authentication module and JWT strategy**.
Success means: JWT guard on protected routes.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S06 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S02** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-021 | SupabaseModule and SupabaseService | SupabaseModule and SupabaseService |
| SRV-022 | SupabaseStrategy Passport JWT | SupabaseStrategy Passport JWT |
| SRV-023 | Global SupabaseAuthGuard and Public decorator | Global SupabaseAuthGuard and Public decorator |
| SRV-024 | CurrentUser decorator and AuthenticatedUser interface | CurrentUser decorator and AuthenticatedUser interface |
| SRV-025 | UsersModule sync user on first login | UsersModule sync user on first login |

**Scope — In**

- All atomic tasks SRV-021, SRV-022, SRV-023, SRV-024, SRV-025 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S06

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-021`
- `See server-build-plan.md atomic files for SRV-022`
- `See server-build-plan.md atomic files for SRV-023`

**Implementation guide**

1. Implement **SRV-021** — SupabaseModule and SupabaseService; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-022** — SupabaseStrategy Passport JWT; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-023** — Global SupabaseAuthGuard and Public decorator; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-024** — CurrentUser decorator and AuthenticatedUser interface; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-025** — UsersModule sync user on first login; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-021** — SupabaseModule and SupabaseService: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-022** — SupabaseStrategy Passport JWT: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-023** — Global SupabaseAuthGuard and Public decorator: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-024** — CurrentUser decorator and AuthenticatedUser interface: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-025** — UsersModule sync user on first login: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S06
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- JWT validated with `SUPABASE_JWT_SECRET`; clock skew tolerance documented

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S07 — Users API, wallet linking and auth test suite

| Field | Value |
|-------|-------|
| **ID** | S07 |
| **ETA** | 2 — Auth and payment-request contract |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S04, S06 |
| **Atomic tasks** | SRV-026, SRV-027, SRV-028, SRV-029, SRV-030 |
| **Milestone** | Profile and wallet linking live |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **Users API, wallet linking and auth test suite**.
Success means: Profile and wallet linking live.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S07 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S04** merged and deployed to dev
- Deliverable **S06** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-026 | GET /v1/users/me | GET /v1/users/me |
| SRV-027 | POST /v1/users/me/wallet link pubkey | POST /v1/users/me/wallet link pubkey |
| SRV-028 | Validate Stellar G... format in wallet | Validate Stellar G... format in wallet |
| SRV-029 | Unit tests auth guards and strategy | Unit tests auth guards and strategy |
| SRV-030 | E2E auth with JWT mock | E2E auth with JWT mock |

**Scope — In**

- All atomic tasks SRV-026, SRV-027, SRV-028, SRV-029, SRV-030 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S07

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Endpoint reference (MVP):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-026`
- `See server-build-plan.md atomic files for SRV-027`
- `See server-build-plan.md atomic files for SRV-028`

**Implementation guide**

1. Implement **SRV-026** — GET /v1/users/me; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-027** — POST /v1/users/me/wallet link pubkey; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-028** — Validate Stellar G... format in wallet; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-029** — Unit tests auth guards and strategy; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-030** — E2E auth with JWT mock; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-026** — GET /v1/users/me: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-027** — POST /v1/users/me/wallet link pubkey: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-028** — Validate Stellar G... format in wallet: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-029** — Unit tests auth guards and strategy: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-030** — E2E auth with JWT mock: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S07
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S08 — payment-request.v1 contract restore and validation core

| Field | Value |
|-------|-------|
| **ID** | S08 |
| **ETA** | 2 — Auth and payment-request contract |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S03 |
| **Atomic tasks** | SRV-031, SRV-032, SRV-033, SRV-034, SRV-035 |
| **Milestone** | Public validate endpoint |
| **Blocker** | Yes — see Hard blockers section |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **payment-request.v1 contract restore and validation core**.
Success means: Public validate endpoint.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S08 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S03** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-031 | Restore docs/payment-request.v1.md | Restore docs/payment-request.v1.md |
| SRV-032 | Port payment-request.v1.ts from git | Port payment-request.v1.ts from git |
| SRV-033 | Unit tests payment-request.v1 contract | Unit tests payment-request.v1 contract |
| SRV-034 | PaymentRequestsModule scaffold | PaymentRequestsModule scaffold |
| SRV-035 | POST /v1/payment-requests/validate | POST /v1/payment-requests/validate |

**Scope — In**

- All atomic tasks SRV-031, SRV-032, SRV-033, SRV-034, SRV-035 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Restore `docs/payment-request.v1.md` and port `payment-request.v1.ts` from git `5d4e9de^`
- Public validate endpoint with PAYMENT_REQUEST_* error codes

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/docs/payment-request.v1.md`
- `ding-server/src/contracts/payment-request.v1.ts`
- `ding-server/src/modules/payment-requests/`
- `See server-build-plan.md atomic files for SRV-031`
- `See server-build-plan.md atomic files for SRV-032`
- `See server-build-plan.md atomic files for SRV-033`

**Implementation guide**

1. Implement **SRV-031** — Restore docs/payment-request.v1.md; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-032** — Port payment-request.v1.ts from git; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-033** — Unit tests payment-request.v1 contract; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-034** — PaymentRequestsModule scaffold; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-035** — POST /v1/payment-requests/validate; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### API examples — `POST /v1/payment-requests/validate`

**Request (public, no JWT):**
```json
{
  "type": "payment-request",
  "version": 1,
  "recipient": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  "asset": "USDC",
  "amount": "25.00",
  "timestamp": "2026-06-17T12:00:00.000Z",
  "expiresAt": "2026-06-17T12:00:30.000Z",
  "requestId": "req_unique_123",
  "memo": "Coffee"
}
```

**Response 200 (valid):**
```json
{
  "valid": true,
  "normalized": {
    "type": "payment-request",
    "version": 1,
    "recipient": "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    "asset": "USDC",
    "amount": "25.00",
    "timestamp": "2026-06-17T12:00:00.000Z",
    "expiresAt": "2026-06-17T12:00:30.000Z"
  },
  "errors": []
}
```

**Response 200 (invalid):**
```json
{
  "valid": false,
  "normalized": null,
  "errors": [
    { "code": "PAYMENT_REQUEST_ASSET_UNSUPPORTED", "field": "asset", "message": "Asset BTC is not supported" }
  ]
}
```


**Acceptance criteria**

- [ ] **SRV-031** — Restore docs/payment-request.v1.md: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-032** — Port payment-request.v1.ts from git: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-033** — Unit tests payment-request.v1 contract: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-034** — PaymentRequestsModule scaffold: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-035** — POST /v1/payment-requests/validate: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S08
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

Lock schema with client C10/C11 before changing validate rules.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Validate endpoint is public — rate limit in S18; no PII in validate logs

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S09 — Payment requests API: Swagger, E2E, persist and retrieve

| Field | Value |
|-------|-------|
| **ID** | S09 |
| **ETA** | 2 — Auth and payment-request contract |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S05, S08, S06 |
| **Atomic tasks** | SRV-036, SRV-037, SRV-038, SRV-039, SRV-040 |
| **Milestone** | Persist + anti-replay |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **Payment requests API: Swagger, E2E, persist and retrieve**.
Success means: Persist + anti-replay.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S09 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S05** merged and deployed to dev
- Deliverable **S08** merged and deployed to dev
- Deliverable **S06** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-036 | DTO and Swagger for validate endpoint | DTO and Swagger for validate endpoint |
| SRV-037 | E2E validate valid and invalid Stellar cases | E2E validate valid and invalid Stellar cases |
| SRV-038 | POST /v1/payment-requests persist receiver | POST /v1/payment-requests persist receiver |
| SRV-039 | Anti-replay requestId in UsedRequestId | Anti-replay requestId in UsedRequestId |
| SRV-040 | GET /v1/payment-requests/:id | GET /v1/payment-requests/:id |

**Scope — In**

- All atomic tasks SRV-036, SRV-037, SRV-038, SRV-039, SRV-040 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S09

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-036`
- `See server-build-plan.md atomic files for SRV-037`
- `See server-build-plan.md atomic files for SRV-038`

**Implementation guide**

1. Implement **SRV-036** — DTO and Swagger for validate endpoint; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-037** — E2E validate valid and invalid Stellar cases; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-038** — POST /v1/payment-requests persist receiver; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-039** — Anti-replay requestId in UsedRequestId; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-040** — GET /v1/payment-requests/:id; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### API examples — persist and retrieve payment requests

**`POST /v1/payment-requests` (JWT — receiver):**
```json
{
  "type": "payment-request",
  "version": 1,
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "USDC",
  "amount": "10.00",
  "timestamp": "2026-06-17T12:00:00.000Z",
  "expiresAt": "2026-06-17T12:00:30.000Z",
  "requestId": "req_receiver_001"
}
```

**Response 201:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "CREATED",
  "externalRequestId": "req_receiver_001",
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "USDC",
  "amount": "10.00",
  "expiresAt": "2026-06-17T12:00:30.000Z"
}
```

**`GET /v1/payment-requests/:id` (JWT — owner):**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SHARED",
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "USDC",
  "amount": "10.00",
  "expiresAt": "2026-06-17T12:00:30.000Z",
  "createdAt": "2026-06-17T12:00:00.000Z"
}
```

**Anti-replay:** duplicate `requestId` → HTTP 409 `{ "code": "PAYMENT_REQUEST_ID_REPLAY" }`


**Acceptance criteria**

- [ ] **SRV-036** — DTO and Swagger for validate endpoint: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-037** — E2E validate valid and invalid Stellar cases: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-038** — POST /v1/payment-requests persist receiver: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-039** — Anti-replay requestId in UsedRequestId: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-040** — GET /v1/payment-requests/:id: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S09
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S10 — WebAuthn module and payment authorization

| Field | Value |
|-------|-------|
| **ID** | S10 |
| **ETA** | 2 — Auth and payment-request contract |
| **Priority** | P0 |
| **Complexity** | Hard |
| **Depends on** | S05, S09 |
| **Atomic tasks** | SRV-041, SRV-042, SRV-043, SRV-044, SRV-045 |
| **Milestone** | CREATED → AUTHORIZED |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **WebAuthn module and payment authorization**.
Success means: CREATED → AUTHORIZED.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S10 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S05** merged and deployed to dev
- Deliverable **S09** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-041 | Install @simplewebauthn/server | Install @simplewebauthn/server |
| SRV-042 | WebAuthnModule and challenge store DB | WebAuthnModule and challenge store DB |
| SRV-043 | POST webauthn register options and verify | POST webauthn register options and verify |
| SRV-044 | POST webauthn authenticate options | POST webauthn authenticate options |
| SRV-045 | POST /v1/payments/:id/authorize WebAuthn | POST /v1/payments/:id/authorize WebAuthn |

**Scope — In**

- All atomic tasks SRV-041, SRV-042, SRV-043, SRV-044, SRV-045 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S10

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-041`
- `See server-build-plan.md atomic files for SRV-042`
- `See server-build-plan.md atomic files for SRV-043`

**Implementation guide**

1. Implement **SRV-041** — Install @simplewebauthn/server; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-042** — WebAuthnModule and challenge store DB; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-043** — POST webauthn register options and verify; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-044** — POST webauthn authenticate options; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-045** — POST /v1/payments/:id/authorize WebAuthn; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### API examples — WebAuthn authorize

**`POST /v1/webauthn/authenticate/options` (JWT):**
```json
{ "paymentId": "550e8400-e29b-41d4-a716-446655440000" }
```

**`POST /v1/payments/:id/authorize` (JWT + assertion):**
```json
{
  "id": "credential-id-base64",
  "rawId": "...",
  "type": "public-key",
  "response": {
    "authenticatorData": "...",
    "clientDataJSON": "...",
    "signature": "..."
  }
}
```

**Response 200 — state transition `CREATED` → `AUTHORIZED`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "AUTHORIZED",
  "authorizedAt": "2026-06-17T12:00:15.000Z"
}
```

**Errors:** `PAYMENT_INVALID_STATE`, `WEBAUTHN_VERIFICATION_FAILED`, `WEBAUTHN_CHALLENGE_EXPIRED`


**Acceptance criteria**

- [ ] **SRV-041** — Install @simplewebauthn/server: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-042** — WebAuthnModule and challenge store DB: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-043** — POST webauthn register options and verify: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-044** — POST webauthn authenticate options: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-045** — POST /v1/payments/:id/authorize WebAuthn: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S10
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- WebAuthn origin must match `WEBAUTHN_ORIGIN` per environment

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---


## ETA 3 — WebAuthn, Stellar and payment pipeline (5 deliverables)


Stellar relay and payment state machine through on-chain submit. **Milestone: signed XDR broadcast with polling started.**

### S11 — WebAuthn hardening, tests and hybrid auth documentation

| Field | Value |
|-------|-------|
| **ID** | S11 |
| **ETA** | 3 — WebAuthn, Stellar and payment pipeline |
| **Priority** | P0/P1 |
| **Complexity** | Medium |
| **Depends on** | S10 |
| **Atomic tasks** | SRV-046, SRV-047, SRV-048 |
| **Milestone** | WebAuthn production-ready |

**Executive summary**

This deliverable consolidates 3 atomic server tasks into one sprint-sized ticket for **WebAuthn hardening, tests and hybrid auth documentation**.
Success means: WebAuthn production-ready.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S11 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S10** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-046 | Per-device credentials policy | Per-device credentials policy |
| SRV-047 | WebAuthn tests with mocks | WebAuthn tests with mocks |
| SRV-048 | Document hybrid auth flow in ARCHITECTURE | Document hybrid auth flow in ARCHITECTURE |

**Scope — In**

- All atomic tasks SRV-046, SRV-047, SRV-048 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S11

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-046`
- `See server-build-plan.md atomic files for SRV-047`
- `See server-build-plan.md atomic files for SRV-048`

**Implementation guide**

1. Implement **SRV-046** — Per-device credentials policy; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-047** — WebAuthn tests with mocks; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-048** — Document hybrid auth flow in ARCHITECTURE; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Run `npm run lint` and fix any new violations.
5. Run targeted unit tests for the module(s) touched.
6. Run `npm run test:e2e` when HTTP surface changed.
7. Update Swagger decorators if routes or DTOs changed.
8. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
9. Document any new env vars in `.env.example` and README.
10. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-046** — Per-device credentials policy: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-047** — WebAuthn tests with mocks: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-048** — Document hybrid auth flow in ARCHITECTURE: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S11
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S12 — Stellar module: config, assets and transaction pipeline

| Field | Value |
|-------|-------|
| **ID** | S12 |
| **ETA** | 3 — WebAuthn, Stellar and payment pipeline |
| **Priority** | P0 |
| **Complexity** | Hard |
| **Depends on** | S02 |
| **Atomic tasks** | SRV-049, SRV-050, SRV-051, SRV-052, SRV-053, SRV-054, SRV-055 |
| **Milestone** | StellarService pipeline |

**Executive summary**

This deliverable consolidates 7 atomic server tasks into one sprint-sized ticket for **Stellar module: config, assets and transaction pipeline**.
Success means: StellarService pipeline.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S12 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S02** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-049 | StellarModule and network configuration | StellarModule and network configuration |
| SRV-050 | StellarService getAccount and health | StellarService getAccount and health |
| SRV-051 | Resolve asset codes XLM and USDC | Resolve asset codes XLM and USDC |
| SRV-052 | buildPaymentTransaction unsigned | buildPaymentTransaction unsigned |
| SRV-053 | simulateTransaction via RPC | simulateTransaction via RPC |
| SRV-054 | submitTransaction broadcast XDR | submitTransaction broadcast XDR |
| SRV-055 | pollTransactionStatus with timeout | pollTransactionStatus with timeout |

**Scope — In**

- All atomic tasks SRV-049, SRV-050, SRV-051, SRV-052, SRV-053, SRV-054, SRV-055 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S12

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-049`
- `See server-build-plan.md atomic files for SRV-050`
- `See server-build-plan.md atomic files for SRV-051`

**Implementation guide**

1. Implement **SRV-049** — StellarModule and network configuration; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-050** — StellarService getAccount and health; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-051** — Resolve asset codes XLM and USDC; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-052** — buildPaymentTransaction unsigned; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-053** — simulateTransaction via RPC; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-054** — submitTransaction broadcast XDR; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Implement **SRV-055** — pollTransactionStatus with timeout; cross-check Section 8 in server-build-plan.md for files and snippets.
8. Run `npm run lint` and fix any new violations.
9. Run targeted unit tests for the module(s) touched.
10. Run `npm run test:e2e` when HTTP surface changed.
11. Update Swagger decorators if routes or DTOs changed.
12. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
13. Document any new env vars in `.env.example` and README.
14. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-049** — StellarModule and network configuration: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-050** — StellarService getAccount and health: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-051** — Resolve asset codes XLM and USDC: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-052** — buildPaymentTransaction unsigned: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-053** — simulateTransaction via RPC: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-054** — submitTransaction broadcast XDR: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-055** — pollTransactionStatus with timeout: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S12
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S13 — Stellar API surface: simulate, XDR validation and health

| Field | Value |
|-------|-------|
| **ID** | S13 |
| **ETA** | 3 — WebAuthn, Stellar and payment pipeline |
| **Priority** | P0 |
| **Complexity** | Hard |
| **Depends on** | S12 |
| **Atomic tasks** | SRV-056, SRV-057, SRV-058, SRV-059, SRV-060 |
| **Milestone** | Simulate + health endpoints |

**Executive summary**

This deliverable consolidates 5 atomic server tasks into one sprint-sized ticket for **Stellar API surface: simulate, XDR validation and health**.
Success means: Simulate + health endpoints.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S13 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S12** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-056 | POST /v1/transactions/simulate | POST /v1/transactions/simulate |
| SRV-057 | Validate XDR matches payment intent | Validate XDR matches payment intent |
| SRV-058 | Horizon error handling and Stellar codes | Horizon error handling and Stellar codes |
| SRV-059 | GET /health/stellar | GET /health/stellar |
| SRV-060 | StellarService tests with SDK mocks | StellarService tests with SDK mocks |

**Scope — In**

- All atomic tasks SRV-056, SRV-057, SRV-058, SRV-059, SRV-060 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S13

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-056`
- `See server-build-plan.md atomic files for SRV-057`
- `See server-build-plan.md atomic files for SRV-058`

**Implementation guide**

1. Implement **SRV-056** — POST /v1/transactions/simulate; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-057** — Validate XDR matches payment intent; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-058** — Horizon error handling and Stellar codes; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-059** — GET /health/stellar; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-060** — StellarService tests with SDK mocks; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Run `npm run lint` and fix any new violations.
7. Run targeted unit tests for the module(s) touched.
8. Run `npm run test:e2e` when HTTP surface changed.
9. Update Swagger decorators if routes or DTOs changed.
10. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
11. Document any new env vars in `.env.example` and README.
12. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-056** — POST /v1/transactions/simulate: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-057** — Validate XDR matches payment intent: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-058** — Horizon error handling and Stellar codes: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-059** — GET /health/stellar: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-060** — StellarService tests with SDK mocks: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S13
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S14 — Payment lifecycle: create, authorize and submit relay

| Field | Value |
|-------|-------|
| **ID** | S14 |
| **ETA** | 3 — WebAuthn, Stellar and payment pipeline |
| **Priority** | P0 |
| **Complexity** | Hard |
| **Depends on** | S10, S12, S13, S09 |
| **Atomic tasks** | SRV-061, SRV-062, SRV-063, SRV-064, SRV-065, SRV-066 |
| **Milestone** | Submit relay on testnet |
| **Blocker** | Yes — see Hard blockers section |
| **Critical path** | Yes — submit relay core |

**Executive summary**

This deliverable consolidates 6 atomic server tasks into one sprint-sized ticket for **Payment lifecycle: create, authorize and submit relay**.
Success means: Submit relay on testnet.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S14 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S10** merged and deployed to dev
- Deliverable **S12** merged and deployed to dev
- Deliverable **S13** merged and deployed to dev
- Deliverable **S09** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-061 | PaymentsModule and state machine service | PaymentsModule and state machine service |
| SRV-062 | POST /v1/payments create intent | POST /v1/payments create intent |
| SRV-063 | Validate sender distinct from receiver and hints | Validate sender distinct from receiver and hints |
| SRV-064 | Transition CREATED to AUTHORIZED | Transition CREATED to AUTHORIZED |
| SRV-065 | POST /v1/payments/:id/submit relay XDR | POST /v1/payments/:id/submit relay XDR |
| SRV-066 | Transition AUTHORIZED to SUBMITTED | Transition AUTHORIZED to SUBMITTED |

**Scope — In**

- All atomic tasks SRV-061, SRV-062, SRV-063, SRV-064, SRV-065, SRV-066 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- PaymentsModule, PaymentStateMachine service, create/authorize/submit endpoints
- Enforce sender ≠ receiver and XDR intent match

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Prisma enums (domain):**

```prisma
enum StellarNetwork { TESTNET MAINNET }
enum AssetCode { XLM USDC }
enum PaymentRequestStatus { CREATED SHARED EXPIRED CONSUMED }
enum PaymentStatus { CREATED AUTHORIZED SUBMITTED CONFIRMED FAILED }
enum TransactionDirection { SENT RECEIVED }
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/src/modules/payments/payment-state.machine.ts`
- `ding-server/src/modules/payments/payments.service.ts`
- `See server-build-plan.md atomic files for SRV-061`
- `See server-build-plan.md atomic files for SRV-062`
- `See server-build-plan.md atomic files for SRV-063`

**Implementation guide**

1. Implement **SRV-061** — PaymentsModule and state machine service; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-062** — POST /v1/payments create intent; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-063** — Validate sender distinct from receiver and hints; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-064** — Transition CREATED to AUTHORIZED; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-065** — POST /v1/payments/:id/submit relay XDR; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-066** — Transition AUTHORIZED to SUBMITTED; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Run `npm run lint` and fix any new violations.
8. Run targeted unit tests for the module(s) touched.
9. Run `npm run test:e2e` when HTTP surface changed.
10. Update Swagger decorators if routes or DTOs changed.
11. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
12. Document any new env vars in `.env.example` and README.
13. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### Payment state transitions (create → authorize → submit)

| From | To | Endpoint |
|------|-----|----------|
| — | `CREATED` | `POST /v1/payments` |
| `CREATED` | `AUTHORIZED` | `POST /v1/payments/:id/authorize` |
| `AUTHORIZED` | `SUBMITTED` | `POST /v1/payments/:id/submit` |

**`POST /v1/payments` (JWT — sender):**
```json
{
  "paymentRequestId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "senderPublicKey": "GCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
  "normalizedPayload": {
    "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    "asset": "USDC",
    "amount": "25.00",
    "expiresAt": "2026-06-17T12:00:30.000Z"
  }
}
```

**Response 201:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CREATED",
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "asset": "USDC",
  "amount": "25.00",
  "expiresAt": "2026-06-17T12:00:30.000Z"
}
```

**`POST /v1/payments/:id/submit` (JWT — signed XDR):**
```json
{ "signedXdr": "AAAAAgAAAAD..." }
```

**Response 200 — `AUTHORIZED` → `SUBMITTED`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUBMITTED",
  "stellarTxHash": "abc123def456..."
}
```

**Idempotency:** same XDR resubmit → 200 with current state. Different XDR → `409 PAYMENT_ALREADY_SUBMITTED`.


**Acceptance criteria**

- [ ] **SRV-061** — PaymentsModule and state machine service: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-062** — POST /v1/payments create intent: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-063** — Validate sender distinct from receiver and hints: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-064** — Transition CREATED to AUTHORIZED: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-065** — POST /v1/payments/:id/submit relay XDR: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-066** — Transition AUTHORIZED to SUBMITTED: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S14
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

Critical path with C13/C14 for first E2E payment.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- XDR validation must ensure signer matches `senderPublicKey` and payment intent

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S15 — Payment confirmation polling and failure handling

| Field | Value |
|-------|-------|
| **ID** | S15 |
| **ETA** | 3 — WebAuthn, Stellar and payment pipeline |
| **Priority** | P0 |
| **Complexity** | Medium |
| **Depends on** | S14 |
| **Atomic tasks** | SRV-067, SRV-068, SRV-069, SRV-070, SRV-071, SRV-072 |
| **Milestone** | Terminal payment states |

**Executive summary**

This deliverable consolidates 6 atomic server tasks into one sprint-sized ticket for **Payment confirmation polling and failure handling**.
Success means: Terminal payment states.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S15 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S14** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-067 | Event listener polling confirmation | Event listener polling confirmation |
| SRV-068 | Transition SUBMITTED to CONFIRMED or FAILED | Transition SUBMITTED to CONFIRMED or FAILED |
| SRV-069 | GET /v1/payments/:id full status | GET /v1/payments/:id full status |
| SRV-070 | Event payment.confirmed index Transaction | Event payment.confirmed index Transaction |
| SRV-071 | Idempotency on submit same paymentId | Idempotency on submit same paymentId |
| SRV-072 | Timeout FAILED if no submit in time | Timeout FAILED if no submit in time |

**Scope — In**

- All atomic tasks SRV-067, SRV-068, SRV-069, SRV-070, SRV-071, SRV-072 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S15

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Prisma enums (domain):**

```prisma
enum StellarNetwork { TESTNET MAINNET }
enum AssetCode { XLM USDC }
enum PaymentRequestStatus { CREATED SHARED EXPIRED CONSUMED }
enum PaymentStatus { CREATED AUTHORIZED SUBMITTED CONFIRMED FAILED }
enum TransactionDirection { SENT RECEIVED }
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-067`
- `See server-build-plan.md atomic files for SRV-068`
- `See server-build-plan.md atomic files for SRV-069`

**Implementation guide**

1. Implement **SRV-067** — Event listener polling confirmation; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-068** — Transition SUBMITTED to CONFIRMED or FAILED; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-069** — GET /v1/payments/:id full status; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-070** — Event payment.confirmed index Transaction; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-071** — Idempotency on submit same paymentId; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-072** — Timeout FAILED if no submit in time; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Run `npm run lint` and fix any new violations.
8. Run targeted unit tests for the module(s) touched.
9. Run `npm run test:e2e` when HTTP surface changed.
10. Update Swagger decorators if routes or DTOs changed.
11. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
12. Document any new env vars in `.env.example` and README.
13. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### Payment state transitions (confirmation)

| From | To | Trigger |
|------|-----|---------|
| `SUBMITTED` | `CONFIRMED` | Stellar poll success |
| `SUBMITTED` | `FAILED` | Poll fail / timeout |
| `CREATED` / `AUTHORIZED` | `FAILED` | `PAYMENT_SUBMIT_TIMEOUT_MS` or `expiresAt` |

**`GET /v1/payments/:id` — confirmed (JWT — sender or receiver):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "CONFIRMED",
  "asset": "USDC",
  "amount": "25.00",
  "recipient": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "senderPublicKey": "GCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
  "stellarTxHash": "abc123...",
  "confirmedAt": "2026-06-17T12:00:05.000Z",
  "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123"
}
```

**`GET /v1/payments/:id` — failed:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "FAILED",
  "failureCode": "STELLAR_OP_UNDERFUNDED",
  "failureReason": "Source account insufficient balance"
}
```


**Acceptance criteria**

- [ ] **SRV-067** — Event listener polling confirmation: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-068** — Transition SUBMITTED to CONFIRMED or FAILED: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-069** — GET /v1/payments/:id full status: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-070** — Event payment.confirmed index Transaction: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-071** — Idempotency on submit same paymentId: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-072** — Timeout FAILED if no submit in time: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S15
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---


## ETA 4 — History, security and release (5 deliverables)


History API, hardening, observability, deploy. **Milestone: server deployable to staging with release checklist.**

### S16 — Payment E2E, Swagger module and history API core

| Field | Value |
|-------|-------|
| **ID** | S16 |
| **ETA** | 4 — History, security and release |
| **Priority** | P0/P1 |
| **Complexity** | Hard |
| **Depends on** | S02, S15, S05 |
| **Atomic tasks** | SRV-073, SRV-074, SRV-075, SRV-076 |
| **Milestone** | E2E green in CI |
| **Blocker** | Yes — see Hard blockers section |

**Executive summary**

This deliverable consolidates 4 atomic server tasks into one sprint-sized ticket for **Payment E2E, Swagger module and history API core**.
Success means: E2E green in CI.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S16 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S02** merged and deployed to dev
- Deliverable **S15** merged and deployed to dev
- Deliverable **S05** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-073 | E2E full flow with mock Stellar | E2E full flow with mock Stellar |
| SRV-074 | Complete Swagger payments module | Complete Swagger payments module |
| SRV-075 | TransactionsModule GET /v1/transactions | TransactionsModule GET /v1/transactions |
| SRV-076 | History filters asset date role status | History filters asset date role status |

**Scope — In**

- All atomic tasks SRV-073, SRV-074, SRV-075, SRV-076 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S16

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Endpoint reference (MVP):**

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

**Payment state machine (Section 6 excerpt):**

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-073`
- `See server-build-plan.md atomic files for SRV-074`
- `See server-build-plan.md atomic files for SRV-075`

**Implementation guide**

1. Implement **SRV-073** — E2E full flow with mock Stellar; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-074** — Complete Swagger payments module; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-075** — TransactionsModule GET /v1/transactions; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-076** — History filters asset date role status; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Run `npm run lint` and fix any new violations.
6. Run targeted unit tests for the module(s) touched.
7. Run `npm run test:e2e` when HTTP surface changed.
8. Update Swagger decorators if routes or DTOs changed.
9. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
10. Document any new env vars in `.env.example` and README.
11. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

#### E2E payment + history API

Full sequence in `test/payments-full-flow.e2e-spec.ts`:

1. `POST /v1/payment-requests/validate` — valid payload
2. `POST /v1/payment-requests` — persist (receiver JWT)
3. `POST /v1/payments` — create intent (sender JWT)
4. `POST /v1/webauthn/authenticate/options` + `POST /v1/payments/:id/authorize`
5. `POST /v1/payments/:id/submit` — mock Stellar broadcast
6. Poll `GET /v1/payments/:id` until `CONFIRMED`
7. `GET /v1/transactions` — history contains indexed row

**`GET /v1/transactions?page=1&limit=20` (JWT):**
```json
{
  "data": [
    {
      "id": "tx-uuid",
      "stellarTxHash": "abc123",
      "direction": "SENT",
      "counterparty": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "asset": "USDC",
      "amount": "25.00",
      "createdAt": "2026-06-17T12:00:05.000Z",
      "explorerUrl": "https://stellar.expert/explorer/testnet/tx/abc123"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```


**Acceptance criteria**

- [ ] **SRV-073** — E2E full flow with mock Stellar: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-074** — Complete Swagger payments module: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-075** — TransactionsModule GET /v1/transactions: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-076** — History filters asset date role status: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S16
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

Client C18 E2E matrix depends on this E2E suite passing.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S17 — History reconciliation, DTOs and query optimization

| Field | Value |
|-------|-------|
| **ID** | S17 |
| **ETA** | 4 — History, security and release |
| **Priority** | P1/P2 |
| **Complexity** | Medium |
| **Depends on** | S16, S05 |
| **Atomic tasks** | SRV-077, SRV-078, SRV-079, SRV-080 |
| **Milestone** | History queries optimized |

**Executive summary**

This deliverable consolidates 4 atomic server tasks into one sprint-sized ticket for **History reconciliation, DTOs and query optimization**.
Success means: History queries optimized.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S17 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S16** merged and deployed to dev
- Deliverable **S05** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-077 | Reconciliation sync from Horizon | Reconciliation sync from Horizon |
| SRV-078 | Response DTO memo counterparty explorer link | Response DTO memo counterparty explorer link |
| SRV-079 | DB indexes for history queries | DB indexes for history queries |
| SRV-080 | Tests list and filters transactions | Tests list and filters transactions |

**Scope — In**

- All atomic tasks SRV-077, SRV-078, SRV-079, SRV-080 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S17

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-077`
- `See server-build-plan.md atomic files for SRV-078`
- `See server-build-plan.md atomic files for SRV-079`

**Implementation guide**

1. Implement **SRV-077** — Reconciliation sync from Horizon; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-078** — Response DTO memo counterparty explorer link; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-079** — DB indexes for history queries; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-080** — Tests list and filters transactions; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Run `npm run lint` and fix any new violations.
6. Run targeted unit tests for the module(s) touched.
7. Run `npm run test:e2e` when HTTP surface changed.
8. Update Swagger decorators if routes or DTOs changed.
9. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
10. Document any new env vars in `.env.example` and README.
11. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-077** — Reconciliation sync from Horizon: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-078** — Response DTO memo counterparty explorer link: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-079** — DB indexes for history queries: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-080** — Tests list and filters transactions: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S17
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S18 — Security hardening: rate limits, validation and replay protection

| Field | Value |
|-------|-------|
| **ID** | S18 |
| **ETA** | 4 — History, security and release |
| **Priority** | P0 |
| **Complexity** | Hard |
| **Depends on** | S01, S08, S05, S13 |
| **Atomic tasks** | SRV-081, SRV-082, SRV-083, SRV-084, SRV-085, SRV-086, SRV-087, SRV-088 |
| **Milestone** | Hardened payment surface |

**Executive summary**

This deliverable consolidates 8 atomic server tasks into one sprint-sized ticket for **Security hardening: rate limits, validation and replay protection**.
Success means: Hardened payment surface.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S18 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S01** merged and deployed to dev
- Deliverable **S08** merged and deployed to dev
- Deliverable **S05** merged and deployed to dev
- Deliverable **S13** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-081 | Rate limiting ThrottlerModule per endpoint | Rate limiting ThrottlerModule per endpoint |
| SRV-082 | Validate 5 min clock skew on requests | Validate 5 min clock skew on requests |
| SRV-083 | NFC expiration policy default 30s | NFC expiration policy default 30s |
| SRV-084 | Sanitize outputs without internal leak | Sanitize outputs without internal leak |
| SRV-085 | AuditLog table and critical events | AuditLog table and critical events |
| SRV-086 | Restrictive CORS per environment | Restrictive CORS per environment |
| SRV-087 | Request ID correlation X-Request-Id | Request ID correlation X-Request-Id |
| SRV-088 | Validate wallet JWT matches signer XDR | Validate wallet JWT matches signer XDR |

**Scope — In**

- All atomic tasks SRV-081, SRV-082, SRV-083, SRV-084, SRV-085, SRV-086, SRV-087, SRV-088 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- ThrottlerModule, clock skew window, AuditLog, CORS, correlation IDs

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

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

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-081`
- `See server-build-plan.md atomic files for SRV-082`
- `See server-build-plan.md atomic files for SRV-083`

**Implementation guide**

1. Implement **SRV-081** — Rate limiting ThrottlerModule per endpoint; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-082** — Validate 5 min clock skew on requests; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-083** — NFC expiration policy default 30s; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-084** — Sanitize outputs without internal leak; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-085** — AuditLog table and critical events; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-086** — Restrictive CORS per environment; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Implement **SRV-087** — Request ID correlation X-Request-Id; cross-check Section 8 in server-build-plan.md for files and snippets.
8. Implement **SRV-088** — Validate wallet JWT matches signer XDR; cross-check Section 8 in server-build-plan.md for files and snippets.
9. Run `npm run lint` and fix any new violations.
10. Run targeted unit tests for the module(s) touched.
11. Run `npm run test:e2e` when HTTP surface changed.
12. Update Swagger decorators if routes or DTOs changed.
13. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
14. Document any new env vars in `.env.example` and README.
15. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-081** — Rate limiting ThrottlerModule per endpoint: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-082** — Validate 5 min clock skew on requests: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-083** — NFC expiration policy default 30s: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-084** — Sanitize outputs without internal leak: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-085** — AuditLog table and critical events: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-086** — Restrictive CORS per environment: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-087** — Request ID correlation X-Request-Id: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-088** — Validate wallet JWT matches signer XDR: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S18
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- AuditLog for `payment.submitted` and auth failures without sensitive payloads

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S19 — Operational security, logging and quality gates

| Field | Value |
|-------|-------|
| **ID** | S19 |
| **ETA** | 4 — History, security and release |
| **Priority** | P0/P1 |
| **Complexity** | Medium |
| **Depends on** | S05, S02, S16 |
| **Atomic tasks** | SRV-089, SRV-090, SRV-091, SRV-092, SRV-093, SRV-094, SRV-095, SRV-096, SRV-097, SRV-099 |
| **Milestone** | Observability + docs |

**Executive summary**

This deliverable consolidates 10 atomic server tasks into one sprint-sized ticket for **Operational security, logging and quality gates**.
Success means: Observability + docs.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S19 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S05** merged and deployed to dev
- Deliverable **S02** merged and deployed to dev
- Deliverable **S16** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-089 | Replay protection stellarTxHash unique | Replay protection stellarTxHash unique |
| SRV-090 | Documented security review checklist | Documented security review checklist |
| SRV-091 | Structured logging Pino or Nest Logger | Structured logging Pino or Nest Logger |
| SRV-092 | GET /health readiness and liveness | GET /health readiness and liveness |
| SRV-093 | Payment success rate metrics endpoint | Payment success rate metrics endpoint |
| SRV-094 | Swagger tags and complete examples | Swagger tags and complete examples |
| SRV-095 | docs/ARCHITECTURE.md server | docs/ARCHITECTURE.md server |
| SRV-096 | docs/API.md endpoint reference | docs/API.md endpoint reference |
| SRV-097 | 80% test coverage critical modules | 80% test coverage critical modules |
| SRV-099 | Contract tests payment-request.v1 | Contract tests payment-request.v1 |

**Scope — In**

- All atomic tasks SRV-089, SRV-090, SRV-091, SRV-092, SRV-093, SRV-094, SRV-095, SRV-096, SRV-097, SRV-099 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Production-quality code under `ding-server/src/` for S19

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/src/`
- `See server-build-plan.md atomic files for SRV-089`
- `See server-build-plan.md atomic files for SRV-090`
- `See server-build-plan.md atomic files for SRV-091`

**Implementation guide**

1. Implement **SRV-089** — Replay protection stellarTxHash unique; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-090** — Documented security review checklist; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-091** — Structured logging Pino or Nest Logger; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-092** — GET /health readiness and liveness; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-093** — Payment success rate metrics endpoint; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-094** — Swagger tags and complete examples; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Implement **SRV-095** — docs/ARCHITECTURE.md server; cross-check Section 8 in server-build-plan.md for files and snippets.
8. Implement **SRV-096** — docs/API.md endpoint reference; cross-check Section 8 in server-build-plan.md for files and snippets.
9. Implement **SRV-097** — 80% test coverage critical modules; cross-check Section 8 in server-build-plan.md for files and snippets.
10. Implement **SRV-099** — Contract tests payment-request.v1; cross-check Section 8 in server-build-plan.md for files and snippets.
11. Run `npm run lint` and fix any new violations.
12. Run targeted unit tests for the module(s) touched.
13. Run `npm run test:e2e` when HTTP surface changed.
14. Update Swagger decorators if routes or DTOs changed.
15. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.

**Acceptance criteria**

- [ ] **SRV-089** — Replay protection stellarTxHash unique: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-090** — Documented security review checklist: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-091** — Structured logging Pino or Nest Logger: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-092** — GET /health readiness and liveness: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-093** — Payment success rate metrics endpoint: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-094** — Swagger tags and complete examples: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-095** — docs/ARCHITECTURE.md server: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-096** — docs/API.md endpoint reference: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-097** — 80% test coverage critical modules: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-099** — Contract tests payment-request.v1: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S19
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---

### S20 — CI/CD, load testing, deploy and MVP release

| Field | Value |
|-------|-------|
| **ID** | S20 |
| **ETA** | 4 — History, security and release |
| **Priority** | P0/P1 |
| **Complexity** | Hard |
| **Depends on** | S19, S18, S16 |
| **Atomic tasks** | SRV-098, SRV-100, SRV-101, SRV-102, SRV-103, SRV-104, SRV-105, SRV-106 |
| **Milestone** | Staging deploy |

**Executive summary**

This deliverable consolidates 8 atomic server tasks into one sprint-sized ticket for **CI/CD, load testing, deploy and MVP release**.
Success means: Staging deploy.

**Product context**

Ding Payments is a self-custodial Stellar P2P app: the server validates NFC payment requests, enforces hybrid Supabase + WebAuthn authorization, relays signed XDR to Horizon, and indexes history.

**User stories**

- As a **developer**, I want S20 complete so I can run the next ETA without manual archaeology.
- As a **receiver**, I want my NFC payment request validated consistently with the canonical contract.
- As a **sender**, I want clear API errors when a payment request is malformed or expired.
- As an **operator**, I want migrations, health checks, and logs sufficient to debug testnet payments.

**Prerequisites**

- Deliverable **S19** merged and deployed to dev
- Deliverable **S18** merged and deployed to dev
- Deliverable **S16** merged and deployed to dev
- Node 20+, npm, Supabase project credentials, Postgres reachable via `DATABASE_URL`
- Read Sections 3–6 of server-build-plan.md before coding

**Atomic sub-task checklist**

| SRV-ID | Title | Key deliverable |
|--------|-------|-----------------|
| SRV-098 | Complete E2E suite in CI | Complete E2E suite in CI |
| SRV-100 | Basic load test validate endpoint | Basic load test validate endpoint |
| SRV-101 | Multi-stage production Dockerfile | Multi-stage production Dockerfile |
| SRV-102 | docker-compose dev local postgres | docker-compose dev local postgres |
| SRV-103 | GitHub Actions deploy staging | GitHub Actions deploy staging |
| SRV-104 | prisma migrate deploy in CI/CD | prisma migrate deploy in CI/CD |
| SRV-105 | Operational runbook Stellar down | Operational runbook Stellar down |
| SRV-106 | Server MVP release checklist | Server MVP release checklist |

**Scope — In**

- All atomic tasks SRV-098, SRV-100, SRV-101, SRV-102, SRV-103, SRV-104, SRV-105, SRV-106 as specified in [server-build-plan.md](./server-build-plan.md)
- NestJS 11 patterns: modules, providers, DTOs with class-validator, Swagger decorators where applicable
- Unit and/or E2E tests for new behavior; keep CI green (`ci-server.yml`)
- Dockerfile, staging deploy workflow, migrate deploy, release checklist

**Scope — Out**

- Client UI or Expo changes (ding-payments repo)
- Mainnet launch configuration (testnet MVP only unless explicitly toggled)
- Push notifications on payment confirmation (post-MVP P3)
- Custodial wallets or server-side key storage
- Features not listed in atomic SRV IDs for this deliverable

**Architecture & conventions**

Target architecture from [server-build-plan.md](./server-build-plan.md) Section 3: flat `src/modules/*` layout, ConfigModule validation, global exception filter, URI versioning `/v1`.

```
ding-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   ├── common/filters/
│   ├── database/
│   ├── auth/
│   ├── supabase/
│   ├── stellar/
│   ├── webauthn/
│   ├── contracts/
│   └── modules/
│       ├── users/
│       ├── payment-requests/
│       ├── payments/
│       └── transactions/
├── prisma/schema.prisma
├── docs/
└── test/
```

**Files to create/modify**

- `ding-server/Dockerfile`
- `ding-server/docker-compose.yml`
- `.github/workflows/`
- `See server-build-plan.md atomic files for SRV-098`
- `See server-build-plan.md atomic files for SRV-100`
- `See server-build-plan.md atomic files for SRV-101`

**Implementation guide**

1. Implement **SRV-098** — Complete E2E suite in CI; cross-check Section 8 in server-build-plan.md for files and snippets.
2. Implement **SRV-100** — Basic load test validate endpoint; cross-check Section 8 in server-build-plan.md for files and snippets.
3. Implement **SRV-101** — Multi-stage production Dockerfile; cross-check Section 8 in server-build-plan.md for files and snippets.
4. Implement **SRV-102** — docker-compose dev local postgres; cross-check Section 8 in server-build-plan.md for files and snippets.
5. Implement **SRV-103** — GitHub Actions deploy staging; cross-check Section 8 in server-build-plan.md for files and snippets.
6. Implement **SRV-104** — prisma migrate deploy in CI/CD; cross-check Section 8 in server-build-plan.md for files and snippets.
7. Implement **SRV-105** — Operational runbook Stellar down; cross-check Section 8 in server-build-plan.md for files and snippets.
8. Implement **SRV-106** — Server MVP release checklist; cross-check Section 8 in server-build-plan.md for files and snippets.
9. Run `npm run lint` and fix any new violations.
10. Run targeted unit tests for the module(s) touched.
11. Run `npm run test:e2e` when HTTP surface changed.
12. Update Swagger decorators if routes or DTOs changed.
13. Verify error responses use `{ statusCode, message, code?, errors? }` shape from Section 5.
14. Document any new env vars in `.env.example` and README.
15. Manual smoke test with `npm run start:dev` and curl/httpie against `/v1` routes.

**Acceptance criteria**

- [ ] **SRV-098** — Complete E2E suite in CI: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-100** — Basic load test validate endpoint: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-101** — Multi-stage production Dockerfile: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-102** — docker-compose dev local postgres: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-103** — GitHub Actions deploy staging: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-104** — prisma migrate deploy in CI/CD: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-105** — Operational runbook Stellar down: acceptance criteria in server-build-plan.md satisfied
- [ ] **SRV-106** — Server MVP release checklist: acceptance criteria in server-build-plan.md satisfied
- [ ] CI workflow passes lint, build, and test jobs
- [ ] No secrets committed; `.env` gitignored
- [ ] OpenAPI/Swagger reflects new or changed endpoints
- [ ] Prisma client regenerated if schema changed (`npm run prisma:generate`)
- [ ] Database migration applied locally without drift
- [ ] Error codes align with Appendix A where applicable
- [ ] Logs do not print JWTs, XDR secrets, or service role keys
- [ ] Code review checklist: DTO validation, auth guard, idempotency where required
- [ ] README or docs updated when setup steps change
- [ ] Definition of done checklist below is complete

**Test plan**

- **Unit:** Services, validators, and state machine pure functions for S20
- **Integration:** Prisma against local Postgres or test container for repositories
- **E2E:** Supertest against Nest app with JWT mock and Stellar SDK mocks
- **Contract:** payment-request.v1 golden vectors (S08+) — invalid BTC/ETH assets rejected
- **Manual:** curl examples from Section 5 and Appendices
- **Regression:** Re-run auth suite when touching guards (S06/S07)
- **Performance:** Smoke load on validate when approaching S20

**Client coordination**

See Client ↔ server alignment table below.

**Security notes**

- Never log `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, or raw WebAuthn challenges
- Validate all inbound DTOs; reject unknown fields where strict mode applies
- Use parameterized Prisma queries only — no raw SQL unless documented
- Follow hybrid auth model: Supabase session + WebAuthn for payment approval

**Risks & pitfalls**

- Scope creep — stay within listed SRV atomic tasks for this sprint
- Drift from client NFC contract — coordinate before changing validation rules
- Stellar testnet instability — use health checks and retries (S12/S13)
- Prisma migration conflicts — serialize DB changes with team
- WebAuthn environment mismatch between dev client and server origins
- Underestimating E2E flakiness — mock Horizon in tests where possible

**Definition of done**

- [ ] All atomic SRV tasks implemented
- [ ] Tests added/updated and passing locally
- [ ] Swagger updated for HTTP changes
- [ ] No regression in CI pipeline
- [ ] Peer review completed
- [ ] Linked client Issue updated if integration contract changed
- [ ] Merged to main with migration deploy notes if applicable

---


## Hard blockers

| Deliverable | Why |
|-------------|-----|
| **S04** | No domain features without migrations |
| **S06** | Auth guard blocks all protected endpoints |
| **S08** | NFC contract must match client before validate API |
| **S14** | Submit relay is core server responsibility |
| **S16** | E2E proof before release |

---

## Client ↔ server alignment

| Server | Client | Integration |
|--------|--------|-------------|
| S08, S09 | C10, C11 | `payment-request.v1` validation |
| S10, S14 | C13 | WebAuthn authorize + submit |
| S15, S16 | C13, C16 | `GET /v1/payments/:id` polling |
| S06, S07 | C16 | User profile and wallet register |
| S16 | C18 | Full E2E payment matrix |

---

## Payment state machine (reference)

```
CREATED → AUTHORIZED → SUBMITTED → CONFIRMED
                              ↘ FAILED
```

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

Implemented across: **S14** (create, authorize, submit), **S15** (confirm/fail/timeout).

---

## Sprint planning guide

| Sprint | Deliverable | Milestone |
|--------|-------------|-----------|
| 1 | S01 | Repo bootstrapped |
| 2 | S02–S03 | Server boots |
| 3 | S04 | Core DB migrated |
| 4 | S05 | Full schema |
| 5 | S06 | Auth module |
| 6 | S07 | Users API |
| 7 | S08 | NFC contract |
| 8 | S09 | Validate API |
| 9 | S10 | WebAuthn authorize |
| 10 | S11 | WebAuthn hardened |
| 11 | S12 | Stellar pipeline |
| 12 | S13 | Stellar API |
| 13 | S14 | Submit relay |
| 14 | S15 | Confirmation |
| 15 | S16 | **E2E payment** |
| 16 | S17 | History |
| 17 | S18 | Security |
| 18 | S19 | Observability |
| 19–20 | S20 | Staging deploy |

---

## Appendix — Environment variables (`.env.example`)

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

---

## Appendix — Prisma enums (reference)

```prisma
enum StellarNetwork { TESTNET MAINNET }
enum AssetCode { XLM USDC }
enum PaymentRequestStatus { CREATED SHARED EXPIRED CONSUMED }
enum PaymentStatus { CREATED AUTHORIZED SUBMITTED CONFIRMED FAILED }
enum TransactionDirection { SENT RECEIVED }
```

---

## Appendix — API endpoints (MVP)

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

---

## Appendix — Error codes

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

---

*Consolidated v1.2 from 106 atomic tasks. Detail: [server-build-plan.md](./server-build-plan.md)*
