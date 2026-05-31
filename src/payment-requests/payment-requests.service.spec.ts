import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestsService } from './payment-requests.service';

describe('PaymentRequestsService', () => {
  let service: PaymentRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentRequestsService],
    }).compile();

    service = module.get<PaymentRequestsService>(PaymentRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should validate a correct direct payload', () => {
      const result = service.validate({
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 100.5,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(result.normalizedPayload).toBeDefined();
      expect(result.normalizedPayload?.asset).toBe('USDC');
      expect(result.normalizedPayload?.recipient).toBe(
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      );
      expect(result.normalizedPayload?.amount).toBe(100.5);
    });

    it('should normalize asset to uppercase', () => {
      const result = service.validate({
        asset: 'usdt',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: '50',
      });

      expect(result.valid).toBe(true);
      expect(result.normalizedPayload?.asset).toBe('USDT');
      expect(result.normalizedPayload?.amount).toBe(50);
    });

    it('should parse valid serialized JSON in payload', () => {
      const result = service.validate({
        payload: JSON.stringify({
          asset: 'ETH',
          recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 1.5,
        }),
      });

      expect(result.valid).toBe(true);
      expect(result.normalizedPayload?.asset).toBe('ETH');
      expect(result.normalizedPayload?.amount).toBe(1.5);
    });

    it('should parse valid URI in payload', () => {
      const result = service.validate({
        payload:
          'ethereum:0x742d35Cc6634C0532925a3b844Bc454e4438f44e?amount=10.5&asset=USDC',
      });

      expect(result.valid).toBe(true);
      expect(result.normalizedPayload?.recipient).toBe(
        '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      );
      expect(result.normalizedPayload?.asset).toBe('USDC');
      expect(result.normalizedPayload?.amount).toBe(10.5);
    });

    it('should reject invalid or unsupported assets', () => {
      const result = service.validate({
        asset: 'DOGE',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('INVALID_ASSET');
    });

    it('should reject invalid recipient ethereum addresses', () => {
      const result = service.validate({
        asset: 'USDC',
        recipient: '0xInvalidEthAddressThatIsTooShort',
        amount: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].code).toBe('INVALID_RECIPIENT');
    });

    it('should reject empty recipient addresses', () => {
      const result = service.validate({
        asset: 'USDC',
        recipient: '   ',
        amount: 10,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].code).toBe('INVALID_RECIPIENT');
    });

    it('should reject invalid amounts', () => {
      const result1 = service.validate({
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: -5,
      });

      const result2 = service.validate({
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 'not-a-number',
      });

      expect(result1.valid).toBe(false);
      expect(result1.errors?.[0].code).toBe('INVALID_AMOUNT');

      expect(result2.valid).toBe(false);
      expect(result2.errors?.[0].code).toBe('INVALID_AMOUNT');
    });

    it('should reject expired requests with past expiry date', () => {
      const result = service.validate({
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 10,
        expiresAt: '2020-01-01T00:00:00.000Z',
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.[0].code).toBe('EXPIRED_REQUEST');
    });

    it('should accept non-expired requests with future expiry date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const result = service.validate({
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 10,
        expiresAt: futureDate.toISOString(),
      });

      expect(result.valid).toBe(true);
      expect(result.normalizedPayload?.expiresAt).toBe(
        futureDate.toISOString(),
      );
    });
  });
});
