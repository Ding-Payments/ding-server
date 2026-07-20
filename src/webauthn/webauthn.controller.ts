import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/server';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { WebAuthnService } from './webauthn.service';
import {
  AuthenticateOptionsDto,
  RegistrationResponseDto,
  RegistrationVerifiedDto,
} from './dto';

@ApiTags('webauthn')
@ApiBearerAuth()
@Controller('webauthn')
export class WebAuthnController {
  constructor(private readonly webAuthnService: WebAuthnService) {}

  @Post('register/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get passkey registration options',
    description:
      'Generates WebAuthn registration (attestation) options for the ' +
      'authenticated user and stores the challenge server-side.',
  })
  @ApiOkResponse({ description: 'PublicKeyCredentialCreationOptionsJSON.' })
  registerOptions(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.webAuthnService.generateRegistrationOptions(user);
  }

  @Post('register/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify passkey registration',
    description:
      'Verifies the attestation response against the stored challenge and ' +
      'persists the credential on success.',
  })
  @ApiOkResponse({ type: RegistrationVerifiedDto })
  @ApiBadRequestResponse({
    description: 'WEBAUTHN_VERIFICATION_FAILED or WEBAUTHN_CHALLENGE_EXPIRED.',
  })
  registerVerify(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RegistrationResponseDto,
  ): Promise<RegistrationVerifiedDto> {
    return this.webAuthnService.verifyRegistration(
      user,
      body as unknown as RegistrationResponseJSON,
    );
  }

  @Post('authenticate/options')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get passkey authentication options for a payment',
    description:
      'Generates WebAuthn authentication (assertion) options bound to a ' +
      'payment and stores the challenge server-side.',
  })
  @ApiOkResponse({ description: 'PublicKeyCredentialRequestOptionsJSON.' })
  @ApiBadRequestResponse({ description: 'WEBAUTHN_NO_CREDENTIALS.' })
  authenticateOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AuthenticateOptionsDto,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.webAuthnService.generateAuthenticationOptions(
      user,
      dto.paymentId,
    );
  }
}
