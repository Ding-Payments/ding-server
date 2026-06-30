import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StellarNetwork } from '@prisma/client';

export class WalletResponseDto {
  @ApiProperty({ example: 'uuid-wallet-id' })
  id!: string;

  @ApiProperty({
    example: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  })
  stellarPublicKey!: string;

  @ApiProperty({ enum: StellarNetwork, example: StellarNetwork.TESTNET })
  network!: StellarNetwork;

  @ApiProperty({ example: false })
  isPrimary!: boolean;

  @ApiPropertyOptional({ example: 'My main wallet', nullable: true })
  label!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

export class UserProfileDto {
  @ApiProperty({ example: 'uuid-user-id' })
  id!: string;

  @ApiProperty({ example: 'user-supabase-uuid' })
  supabaseUserId!: string;

  @ApiProperty({ example: 'user@example.com' })
  email!: string;

  @ApiPropertyOptional({ example: 'Alice', nullable: true })
  displayName!: string | null;

  @ApiProperty({ type: [WalletResponseDto] })
  wallets!: WalletResponseDto[];

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}
