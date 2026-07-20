import { ApiProperty } from '@nestjs/swagger';

export class PaymentAuthorizedResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AUTHORIZED' })
  status!: string;

  @ApiProperty({ format: 'date-time', nullable: true })
  authorizedAt!: string | null;
}
