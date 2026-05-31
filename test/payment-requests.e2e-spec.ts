import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SupabaseService } from '../src/supabase/supabase.service';

interface ValidationResultBody {
  valid: boolean;
  normalizedPayload?: {
    asset: string;
    recipient: string;
    amount: number;
    expiresAt?: string;
  };
  errors?: {
    code: string;
    message: string;
    field?: string;
  }[];
}

describe('PaymentRequests (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(SupabaseService)
      .useValue({
        getClient: jest.fn().mockReturnValue({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /v1/payment-requests/validate', () => {
    it('should validate a correct direct payment request payload', () => {
      return request(app.getHttpServer())
        .post('/v1/payment-requests/validate')
        .send({
          asset: 'USDC',
          recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 250,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidationResultBody;
          expect(body).toEqual({
            valid: true,
            normalizedPayload: {
              asset: 'USDC',
              recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              amount: 250,
            },
          });
        });
    });

    it('should validate a correct payment request with serialized JSON string payload', () => {
      return request(app.getHttpServer())
        .post('/v1/payment-requests/validate')
        .send({
          payload: JSON.stringify({
            asset: 'BTC',
            recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
            amount: '0.05',
          }),
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidationResultBody;
          expect(body).toEqual({
            valid: true,
            normalizedPayload: {
              asset: 'BTC',
              recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              amount: 0.05,
            },
          });
        });
    });

    it('should validate a correct payment request with URI string payload', () => {
      return request(app.getHttpServer())
        .post('/v1/payment-requests/validate')
        .send({
          payload:
            'solana:0x742d35Cc6634C0532925a3b844Bc454e4438f44e?amount=12.45&asset=SOL',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidationResultBody;
          expect(body).toEqual({
            valid: true,
            normalizedPayload: {
              asset: 'SOL',
              recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
              amount: 12.45,
            },
          });
        });
    });

    it('should return invalid status and errors for missing/invalid properties', () => {
      return request(app.getHttpServer())
        .post('/v1/payment-requests/validate')
        .send({
          asset: 'INVALID_TOKEN_ABC',
          recipient: '',
          amount: -10,
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidationResultBody;
          expect(body.valid).toBe(false);
          expect(body.errors).toBeDefined();
          expect(body.errors?.length).toBeGreaterThanOrEqual(3);

          const codes = body.errors?.map((e) => e.code) || [];
          expect(codes).toContain('INVALID_ASSET');
          expect(codes).toContain('INVALID_RECIPIENT');
          expect(codes).toContain('INVALID_AMOUNT');
        });
    });

    it('should return EXPIRED_REQUEST error for an expired request', () => {
      return request(app.getHttpServer())
        .post('/v1/payment-requests/validate')
        .send({
          asset: 'USDC',
          recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          amount: 50,
          expiresAt: '2020-01-01T00:00:00.000Z',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidationResultBody;
          expect(body.valid).toBe(false);
          expect(body.errors).toBeDefined();
          expect(body.errors?.[0].code).toBe('EXPIRED_REQUEST');
        });
    });
  });
});
