# Prisma Transaction Patterns

## When to use transactions

Use a Prisma transaction whenever two or more writes must succeed or fail together.
Critical cases in Ding Payments:

| Operation                        | Tables involved                                      |
| -------------------------------- | ---------------------------------------------------- |
| Create payment + consume request | `payments` + `payment_requests` + `used_request_ids` |
| Confirm payment + index history  | `payments` + `transactions`                          |
| Anti-replay on NFC tap           | `used_request_ids` + `payment_requests`              |

## Pattern 1 — Interactive transaction (preferred)

Use when you need to read between writes or apply conditional logic.

```typescript
const payment = await this.prisma.$transaction(async (tx) => {
  const request = await tx.paymentRequest.findUniqueOrThrow({
    where: { id: paymentRequestId },
  });

  if (request.status !== 'CREATED') {
    throw new ConflictException({ code: 'PAYMENT_REQUEST_ALREADY_CONSUMED' });
  }

  const [newPayment] = await Promise.all([
    tx.payment.create({ data: { ...paymentData } }),
    tx.paymentRequest.update({
      where: { id: paymentRequestId },
      data: { status: 'CONSUMED' },
    }),
    tx.usedRequestId.create({
      data: {
        requestId: request.externalRequestId!,
        paymentRequestId: request.id,
      },
    }),
  ]);

  return newPayment;
});
```

## Pattern 2 — Sequential writes transaction

Use for simple multi-table writes without intermediate reads.

```typescript
const [updatedPayment, transaction] = await this.prisma.$transaction([
  this.prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'CONFIRMED', confirmedAt: new Date(), stellarTxHash },
  }),
  this.prisma.transaction.create({
    data: { userId, paymentId, stellarTxHash, direction: 'SENT', ...rest },
  }),
]);
```

## Critical rule — no network calls inside transactions

Prisma interactive transactions default to a 5 second timeout. Never include
Stellar or external HTTP calls inside a transaction.

```typescript
// Wrong — network call inside transaction can timeout
const payment = await this.prisma.$transaction(async (tx) => {
  const txHash = await this.stellarService.submit(xdr); // network call
  await tx.payment.update({ ... });
});

// Correct — resolve network call first, then commit to DB
const txHash = await this.stellarService.submit(xdr);
await this.prisma.$transaction([
  this.prisma.payment.update({ where: { id }, data: { stellarTxHash: txHash, status: 'SUBMITTED' } }),
]);
```

## Anti-patterns to avoid

```typescript
// Two separate writes — not atomic
await this.prisma.payment.update({ where: { id }, data: { status: 'CONFIRMED' } });
await this.prisma.transaction.create({ data: { ... } }); // can fail independently

// Raw SQL without parameterization — never do this
await this.prisma.$queryRawUnsafe(`UPDATE payments SET status = '${status}'`);

// Parameterized raw query — only when Prisma ORM can't express it
await this.prisma.$queryRaw`UPDATE payments SET status = ${status} WHERE id = ${id}`;
```
