import { PaymentRequestsService } from './payment-requests.service';
import { PaymentRequestV1 } from '../../contracts/payment-request.v1';

function validPayload(
  overrides: Partial<PaymentRequestV1> = {},
): Record<string, unknown> {
  const now = Date.now();
  return {
    type: 'payment-request',
    version: 1,
    recipient: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    asset: 'USDC',
    amount: '25.00',
    timestamp: new Date(now).toISOString(),
    expiresAt: new Date(now + 30_000).toISOString(),
    ...overrides,
  };
}

describe('PaymentRequestsService', () => {
  let service: PaymentRequestsService;

  beforeEach(() => {
    service = new PaymentRequestsService();
  });

  it('returns the normalized payload for a valid request', () => {
    const payload = validPayload();

    const result = service.validate(payload);

    expect(result).toEqual({
      valid: true,
      normalized: payload,
      errors: [],
    });
  });

  it('returns errors without a normalized payload for an invalid request', () => {
    const result = service.validate(validPayload({ asset: 'BTC' as never }));

    expect(result.valid).toBe(false);
    expect(result.normalized).toBeUndefined();
    expect(result.errors).toEqual([
      {
        code: 'PAYMENT_REQUEST_ASSET_UNSUPPORTED',
        message: 'asset must be one of: XLM, USDC.',
        field: 'asset',
      },
    ]);
  });

  it('rejects a non-object payload', () => {
    const result = service.validate('not-an-object');

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('PAYMENT_REQUEST_PAYLOAD_INVALID');
  });
});
