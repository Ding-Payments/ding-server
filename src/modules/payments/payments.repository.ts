import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PaymentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Payment ${id} not found.`,
        code: 'PAYMENT_NOT_FOUND',
      });
    }
    return payment;
  }

  async markAuthorized(id: string) {
    const now = new Date();
    const result = await this.prisma.payment.updateMany({
      where: { id, status: PaymentStatus.CREATED },
      data: { status: PaymentStatus.AUTHORIZED, authorizedAt: now },
    });

    if (result.count !== 1) {
      throw new ConflictException({
        statusCode: 409,
        message: 'Payment is no longer in a CREATED state.',
        code: 'PAYMENT_INVALID_STATE',
      });
    }

    return this.prisma.payment.findUniqueOrThrow({ where: { id } });
  }
}
