import { Injectable } from '@nestjs/common';
import {
  PaymentRequestV1,
  PaymentRequestValidationError,
  validatePaymentRequestV1,
} from '../../contracts/payment-request.v1';

export interface PaymentRequestValidationResponse {
  valid: boolean;
  normalized?: PaymentRequestV1;
  errors: PaymentRequestValidationError[];
}

@Injectable()
export class PaymentRequestsService {
  validate(payload: unknown): PaymentRequestValidationResponse {
    const result = validatePaymentRequestV1(payload, new Date());

    if (result.valid) {
      return { valid: true, normalized: result.value, errors: [] };
    }

    return { valid: false, errors: result.errors };
  }
}
