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
import { envValidationSchema } from '../src/config/env.validation';
import configuration from '../src/config/configuration';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { SupabaseStrategy } from '../src/auth/strategies/supabase.strategy';
import { SupabaseAuthGuard } from '../src/auth/guards/supabase-auth.guard';
import { UsersController } from '../src/modules/users/users.controller';
import { UsersService } from '../src/modules/users/users.service';
import { PrismaService } from '../src/database/prisma.service';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { TEST_JWT_SECRET, authHeader, mintJwt } from './helpers/jwt.helper';

/**
 * SRV-030 — E2E auth guard tests with JWT mock.
 *
 * Tests the full HTTP pipeline using a minimal module that includes real
 * registered routes (GET / as @Public, GET /v1/users/me as protected).
 * PrismaService is mocked — no real DB needed.
 */
describe('Auth guard (e2e)', () => {
  let app: INestApplication<ExpressApplication>;

  const TEST_USER = {
    supabaseUserId: 'e2e-auth-test-001',
    email: 'auth-test@example.com',
  };

  const prismaMock = {
    user: {
      upsert: jest.fn().mockResolvedValue({
        id: 'db-user-auth-e2e',
        supabaseUserId: TEST_USER.supabaseUserId,
        email: TEST_USER.email,
        displayName: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        wallets: [],
      }),
      findUnique: jest.fn(),
    },
    wallet: { findFirst: jest.fn(), create: jest.fn() },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    process.env.SUPABASE_JWT_SECRET = TEST_JWT_SECRET;

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
      controllers: [AppController, UsersController],
      providers: [
        AppService,
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

  // ─── @Public() routes bypass the guard ────────────────────────────────────

  it('GET / (@Public) returns 200 without any token', async () => {
    const res = await request(app.getHttpServer()).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello World!');
  });

  it('GET / (@Public) returns 200 even with a malformed token', async () => {
    const res = await request(app.getHttpServer())
      .get('/')
      .set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(200);
  });

  // ─── Protected routes reject missing / invalid tokens ─────────────────────

  it('GET /v1/users/me returns 401 with no Authorization header', async () => {
    const res = await request(app.getHttpServer()).get('/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401 });
  });

  it('GET /v1/users/me returns 401 with a malformed token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', 'Bearer not.a.valid.jwt');
    expect(res.status).toBe(401);
  });

  it('GET /v1/users/me returns 401 with an expired token', async () => {
    const expiredToken = mintJwt(TEST_USER, '-1s');
    const res = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('GET /v1/users/me returns 401 with a token signed by the wrong secret', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const jwt = require('jsonwebtoken') as typeof import('jsonwebtoken');
    const badToken = jwt.sign(
      { sub: TEST_USER.supabaseUserId, email: TEST_USER.email },
      'wrong-secret',
      { expiresIn: '1h' },
    );
    const res = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  // ─── Valid token passes the guard ─────────────────────────────────────────

  it('GET /v1/users/me returns 200 with a valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/users/me')
      .set('Authorization', authHeader(TEST_USER));
    expect(res.status).toBe(200);
    expect(res.body.supabaseUserId).toBe(TEST_USER.supabaseUserId);
  });

  it('returns 404 (not 401) on unknown route with a valid token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/nonexistent-route')
      .set('Authorization', authHeader(TEST_USER));
    expect(res.status).toBe(404);
  });
});
