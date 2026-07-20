-- CreateEnum
CREATE TYPE "StellarNetwork" AS ENUM ('TESTNET', 'MAINNET');

-- CreateEnum
CREATE TYPE "AssetCode" AS ENUM ('XLM', 'USDC');

-- CreateEnum
CREATE TYPE "PaymentRequestStatus" AS ENUM ('CREATED', 'SHARED', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'SUBMITTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('SENT', 'RECEIVED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stellarPublicKey" TEXT NOT NULL,
    "network" "StellarNetwork" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_requests" (
    "id" TEXT NOT NULL,
    "externalRequestId" TEXT,
    "receiverUserId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "asset" "AssetCode" NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "memo" VARCHAR(280),
    "status" "PaymentRequestStatus" NOT NULL DEFAULT 'CREATED',
    "payloadTimestamp" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentRequestId" TEXT,
    "senderUserId" TEXT NOT NULL,
    "receiverUserId" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "senderPublicKey" TEXT NOT NULL,
    "asset" "AssetCode" NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "stellarTxHash" TEXT,
    "failureReason" TEXT,
    "failureCode" TEXT,
    "authorizedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT,
    "stellarTxHash" TEXT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "counterparty" TEXT NOT NULL,
    "asset" "AssetCode" NOT NULL,
    "amount" DECIMAL(20,7) NOT NULL,
    "memo" VARCHAR(280),
    "ledger" INTEGER,
    "network" "StellarNetwork" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_credentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "webauthn_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webauthn_challenges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "paymentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webauthn_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "used_request_ids" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "paymentRequestId" TEXT NOT NULL,
    "consumedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "used_request_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseUserId_key" ON "users"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "wallets_userId_isPrimary_idx" ON "wallets"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_stellarPublicKey_network_key" ON "wallets"("stellarPublicKey", "network");

-- CreateIndex
CREATE UNIQUE INDEX "payment_requests_externalRequestId_key" ON "payment_requests"("externalRequestId");

-- CreateIndex
CREATE INDEX "payment_requests_receiverUserId_status_idx" ON "payment_requests"("receiverUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentRequestId_key" ON "payments"("paymentRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_stellarTxHash_key" ON "payments"("stellarTxHash");

-- CreateIndex
CREATE INDEX "payments_senderUserId_status_idx" ON "payments"("senderUserId", "status");

-- CreateIndex
CREATE INDEX "payments_receiverUserId_status_idx" ON "payments"("receiverUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_paymentId_key" ON "transactions"("paymentId");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "webauthn_credentials_credentialId_key" ON "webauthn_credentials"("credentialId");

-- CreateIndex
CREATE INDEX "webauthn_credentials_userId_idx" ON "webauthn_credentials"("userId");

-- CreateIndex
CREATE INDEX "webauthn_challenges_userId_type_expiresAt_idx" ON "webauthn_challenges"("userId", "type", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "used_request_ids_requestId_key" ON "used_request_ids"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "used_request_ids_paymentRequestId_key" ON "used_request_ids"("paymentRequestId");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_credentials" ADD CONSTRAINT "webauthn_credentials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webauthn_challenges" ADD CONSTRAINT "webauthn_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "used_request_ids" ADD CONSTRAINT "used_request_ids_paymentRequestId_fkey" FOREIGN KEY ("paymentRequestId") REFERENCES "payment_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
