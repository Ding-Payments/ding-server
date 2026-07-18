import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PaymentRequestsService } from './payment-requests.service';
import { PaymentRequestsRepository } from './payment-requests.repository';
import { CreatePaymentRequestDto } from './dto/create-payment-request.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import type { PaymentRequest } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const NOW = new Date();
const FUTURE = new Date(NOW.getTime() + 30_000);
const VALID_RECIPIENT =
  'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

function makeDto(
  overrides: Partial<CreatePaymentRequestDto> = {},
): CreatePaymentRequestDto {
  return {
    type: 'payment-request',
    version: 1,
    recipient: VALID_RECIPIENT,
    asset: 'USDC',
    amount: '10.00',
    timestamp: NOW.toISOString(),
    expiresAt: FUTURE.toISOString(),
    requestId: 'req_001',
    ...overrides,
  };
}

function makePaymentRequest(
  overrides: Partial<PaymentRequest> = {},
): PaymentRequest {
  return {
    id: 'pr-uuid-1',
    externalRequestId: 'req_001',
    receiverUserId: 'user-supabase-id',
    recipient: VALID_RECIPIENT,
    asset: 'USDC',
    amount: new Decimal('10'), // Decimal.toString() → '10' (no trailing zeros)
    memo: null,
    status: 'CREATED',
    payloadTimestamp: NOW,
    expiresAt: FUTURE,
    metadata: null,
    createdAt: NOW,
    ...overrides,
  };
}

const mockUser: AuthenticatedUser = { supabaseUserId: 'user-supabase-id' };

describe('PaymentRequestsService', () => {
  let service: PaymentRequestsService;
  let repo: jest.Mocked<PaymentRequestsRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<PaymentRequestsRepository>;
    service = new PaymentRequestsService(repo);
  });

  // ── validate ──────────────────────────────────────────────────────────────

  describe('validate()', () => {
    it('returns the normalized payload for a valid request', () => {
      const payload = {
        type: 'payment-request',
        version: 1,
        recipient: VALID_RECIPIENT,
        asset: 'USDC',
        amount: '25.00',
        timestamp: NOW.toISOString(),
        expiresAt: FUTURE.toISOString(),
      };
      const result = service.validate(payload);
      expect(result.valid).toBe(true);
      expect(result.normalized).toMatchObject({ asset: 'USDC' });
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for an unsupported asset without a normalized payload', () => {
      const result = service.validate({ ...makeDto(), asset: 'BTC' });
      expect(result.valid).toBe(false);
      expect(result.normalized).toBeUndefined();
      expect(result.errors[0].code).toBe('PAYMENT_REQUEST_ASSET_UNSUPPORTED');
    });

    it('returns PAYMENT_REQUEST_PAYLOAD_INVALID for a non-object payload', () => {
      const result = service.validate('not an object');
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('PAYMENT_REQUEST_PAYLOAD_INVALID');
    });

    it('returns PAYMENT_REQUEST_RECIPIENT_INVALID for an Ethereum address', () => {
      const result = service.validate({
        ...makeDto(),
        recipient: '0xdeadbeef',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'PAYMENT_REQUEST_RECIPIENT_INVALID' }),
      );
    });
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('persists and returns the response DTO for a valid payload', async () => {
      const pr = makePaymentRequest();
      repo.create.mockResolvedValue(pr);

      const result = await service.create(makeDto(), mockUser);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ receiverUserId: 'user-supabase-id' }),
      );
      expect(result.id).toBe('pr-uuid-1');
      expect(result.status).toBe('CREATED');
      expect(result.amount).toBe('10');
    });

    it('throws UnprocessableEntityException for an expired expiresAt', async () => {
      const dto = makeDto({
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      });
      await expect(service.create(dto, mockUser)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('throws UnprocessableEntityException for an unsupported asset', async () => {
      const dto = makeDto({ asset: 'BTC' as never });
      await expect(service.create(dto, mockUser)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it('propagates ConflictException from repo (anti-replay)', async () => {
      repo.create.mockRejectedValue(
        new ConflictException({ code: 'PAYMENT_REQUEST_ID_REPLAY' }),
      );
      await expect(service.create(makeDto(), mockUser)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('returns the response DTO for an existing record', async () => {
      const pr = makePaymentRequest({ status: 'SHARED' });
      repo.findById.mockResolvedValue(pr);

      const result = await service.findById('pr-uuid-1');

      expect(repo.findById).toHaveBeenCalledWith('pr-uuid-1');
      expect(result.status).toBe('SHARED');
    });

    it('propagates NotFoundException from repo', async () => {
      repo.findById.mockRejectedValue(new NotFoundException());
      await expect(service.findById('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
