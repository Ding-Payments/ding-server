import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SupabaseModule } from './supabase/supabase.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PaymentRequestsModule } from './payment-requests/payment-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    SupabaseModule,
    UsersModule,
    PaymentsModule,
    TransactionsModule,
    PaymentRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
