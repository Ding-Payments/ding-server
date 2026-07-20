import { Module } from '@nestjs/common';
import { UsersModule } from '../modules/users/users.module';
import { WebAuthnController } from './webauthn.controller';
import { WebAuthnService } from './webauthn.service';
import { WebAuthnRepository } from './webauthn.repository';

@Module({
  imports: [UsersModule],
  controllers: [WebAuthnController],
  providers: [WebAuthnService, WebAuthnRepository],
  exports: [WebAuthnService],
})
export class WebAuthnModule {}
