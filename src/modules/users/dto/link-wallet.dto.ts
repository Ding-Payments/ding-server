import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { StellarNetwork } from '@prisma/client';
import { IsStellarPublicKey } from '../validators/is-stellar-public-key.validator';

export class LinkWalletDto {
  @ApiProperty({
    description: 'Stellar Ed25519 public key (G... format, 56 characters)',
    example: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
  })
  @IsStellarPublicKey()
  stellarPublicKey!: string;

  @ApiProperty({
    description: 'Stellar network',
    enum: StellarNetwork,
    default: StellarNetwork.TESTNET,
  })
  @IsEnum(StellarNetwork)
  network!: StellarNetwork;

  @ApiPropertyOptional({
    description: 'Optional human-readable label for the wallet',
    example: 'My main wallet',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}
