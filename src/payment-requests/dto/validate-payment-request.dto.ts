export class ValidatePaymentRequestDto {
  asset?: string;
  recipient?: string;
  amount?: number | string;
  expiresAt?: string | number;
  payload?: any;
}
