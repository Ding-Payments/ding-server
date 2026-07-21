import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A single registered passkey, as returned by `GET /v1/webauthn/credentials`.
 * Deliberately excludes `credentialId` and `publicKey` — the internal `id` is
 * enough for the client to reference the device (e.g. for revocation), and
 * neither the raw credential ID nor the public key have any legitimate use in
 * a device-management UI.
 */

export class WebAuthnCredentialDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Internal credential record ID - use this to revoke',
  })
  id!: string;

  @ApiPropertyOptional({ example: 'iPhone 15', nullable: true })
  deviceName!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  lastUsedAt!: string | null;
}
