import { ApiProperty } from '@nestjs/swagger';

/** Response for `POST /v1/webauthn/register/verify`. */
export class RegistrationVerifiedDto {
  @ApiProperty({ example: true })
  verified!: boolean;

  @ApiProperty({ description: 'Base64URL ID of the stored credential.' })
  credentialId!: string;
}
