import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { StellarNetwork } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import type { LinkWalletDto } from './dto/link-wallet.dto';
import type { UserProfileDto, WalletResponseDto } from './dto/user-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SRV-025 — Upsert user on first login.
   * Called from the guard or controller after JWT validation.
   * Creates a new user record if one doesn't exist, or returns the existing one.
   * Idempotent — safe to call on every authenticated request.
   */
  async syncUser(authenticatedUser: AuthenticatedUser) {
    const { supabaseUserId, email } = authenticatedUser;

    const user = await this.prisma.user.upsert({
      where: { supabaseUserId },
      create: {
        supabaseUserId,
        email,
      },
      update: {
        // Keep email in sync if it changes in Supabase
        email,
      },
      include: { wallets: { orderBy: { createdAt: 'asc' } } },
    });

    return user;
  }

  /**
   * SRV-026 — GET /v1/users/me
   * Returns the authenticated user's profile including all linked wallets.
   * Syncs the user record on every call (upsert-on-login pattern).
   */
  async getProfile(
    authenticatedUser: AuthenticatedUser,
  ): Promise<UserProfileDto> {
    const user = await this.syncUser(authenticatedUser);
    return this.toProfileDto(user);
  }

  /**
   * SRV-027 + SRV-028 — POST /v1/users/me/wallet
   * Links a Stellar public key to the authenticated user.
   * The first wallet for a network is automatically set as primary.
   * Throws 409 if the same key+network combination already exists.
   */
  async linkWallet(
    authenticatedUser: AuthenticatedUser,
    dto: LinkWalletDto,
  ): Promise<WalletResponseDto> {
    const user = await this.syncUser(authenticatedUser);

    // Check if this pubkey+network already exists for this user
    const existing = await this.prisma.wallet.findFirst({
      where: {
        userId: user.id,
        stellarPublicKey: dto.stellarPublicKey,
        network: dto.network,
      },
    });

    if (existing) {
      throw new ConflictException({
        message: 'Wallet already linked',
        error: 'WALLET_ALREADY_LINKED',
      });
    }

    // Determine if this should be primary (first wallet on this network)
    const existingWalletOnNetwork = await this.prisma.wallet.findFirst({
      where: { userId: user.id, network: dto.network },
    });
    const isPrimary = !existingWalletOnNetwork;

    const wallet = await this.prisma.wallet.create({
      data: {
        userId: user.id,
        stellarPublicKey: dto.stellarPublicKey,
        network: dto.network,
        isPrimary,
        label: dto.label ?? null,
      },
    });

    this.logger.log(
      `Wallet linked: userId=${user.id} pubkey=${dto.stellarPublicKey} network=${dto.network}`,
    );

    return this.toWalletDto(wallet);
  }

  /**
   * Find a user by their Supabase user ID.
   * Throws NotFoundException if the user does not exist in our DB.
   */
  async findBySupabaseId(supabaseUserId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { supabaseUserId },
      include: { wallets: { orderBy: { createdAt: 'asc' } } },
    });

    if (!user) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    return this.toProfileDto(user);
  }

  // ---------------------------------------------------------------------------
  // Private mapping helpers
  // ---------------------------------------------------------------------------

  private toProfileDto(user: {
    id: string;
    supabaseUserId: string;
    email: string;
    displayName: string | null;
    createdAt: Date;
    updatedAt: Date;
    wallets: {
      id: string;
      stellarPublicKey: string;
      network: StellarNetwork;
      isPrimary: boolean;
      label: string | null;
      createdAt: Date;
    }[];
  }): UserProfileDto {
    return {
      id: user.id,
      supabaseUserId: user.supabaseUserId,
      email: user.email,
      displayName: user.displayName,
      wallets: user.wallets.map((w) => this.toWalletDto(w)),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toWalletDto(wallet: {
    id: string;
    stellarPublicKey: string;
    network: StellarNetwork;
    isPrimary: boolean;
    label: string | null;
    createdAt: Date;
  }): WalletResponseDto {
    return {
      id: wallet.id,
      stellarPublicKey: wallet.stellarPublicKey,
      network: wallet.network,
      isPrimary: wallet.isPrimary,
      label: wallet.label,
      createdAt: wallet.createdAt,
    };
  }
}
