import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import request from 'supertest';
import type { Application as ExpressApplication } from 'express';
import { StellarNetwork } from '@prisma/client';
import { envValidationSchema } from '../src/config/env.validation';
import configuration from '../src/config/configuration';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SupabaseStrategy } from '../src/auth/strategies/supabase.strategy';
import { SupabaseAuthGuard } from '../src/auth/guards/supabase-auth.guard';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { PrismaService } from '../src/database/prisma.service';
import { TEST_JWT_SECRET, authHeader } from './helpers/jwt.helper';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const TEST_USER = {
  supabaseUserId: 'e2e-users-test-001',
  email: 'alice@example.com',
};

// Both keys verified valid with StellarSdk.StrKey.isValidEd25519PublicKey
const VALID_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
const SECOND_KEY = 'GBEPZXRP2AQ7LP2NKN2IFFE6F2IORE4YVVE3LBGRW4SSWWQV3HA6NJPL';

const DB_USER = {
  id: 'db-user-id-e2e',
  supabaseUserId: TEST_USER.supabaseUserId,
  email: TEST_USER.email,
  displayName: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  wallets: [],
};

const DB_WALLET = {
  id: 'wallet-e2e-001',
  userId: DB_USER.id,
  stellarPublicKey: VALID_KEY,
  network: StellarNetwork.TESTNET,
  isPrimary: true,
  label: null,
  createdAt: new Date('2026-01-02'),
};

// ---------------------------------------------------------------------------
// Prisma mock factory — reset between tests
// ---------------------------------------------------------------------------

function makePrismaMock() {
  return {
    user: { upsert: jest.fn(), findUnique: jest.fn() },
    wallet: { findFirst: jest.fn(), create: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
}

/**
 * SRV-030 — E2E Users API tests with JWT mock.
 *
 * Full HTTP pipeline with mocked PrismaService. Tokens minted with
 * TEST_JWT_SECRET for deterministic auth.
 */
describe('UsersController (e2e)', () => {
  let app: INestApplication<ExpressApplication>;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeAll(async () => {
    process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;
    prismaMock = makePrismaMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          validationSchema: envValidationSchema,
          validationOptions: { abortEarly: false, allowUnknown: false },
          load: [configuration],
        }),
        PassportModule.register({ defaultStrategy: 'supabase-jwt' }),
      ],
      controllers: [UsersController],
      providers: [
        UsersService,
        SupabaseStrategy,
        SupabaseAuthGuard,
        { provide: APP_GUARD, useClass: SupabaseAuthGuard },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.resetAllMocks());

  // ─── GET /v1/users/me ─────────────────────────────────────────────────────

  describe('GET /v1/users/me', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app.getHttpServer()).get('/v1/users/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', 'Bearer garbage-token');
      expect(res.status).toBe(401);
    });

    it('returns 200 with user profile and empty wallets', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });

      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', authHeader(TEST_USER));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: DB_USER.id,
        supabaseUserId: TEST_USER.supabaseUserId,
        email: TEST_USER.email,
        wallets: [],
      });
    });

    it('returns 200 with linked wallets in the profile', async () => {
      prismaMock.user.upsert.mockResolvedValue({
        ...DB_USER,
        wallets: [DB_WALLET],
      });

      const res = await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', authHeader(TEST_USER));

      expect(res.status).toBe(200);
      expect(res.body.wallets).toHaveLength(1);
      expect(res.body.wallets[0].stellarPublicKey).toBe(VALID_KEY);
      expect(res.body.wallets[0].network).toBe(StellarNetwork.TESTNET);
      expect(res.body.wallets[0].isPrimary).toBe(true);
    });

    it('calls upsert on every authenticated request (upsert-on-login)', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });

      await request(app.getHttpServer())
        .get('/v1/users/me')
        .set('Authorization', authHeader(TEST_USER));

      expect(prismaMock.user.upsert).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supabaseUserId: TEST_USER.supabaseUserId },
        }),
      );
    });
  });

  // ─── POST /v1/users/me/wallet ─────────────────────────────────────────────

  describe('POST /v1/users/me/wallet', () => {
    it('returns 401 without a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .send({ stellarPublicKey: VALID_KEY, network: 'TESTNET' });
      expect(res.status).toBe(401);
    });

    it('returns 400 when stellarPublicKey is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ network: 'TESTNET' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when stellarPublicKey is not a valid Stellar key', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: 'not-a-stellar-key', network: 'TESTNET' });
      expect(res.status).toBe(400);
    });

    it('returns 400 when stellarPublicKey is a Bitcoin address', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({
          stellarPublicKey: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf',
          network: 'TESTNET',
        });
      expect(res.status).toBe(400);
    });

    it('returns 400 when network is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: VALID_KEY });
      expect(res.status).toBe(400);
    });

    it('returns 400 when network value is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: VALID_KEY, network: 'INVALID' });
      expect(res.status).toBe(400);
    });

    it('returns 201 with the created wallet on a valid request', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });
      prismaMock.wallet.findFirst
        .mockResolvedValueOnce(null) // no duplicate
        .mockResolvedValueOnce(null); // first on network → isPrimary = true
      prismaMock.wallet.create.mockResolvedValue(DB_WALLET);

      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: VALID_KEY, network: 'TESTNET' });

      expect(res.status).toBe(201);
      expect(res.body.stellarPublicKey).toBe(VALID_KEY);
      expect(res.body.network).toBe(StellarNetwork.TESTNET);
      expect(res.body.isPrimary).toBe(true);
    });

    it('returns 409 with WALLET_ALREADY_LINKED code when wallet is already linked', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });
      prismaMock.wallet.findFirst.mockResolvedValueOnce(DB_WALLET); // duplicate found

      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: VALID_KEY, network: 'TESTNET' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('WALLET_ALREADY_LINKED');
    });

    it('creates a non-primary wallet when another wallet already exists on that network', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });
      prismaMock.wallet.findFirst
        .mockResolvedValueOnce(null) // SECOND_KEY not a duplicate
        .mockResolvedValueOnce(DB_WALLET); // existing wallet on TESTNET → isPrimary = false
      prismaMock.wallet.create.mockResolvedValue({
        ...DB_WALLET,
        id: 'wallet-e2e-002',
        stellarPublicKey: SECOND_KEY,
        isPrimary: false,
      });

      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({ stellarPublicKey: SECOND_KEY, network: 'TESTNET' });

      expect(res.status).toBe(201);
      expect(res.body.isPrimary).toBe(false);
    });

    it('accepts and stores an optional label', async () => {
      prismaMock.user.upsert.mockResolvedValue({ ...DB_USER });
      prismaMock.wallet.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      prismaMock.wallet.create.mockResolvedValue({
        ...DB_WALLET,
        label: 'Travel wallet',
      });

      const res = await request(app.getHttpServer())
        .post('/v1/users/me/wallet')
        .set('Authorization', authHeader(TEST_USER))
        .send({
          stellarPublicKey: VALID_KEY,
          network: 'TESTNET',
          label: 'Travel wallet',
        });

      expect(res.status).toBe(201);
      expect(res.body.label).toBe('Travel wallet');
    });
  });
});
