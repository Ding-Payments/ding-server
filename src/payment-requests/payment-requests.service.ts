import { Injectable } from '@nestjs/common';
import { ValidatePaymentRequestDto } from './dto/validate-payment-request.dto';

export class ValidationError {
  code: string;
  message: string;
  field?: string;
}

export class ValidationResult {
  valid: boolean;
  normalizedPayload?: {
    asset: string;
    recipient: string;
    amount: number;
    expiresAt?: string;
  };
  errors?: ValidationError[];
}

@Injectable()
export class PaymentRequestsService {
  private readonly supportedAssets = new Set([
    'USDC',
    'USDT',
    'ETH',
    'BTC',
    'SOL',
    'USD',
    'EUR',
  ]);

  validate(dto: ValidatePaymentRequestDto): ValidationResult {
    let asset: unknown = dto.asset;
    let recipient: unknown = dto.recipient;
    let amount: unknown = dto.amount;
    let expiresAt: unknown = dto.expiresAt;

    // Handle payload if present
    if (dto.payload) {
      let payloadObj: unknown = dto.payload;

      // If payload is a string, try to parse it
      if (typeof payloadObj === 'string') {
        const payloadStr: string = payloadObj;
        try {
          // 1. Try JSON parsing
          const parsed: unknown = JSON.parse(payloadStr);
          if (parsed && typeof parsed === 'object') {
            payloadObj = parsed;
          }
        } catch {
          // 2. Try URI-like parsing (e.g. ethereum:0x... or solana:...)
          const match = payloadStr.match(
            /^([a-zA-Z0-9+-.]+):([^?]+)(\?(.*))?$/,
          );
          if (match) {
            const address = match[2];
            const queryString = match[4] || '';
            const params = new URLSearchParams(queryString);

            payloadObj = {
              recipient: address,
              asset: params.get('asset') || params.get('currency') || undefined,
              amount: params.get('amount') || params.get('value') || undefined,
              expiresAt:
                params.get('expiry') ||
                params.get('expiresAt') ||
                params.get('expires') ||
                undefined,
            };
          } else {
            // 3. Try query parameters directly
            const params = new URLSearchParams(payloadStr);
            if (
              params.has('asset') ||
              params.has('recipient') ||
              params.has('amount')
            ) {
              payloadObj = {
                asset: params.get('asset') || undefined,
                recipient: params.get('recipient') || undefined,
                amount: params.get('amount') || undefined,
                expiresAt:
                  params.get('expiresAt') || params.get('expiry') || undefined,
              };
            }
          }
        }
      }

      // Merge extracted payload properties if found
      if (payloadObj && typeof payloadObj === 'object') {
        const record = payloadObj as Record<string, unknown>;
        if (record.asset !== undefined) asset = record.asset;
        if (record.recipient !== undefined) recipient = record.recipient;
        if (record.amount !== undefined) amount = record.amount;
        if (record.expiresAt !== undefined) expiresAt = record.expiresAt;
      }
    }

    const errors: ValidationError[] = [];
    let finalAsset = '';
    let finalRecipient = '';

    // 1. Validate Asset
    if (typeof asset !== 'string' || asset.trim() === '') {
      errors.push({
        code: 'INVALID_ASSET',
        message: 'Asset is required and must be a non-empty string.',
        field: 'asset',
      });
    } else {
      const normalizedAsset = asset.trim().toUpperCase();
      if (!this.supportedAssets.has(normalizedAsset)) {
        errors.push({
          code: 'INVALID_ASSET',
          message: `Asset '${asset}' is not supported. Supported assets are: ${Array.from(this.supportedAssets).join(', ')}.`,
          field: 'asset',
        });
      } else {
        finalAsset = normalizedAsset; // Save normalized
      }
    }

    // 2. Validate Recipient
    if (typeof recipient !== 'string' || recipient.trim() === '') {
      errors.push({
        code: 'INVALID_RECIPIENT',
        message: 'Recipient is required and must be a non-empty string.',
        field: 'recipient',
      });
    } else {
      const trimmedRecipient = recipient.trim();
      // Ethereum-specific validation
      if (trimmedRecipient.startsWith('0x')) {
        const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
        if (!ethAddressRegex.test(trimmedRecipient)) {
          errors.push({
            code: 'INVALID_RECIPIENT',
            message:
              'Recipient address starts with 0x but is not a valid Ethereum address.',
            field: 'recipient',
          });
        } else {
          finalRecipient = trimmedRecipient;
        }
      } else if (trimmedRecipient.length < 3) {
        errors.push({
          code: 'INVALID_RECIPIENT',
          message: 'Recipient must be at least 3 characters long.',
          field: 'recipient',
        });
      } else {
        finalRecipient = trimmedRecipient;
      }
    }

    // 3. Validate Amount
    let parsedAmount = NaN;
    if (typeof amount === 'number') {
      parsedAmount = amount;
    } else if (typeof amount === 'string') {
      parsedAmount = parseFloat(amount.trim());
    }

    if (isNaN(parsedAmount)) {
      errors.push({
        code: 'INVALID_AMOUNT',
        message: 'Amount is required and must be a valid number.',
        field: 'amount',
      });
    } else if (parsedAmount <= 0) {
      errors.push({
        code: 'INVALID_AMOUNT',
        message: 'Amount must be greater than zero.',
        field: 'amount',
      });
    }

    // 4. Validate Expiry / ExpiresAt
    let parsedExpiryDate: Date | null = null;
    if (expiresAt !== undefined && expiresAt !== null) {
      if (typeof expiresAt === 'number') {
        // If it looks like a Unix timestamp in seconds (under 10 billion)
        if (expiresAt < 10000000000) {
          parsedExpiryDate = new Date(expiresAt * 1000);
        } else {
          parsedExpiryDate = new Date(expiresAt);
        }
      } else if (typeof expiresAt === 'string') {
        const trimmed = expiresAt.trim();
        if (/^\d+$/.test(trimmed)) {
          const num = parseInt(trimmed, 10);
          if (num < 10000000000) {
            parsedExpiryDate = new Date(num * 1000);
          } else {
            parsedExpiryDate = new Date(num);
          }
        } else {
          parsedExpiryDate = new Date(trimmed);
        }
      }

      if (!parsedExpiryDate || isNaN(parsedExpiryDate.getTime())) {
        errors.push({
          code: 'EXPIRED_REQUEST',
          message: 'Expiry date is invalid.',
          field: 'expiresAt',
        });
      } else if (parsedExpiryDate.getTime() <= Date.now()) {
        errors.push({
          code: 'EXPIRED_REQUEST',
          message: 'The payment request has expired.',
          field: 'expiresAt',
        });
      }
    }

    if (errors.length > 0) {
      return {
        valid: false,
        errors,
      };
    }

    return {
      valid: true,
      normalizedPayload: {
        asset: finalAsset,
        recipient: finalRecipient,
        amount: parsedAmount,
        ...(parsedExpiryDate
          ? { expiresAt: parsedExpiryDate.toISOString() }
          : {}),
      },
    };
  }
}
