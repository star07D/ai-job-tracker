import { Test, TestingModule } from '@nestjs/testing';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('PublicController', () => {
  let controller: PublicController;
  const publicService = { getShare: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicController],
      providers: [{ provide: PublicService, useValue: publicService }],
    }).compile();

    controller = module.get<PublicController>(PublicController);
  });

  it('GET /public/share/:token forwards the token to the service', async () => {
    publicService.getShare.mockResolvedValue({
      displayName: 'Ada',
      trackingSince: null,
      jobs: [],
    });

    const result = await controller.getShare('tok');

    expect(publicService.getShare).toHaveBeenCalledWith('tok');
    expect(result).toEqual({
      displayName: 'Ada',
      trackingSince: null,
      jobs: [],
    });
  });
});
