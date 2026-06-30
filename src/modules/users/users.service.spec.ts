import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StellarNetwork } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { UsersService } from './users.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

const AUTH_USER: AuthenticatedUser = {
  supabaseUserId: 'supa-uuid-001',
  email: 'alice@example.com',
};

const DB_USER = {
  id: 'user-db-id-001',
  supabaseUserId: AUTH_USER.supabaseUserId,
  email: AUTH_USER.email,
  displayName: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  wallets: [],
};

const DB_WALLET = {
  id: 'wallet-id-001',
  userId: DB_USER.id,
  stellarPublicKey: VALID_KEY,
  network: StellarNetwork.TESTNET,
  isPrimary: true,
  label: null,
  createdAt: new Date('2026-01-02'),
};

// ---------------------------------------------------------------------------
// Prisma mock
// ---------------------------------------------------------------------------

function makePrismaMock() {
  return {
    user: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    wallet: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prisma = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.resetAllMocks());

  // ─── syncUser ──────────────────────────────────────────────────────────────

  describe('syncUser()', () => {
    it('calls prisma.user.upsert with supabaseUserId and email', async () => {
      prisma.user.upsert.mockResolvedValue({ ...DB_USER });

      await service.syncUser(AUTH_USER);

      expect(prisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { supabaseUserId: AUTH_USER.supabaseUserId },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: expect.objectContaining({ email: AUTH_USER.email }),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          update: expect.objectContaining({ email: AUTH_USER.email }),
        }),
      );
    });
  });

  // ─── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile()', () => {
    it('returns a UserProfileDto with empty wallets', async () => {
      prisma.user.upsert.mockResolvedValue({ ...DB_USER });

      const profile = await service.getProfile(AUTH_USER);

      expect(profile.id).toBe(DB_USER.id);
      expect(profile.email).toBe(AUTH_USER.email);
      expect(profile.wallets).toEqual([]);
    });

    it('includes wallets in the profile', async () => {
      prisma.user.upsert.mockResolvedValue({
        ...DB_USER,
        wallets: [DB_WALLET],
      });

      const profile = await service.getProfile(AUTH_USER);

      expect(profile.wallets).toHaveLength(1);
      expect(profile.wallets[0].stellarPublicKey).toBe(VALID_KEY);
      expect(profile.wallets[0].network).toBe(StellarNetwork.TESTNET);
      expect(profile.wallets[0].isPrimary).toBe(true);
    });
  });

  // ─── linkWallet ────────────────────────────────────────────────────────────

  describe('linkWallet()', () => {
    const dto = {
      stellarPublicKey: VALID_KEY,
      network: StellarNetwork.TESTNET,
      label: undefined,
    };

    it('creates and returns a wallet when not already linked', async () => {
      prisma.user.upsert.mockResolvedValue({ ...DB_USER });
      prisma.wallet.findFirst
        // First call: check duplicate (same pubkey + network for this user)
        .mockResolvedValueOnce(null)
        // Second call: check if first wallet on network (for isPrimary)
        .mockResolvedValueOnce(null);
      prisma.wallet.create.mockResolvedValue(DB_WALLET);

      const result = await service.linkWallet(AUTH_USER, dto);

      expect(prisma.wallet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stellarPublicKey: VALID_KEY,
            network: StellarNetwork.TESTNET,
            isPrimary: true,
          }),
        }),
      );
      expect(result.stellarPublicKey).toBe(VALID_KEY);
      expect(result.isPrimary).toBe(true);
    });

    it('sets isPrimary=false when another wallet already exists on same network', async () => {
      prisma.user.upsert.mockResolvedValue({ ...DB_USER });
      prisma.wallet.findFirst
        .mockResolvedValueOnce(null) // no duplicate
        .mockResolvedValueOnce(DB_WALLET); // existing wallet on TESTNET
      prisma.wallet.create.mockResolvedValue({
        ...DB_WALLET,
        id: 'wallet-id-002',
        isPrimary: false,
        stellarPublicKey:
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGX4VXDGPWSPQBLZKHP6YC',
      });

      const secondDto = {
        stellarPublicKey:
          'GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGX4VXDGPWSPQBLZKHP6YC',
        network: StellarNetwork.TESTNET,
        label: undefined,
      };

      const result = await service.linkWallet(AUTH_USER, secondDto);
      expect(result.isPrimary).toBe(false);
    });

    it('throws ConflictException when wallet is already linked', async () => {
      prisma.user.upsert.mockResolvedValue({ ...DB_USER });
      // findFirst returns the existing wallet → duplicate detected
      prisma.wallet.findFirst.mockResolvedValueOnce(DB_WALLET);

      await expect(service.linkWallet(AUTH_USER, dto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });
  });

  // ─── findBySupabaseId ──────────────────────────────────────────────────────

  describe('findBySupabaseId()', () => {
    it('returns the user profile when found', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...DB_USER });

      const profile = await service.findBySupabaseId(AUTH_USER.supabaseUserId);

      expect(profile.supabaseUserId).toBe(AUTH_USER.supabaseUserId);
    });

    it('throws NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findBySupabaseId('nonexistent-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
