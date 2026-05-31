import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  PaymentRequestsService,
  ValidationResult,
} from './payment-requests.service';
import { ValidatePaymentRequestDto } from './dto/validate-payment-request.dto';

@Controller('v1/payment-requests')
export class PaymentRequestsController {
  constructor(
    private readonly paymentRequestsService: PaymentRequestsService,
  ) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validate(@Body() dto: ValidatePaymentRequestDto): ValidationResult {
    return this.paymentRequestsService.validate(dto);
  }
}
