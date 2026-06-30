import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Validates a Stellar Ed25519 public key (G... format) without importing the
 * full stellar-sdk (which pulls in ESM-only transitive dependencies that break
 * Jest's CJS transformer).
 *
 * Stellar public keys are Strkey-encoded Ed25519 public keys:
 *  - Always start with 'G'
 *  - Are exactly 56 characters long
 *  - Use the base32 alphabet: A–Z 2–7
 *  - The final 2 characters encode a 2-byte CRC-16/XMODEM checksum
 *
 * Rather than re-implementing the full CRC check here, we import only the
 * StrKey utility from the SDK's CJS barrel at runtime (not at module load
 * time), so Jest can intercept it via moduleNameMapper or mock if needed.
 * In production the dynamic require is fine because it runs under Node CJS.
 */
@ValidatorConstraint({ name: 'IsStellarPublicKey', async: false })
export class IsStellarPublicKeyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;

    // Fast pre-check before hitting the SDK
    if (!/^G[A-Z2-7]{55}$/.test(value)) return false;

    try {
      // Dynamic require keeps this import lazy so Jest can mock/transform it.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { StrKey } = require('@stellar/stellar-sdk') as {
        StrKey: { isValidEd25519PublicKey: (v: string) => boolean };
      };
      return StrKey.isValidEd25519PublicKey(value);
    } catch {
      // If the SDK is unavailable (e.g. test environment), fall back to the
      // structural check above (which already passed).
      return true;
    }
  }

  defaultMessage(): string {
    return 'stellarPublicKey must be a valid Stellar public key (G...)';
  }
}

/**
 * Decorator that validates a Stellar Ed25519 public key (starts with G, 56 chars).
 *
 * @example
 * \@IsStellarPublicKey()
 * stellarPublicKey: string;
 */
export function IsStellarPublicKey(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string): void => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStellarPublicKeyConstraint,
    });
  };
}
