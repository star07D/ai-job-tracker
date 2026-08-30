import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrepService } from './prep.service';
import {
  PREP_PROVIDER,
  PrepGenerationError,
  PrepProvider,
  PrepUnavailableError,
} from './prep.types';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

const SAMPLE_PREP = {
  summary: 's',
  likelyQuestions: ['q1'],
  talkingPoints: ['t1'],
  research: ['r1'],
  questionsToAsk: ['a1'],
};

describe('PrepService', () => {
  let service: PrepService;
  let prisma: PrismaMock;
  let provider: jest.Mocked<PrepProvider>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    provider = {
      isConfigured: jest.fn().mockReturnValue(true),
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrepService,
        prismaMockProvider(prisma),
        { provide: PREP_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get(PrepService);
  });

  it("404s for a job that isn't the user's", async () => {
    prisma.job.findFirst.mockResolvedValue(null);
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it('stores the prep + timestamp on the job and returns it', async () => {
    prisma.job.findFirst.mockResolvedValue({
      id: 'j1',
      userId: 'u1',
      title: 'Dev',
      company: 'Acme',
      status: 'Interview',
      location: null,
      salary: null,
      notes: 'nice recruiter call',
    });
    provider.generate.mockResolvedValue(SAMPLE_PREP);
    prisma.job.update.mockResolvedValue({ id: 'j1', prep: SAMPLE_PREP });

    await service.generate('j1', 'u1');

    expect(provider.generate).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Dev', company: 'Acme' }),
    );
    expect(prisma.job.update).toHaveBeenCalledWith({
      where: { id: 'j1' },
      data: expect.objectContaining({
        prep: SAMPLE_PREP,
        prepGeneratedAt: expect.any(Date),
      }),
    });
  });

  it('maps a not-configured provider to 503', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'j1', userId: 'u1' });
    provider.generate.mockRejectedValue(new PrepUnavailableError());
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps a generation failure to 502', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'j1', userId: 'u1' });
    provider.generate.mockRejectedValue(new PrepGenerationError());
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
