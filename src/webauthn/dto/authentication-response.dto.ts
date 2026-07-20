import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * Browser-produced `AuthenticationResponseJSON` (SimpleWebAuthn). Used as the
 * body of `POST /v1/payments/:id/authorize`. Same whitelist reasoning as
 * RegistrationResponseDto — every top-level key must be declared.
 */
export class AuthenticationResponseDto {
  @ApiProperty({ description: 'Base64URL credential ID.' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Base64URL raw credential ID.' })
  @IsString()
  rawId!: string;

  @ApiProperty({
    description: 'Authenticator assertion response payload.',
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
