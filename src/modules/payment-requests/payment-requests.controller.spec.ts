import { Test, TestingModule } from '@nestjs/testing';
import { PaymentRequestsController } from './payment-requests.controller';
import { PaymentRequestsService } from './payment-requests.service';

describe('PaymentRequestsController', () => {
  let controller: PaymentRequestsController;
  let service: PaymentRequestsService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PaymentRequestsController],
      providers: [PaymentRequestsService],
    }).compile();

    controller = moduleRef.get(PaymentRequestsController);
    service = moduleRef.get(PaymentRequestsService);
  });

  it('delegates the payload to the service and returns its result', () => {
    const expected = {
      valid: true as const,
      normalized: undefined,
      errors: [],
    };
    const spy = jest.spyOn(service, 'validate').mockReturnValue(expected);
    const payload = { type: 'payment-request' };

    const result = controller.validate(payload);

    expect(spy).toHaveBeenCalledWith(payload);
    expect(result).toBe(expected);
  });
});
