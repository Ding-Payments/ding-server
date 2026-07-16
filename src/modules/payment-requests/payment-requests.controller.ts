import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { PaymentRequestsService } from './payment-requests.service';
import type { PaymentRequestValidationResponse } from './payment-requests.service';

@ApiTags('payment-requests')
@Controller('payment-requests')
export class PaymentRequestsController {
  constructor(
    private readonly paymentRequestsService: PaymentRequestsService,
  ) {}

  @Public()
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate a payment-request.v1 payload',
    description:
      'Stateless validation of an NFC payment-request.v1 payload against the canonical contract. Returns HTTP 200 for both valid and invalid payloads.',
  })
  @ApiBody({
    description: 'Canonical payment-request.v1 payload.',
    schema: { type: 'object' },
    examples: {
      valid: {
        summary: 'Valid USDC request',
        value: {
          type: 'payment-request',
          version: 1,
          recipient: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          asset: 'USDC',
          amount: '25.00',
          timestamp: '2026-06-17T12:00:00.000Z',
          expiresAt: '2026-06-17T12:00:30.000Z',
        },
      },
    },
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        normalized: { type: 'object', nullable: true },
        errors: { type: 'array', items: { type: 'object' } },
      },
      required: ['valid', 'errors'],
    },
  })
  validate(@Body() payload: unknown): PaymentRequestValidationResponse {
    return this.paymentRequestsService.validate(payload);
  }
}
