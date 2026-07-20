import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PaymentStatus } from '@prisma/client';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { WebAuthnService } from '../../webauthn/webauthn.service';
import { UsersService } from '../users/users.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PaymentsRepository } from './payments.repository';
import { PaymentAuthorizedResponseDto } from './dto';

export const PAYMENT_AUTHORIZED_EVENT = 'payment.authorized';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly repo: PaymentsRepository,
    private readonly webAuthnService: WebAuthnService,
    private readonly usersService: UsersService,
    private readonly events: EventEmitter2,
  ) {}

  async authorize(
    authUser: AuthenticatedUser,
    paymentId: string,
    assertion: AuthenticationResponseJSON,
  ): Promise<PaymentAuthorizedResponseDto> {
    const user = await this.usersService.getUserBySupabaseId(
      authUser.supabaseUserId,
    );
    if (!user) {
      throw new InternalServerErrorException('User record not found.');
    }

    const payment = await this.repo.findById(paymentId);

    if (payment.senderUserId !== user.id) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'You are not the sender of this payment.',
        code: 'FORBIDDEN',
      });
    }

    if (payment.status !== PaymentStatus.CREATED) {
      throw new ConflictException({
        statusCode: 409,
        message: `Payment is ${payment.status}; expected CREATED.`,
        code: 'PAYMENT_INVALID_STATE',
      });
    }

    if (payment.expiresAt && payment.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Payment has expired.',
        code: 'PAYMENT_INVALID_STATE',
      });
    }

    await this.webAuthnService.verifyPaymentAssertion({
      internalUserId: user.id,
      paymentId,
      assertion,
    });

    const authorized = await this.repo.markAuthorized(paymentId);

    this.events.emit(PAYMENT_AUTHORIZED_EVENT, {
      paymentId: authorized.id,
      userId: user.id,
    });

    return {
      id: authorized.id,
      status: authorized.status,
      authorizedAt: authorized.authorizedAt?.toISOString() ?? null,
    };
  }
}
