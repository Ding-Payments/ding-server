import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { StellarNetwork } from '@prisma/client';
import { LinkWalletDto } from '../dto/link-wallet.dto';

// Valid testnet key used throughout tests
const VALID_KEY = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

describe('IsStellarPublicKey validator', () => {
  async function validateDto(
    partial: Record<string, unknown>,
  ): Promise<string[]> {
    const dto = plainToInstance(LinkWalletDto, partial);
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('passes for a valid Stellar G... key', async () => {
    const errors = await validateDto({
      stellarPublicKey: VALID_KEY,
      network: StellarNetwork.TESTNET,
    });
    expect(errors).toHaveLength(0);
  });

  it('fails for a Bitcoin address', async () => {
    const errors = await validateDto({
      stellarPublicKey: '1A1zP1eP5QGefi2DMPTfTL5SLmv7Divf',
      network: StellarNetwork.TESTNET,
    });
    expect(errors.some((e) => e.includes('Stellar public key'))).toBe(true);
  });

  it('fails for an Ethereum address', async () => {
    const errors = await validateDto({
      stellarPublicKey: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      network: StellarNetwork.TESTNET,
    });
    expect(errors.some((e) => e.includes('Stellar public key'))).toBe(true);
  });

  it('fails for a random string', async () => {
    const errors = await validateDto({
      stellarPublicKey: 'not-a-key',
      network: StellarNetwork.TESTNET,
    });
    expect(errors.some((e) => e.includes('Stellar public key'))).toBe(true);
  });

  it('fails for an empty string', async () => {
    const errors = await validateDto({
      stellarPublicKey: '',
      network: StellarNetwork.TESTNET,
    });
    expect(errors.some((e) => e.includes('Stellar public key'))).toBe(true);
  });

  it('fails when stellarPublicKey is missing', async () => {
    const errors = await validateDto({ network: StellarNetwork.TESTNET });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('fails for a Stellar secret key (S... prefix)', async () => {
    // Stellar secret keys start with S — they are NOT valid public keys
    const errors = await validateDto({
      stellarPublicKey:
        'SCZANGBA5XTONSSO2RQHXMERQLKAOURNKQ6HIEOE7LM2QLMJNB3DBSA',
      network: StellarNetwork.TESTNET,
    });
    expect(errors.some((e) => e.includes('Stellar public key'))).toBe(true);
  });

  it('accepts an optional label', async () => {
    const errors = await validateDto({
      stellarPublicKey: VALID_KEY,
      network: StellarNetwork.TESTNET,
      label: 'My wallet',
    });
    expect(errors).toHaveLength(0);
  });

  it('fails when label exceeds 100 characters', async () => {
    const errors = await validateDto({
      stellarPublicKey: VALID_KEY,
      network: StellarNetwork.TESTNET,
      label: 'x'.repeat(101),
    });
    expect(errors.some((e) => e.includes('100'))).toBe(true);
  });
});
