import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { WebAuthnService } from './webauthn.service';
import { WebAuthnRepository } from './webauthn.repository';
import { UsersService } from '../modules/users/users.service';
import { CHALLENGE_TYPE, WEBAUTHN_ERROR } from './webauthn.constants';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn(),
  verifyRegistrationResponse: jest.fn(),
  generateAuthenticationOptions: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}));

const mockGenReg = generateRegistrationOptions as jest.Mock;
const mockVerReg = verifyRegistrationResponse as jest.Mock;
const mockGenAuth = generateAuthenticationOptions as jest.Mock;
const mockVerAuth = verifyAuthenticationResponse as jest.Mock;

const AUTH_USER: AuthenticatedUser = { supabaseUserId: 'sb-1' };
const INTERNAL_USER = { id: 'user-1', email: 'alice@example.com' };

interface RepoMock {
  createChallenge: jest.Mock;
  consumeLatestValid: jest.Mock;
  createCredential: jest.Mock;
  listByUser: jest.Mock;
  findByCredentialId: jest.Mock;
  updateCounter: jest.Mock;
}

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let repo: RepoMock;
  let users: { getUserBySupabaseId: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    repo = {
      createChallenge: jest.fn().mockResolvedValue({ id: 'ch-1' }),
      consumeLatestValid: jest.fn(),
      createCredential: jest.fn().mockResolvedValue({}),
      listByUser: jest.fn().mockResolvedValue([]),
      findByCredentialId: jest.fn(),
      updateCounter: jest.fn().mockResolvedValue({}),
    };

    users = {
      getUserBySupabaseId: jest.fn().mockResolvedValue(INTERNAL_USER),
    };

    const config = {
      get: (key: string) =>
        ({
          'webauthn.rpId': 'localhost',
          'webauthn.rpName': 'Ding Payments',
          'webauthn.origin': 'http://localhost:8081',
        })[key],
    } as unknown as ConfigService;

    service = new WebAuthnService(
      repo as unknown as WebAuthnRepository,
      users as unknown as UsersService,
      config,
    );
  });

  describe('generateRegistrationOptions', () => {
    it('stores a registration challenge and returns options', async () => {
      mockGenReg.mockResolvedValue({ challenge: 'reg-challenge' });

      const options = await service.generateRegistrationOptions(AUTH_USER);

      expect(options).toEqual({ challenge: 'reg-challenge' });
      expect(repo.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          challenge: 'reg-challenge',
          type: CHALLENGE_TYPE.REGISTRATION,
        }),
      );
    });
  });

  describe('verifyRegistration', () => {
    it('persists the credential on a verified response', async () => {
      repo.consumeLatestValid.mockResolvedValue({
        challenge: 'reg-challenge',
      });
      mockVerReg.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'cred-abc',
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
          },
        },
      });

      const result = await service.verifyRegistration(AUTH_USER, {} as never);

      expect(result).toEqual({ verified: true, credentialId: 'cred-abc' });
      expect(repo.createCredential).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'user-1', credentialId: 'cred-abc' }),
      );
    });

    it('throws CHALLENGE_EXPIRED when no challenge is stored', async () => {
      repo.consumeLatestValid.mockResolvedValue(null);

      await expect(
        service.verifyRegistration(AUTH_USER, {} as never),
      ).rejects.toMatchObject({
        response: { code: WEBAUTHN_ERROR.CHALLENGE_EXPIRED },
      });
      expect(mockVerReg).not.toHaveBeenCalled();
    });

    it('throws VERIFICATION_FAILED when not verified', async () => {
      repo.consumeLatestValid.mockResolvedValue({
        challenge: 'reg-challenge',
      });
      mockVerReg.mockResolvedValue({ verified: false });

      await expect(
        service.verifyRegistration(AUTH_USER, {} as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a duplicate credential (P2002) to a 409 conflict', async () => {
      repo.consumeLatestValid.mockResolvedValue({
        challenge: 'reg-challenge',
      });
      mockVerReg.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: 'cred-abc',
            publicKey: new Uint8Array([1]),
            counter: 0,
          },
        },
      });
      repo.createCredential.mockRejectedValue({ code: 'P2002' });

      await expect(
        service.verifyRegistration(AUTH_USER, {} as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('generateAuthenticationOptions', () => {
    it('throws NO_CREDENTIALS when the user has no passkeys', async () => {
      repo.listByUser.mockResolvedValue([]);

      await expect(
        service.generateAuthenticationOptions(AUTH_USER, 'pay-1'),
      ).rejects.toMatchObject({
        response: { code: WEBAUTHN_ERROR.NO_CREDENTIALS },
      });
    });

    it('stores an authentication challenge bound to the payment', async () => {
      repo.listByUser.mockResolvedValue([
        { credentialId: 'cred-abc' },
      ] as never);
      mockGenAuth.mockResolvedValue({ challenge: 'auth-challenge' });

      const options = await service.generateAuthenticationOptions(
        AUTH_USER,
        'pay-1',
      );

      expect(options).toEqual({ challenge: 'auth-challenge' });
      expect(repo.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CHALLENGE_TYPE.AUTHENTICATION,
          paymentId: 'pay-1',
        }),
      );
    });
  });

  describe('verifyPaymentAssertion', () => {
    const assertion = { id: 'cred-abc' } as never;

    it('throws CHALLENGE_EXPIRED when no authentication challenge exists', async () => {
      repo.consumeLatestValid.mockResolvedValue(null);

      await expect(
        service.verifyPaymentAssertion({
          internalUserId: 'user-1',
          paymentId: 'pay-1',
          assertion,
        }),
      ).rejects.toMatchObject({
        response: { code: WEBAUTHN_ERROR.CHALLENGE_EXPIRED },
      });
    });

    it('throws VERIFICATION_FAILED for an unknown credential', async () => {
      repo.consumeLatestValid.mockResolvedValue({
        challenge: 'auth-challenge',
      });
      repo.findByCredentialId.mockResolvedValue(null);

      await expect(
        service.verifyPaymentAssertion({
          internalUserId: 'user-1',
          paymentId: 'pay-1',
          assertion,
        }),
      ).rejects.toMatchObject({
        response: { code: WEBAUTHN_ERROR.VERIFICATION_FAILED },
      });
    });

    it('advances the counter on a verified assertion', async () => {
      repo.consumeLatestValid.mockResolvedValue({
        challenge: 'auth-challenge',
      });
      repo.findByCredentialId.mockResolvedValue({
        credentialId: 'cred-abc',
        userId: 'user-1',
        publicKey: new Uint8Array([1, 2, 3]),
        counter: BigInt(0),
      });
      mockVerAuth.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 5 },
      });

      await service.verifyPaymentAssertion({
        internalUserId: 'user-1',
        paymentId: 'pay-1',
        assertion,
      });

      expect(repo.updateCounter).toHaveBeenCalledWith(
        'cred-abc',
        BigInt(5),
        expect.any(Date),
      );
    });
  });
});
