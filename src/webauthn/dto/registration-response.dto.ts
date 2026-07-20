import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Browser-produced `RegistrationResponseJSON` (SimpleWebAuthn) posted to
 * `/v1/webauthn/register/verify`. Every top-level key is declared because the
 * global ValidationPipe runs with `forbidNonWhitelisted: true`. The nested
 * `response` / `clientExtensionResults` objects are intentionally left
 * un-nested-validated so the raw attestation fields pass through untouched to
 * `verifyRegistrationResponse`.
 */
export class RegistrationResponseDto {
  @ApiProperty({ description: 'Base64URL credential ID.' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Base64URL raw credential ID.' })
  @IsString()
  rawId!: string;

  @ApiProperty({
    description: 'Authenticator attestation response payload.',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  response!: Record<string, unknown>;

  @ApiProperty({ example: 'public-key' })
  @IsString()
  type!: string;

  @ApiPropertyOptional({ example: 'platform' })
  @IsOptional()
  @IsString()
  authenticatorAttachment?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  clientExtensionResults?: Record<string, unknown>;
}
