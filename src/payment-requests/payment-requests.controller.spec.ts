import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';

describe('PaymentRequestsController', () => {
  let controller: PaymentRequestsController;
  let service: PaymentRequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRequestsController],
      providers: [PaymentRequestsService],
    }).compile();

    controller = module.get<PaymentRequestsController>(
      PaymentRequestsController,
    );
    service = module.get<PaymentRequestsService>(PaymentRequestsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('validate', () => {
    it('should call service.validate and return result', () => {
      const dto = {
        asset: 'USDC',
        recipient: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
        amount: 100,
      };

      const spy = jest.spyOn(service, 'validate');
      const result = controller.validate(dto);

      expect(spy).toHaveBeenCalledWith(dto);
      expect(result.valid).toBe(true);
      expect(result.normalizedPayload?.amount).toBe(100);
    });
  });
});
