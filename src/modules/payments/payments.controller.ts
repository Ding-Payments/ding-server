import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AuthenticationResponseDto } from '../../webauthn/dto';
import { PaymentsService } from './payments.service';
import { PaymentAuthorizedResponseDto } from './dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post(':id/authorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Authorize a payment with a passkey assertion',
    description:
      'Verifies the WebAuthn assertion for the payment and transitions it ' +
      'CREATED → AUTHORIZED. Requires a challenge from ' +
      '`POST /v1/webauthn/authenticate/options`.',
  })
  @ApiParam({ name: 'id', description: 'Payment UUID', format: 'uuid' })
  @ApiOkResponse({ type: PaymentAuthorizedResponseDto })
  @ApiNotFoundResponse({ description: 'PAYMENT_NOT_FOUND.' })
  @ApiConflictResponse({ description: 'PAYMENT_INVALID_STATE.' })
  @ApiBadRequestResponse({
    description: 'WEBAUTHN_VERIFICATION_FAILED or WEBAUTHN_CHALLENGE_EXPIRED.',
  })
  authorize(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AuthenticationResponseDto,
  ): Promise<PaymentAuthorizedResponseDto> {
    return this.paymentsService.authorize(
      user,
      id,
      body as unknown as AuthenticationResponseJSON,
    );
  }
}
