import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { MatchService } from './match.service';
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

const SAMPLE_RESULT = {
  score: 82,
  summary: 'Strong overlap on the core stack.',
  strengths: ['5 years of React'],
  gaps: ['No Go experience'],
};

describe('MatchService', () => {
  let service: MatchService;
  let prisma: PrismaMock;
  let provider: jest.Mocked<PrepProvider>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    provider = {
      isConfigured: jest.fn().mockReturnValue(true),
      generate: jest.fn(),
      extractJob: jest.fn(),
      matchResume: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchService,
        prismaMockProvider(prisma),
        { provide: PREP_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get(MatchService);
  });

  it("404s for a job that isn't the user's", async () => {
    prisma.job.findFirst.mockResolvedValue(null);
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(provider.matchResume).not.toHaveBeenCalled();
  });

  it('400s when the user has no résumé uploaded', async () => {
    prisma.job.findFirst.mockResolvedValue({
      id: 'j1',
      userId: 'u1',
      title: 'Dev',
      company: 'Acme',
      notes: null,
    });
    prisma.user.findUnique.mockResolvedValue({ resumeText: null });

    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(provider.matchResume).not.toHaveBeenCalled();
  });

  it('stores the band-computed match + timestamp on the job and returns it', async () => {
    prisma.job.findFirst.mockResolvedValue({
      id: 'j1',
      userId: 'u1',
      title: 'Dev',
      company: 'Acme',
      notes: 'nice recruiter call',
    });
    prisma.user.findUnique.mockResolvedValue({ resumeText: 'a whole résumé' });
    provider.matchResume.mockResolvedValue(SAMPLE_RESULT);
    prisma.job.update.mockResolvedValue({ id: 'j1' });

    await service.generate('j1', 'u1');

    expect(provider.matchResume).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Dev',
        company: 'Acme',
        resumeText: 'a whole résumé',
      }),
    );
    expect(prisma.job.update).toHaveBeenCalledWith({
      where: { id: 'j1' },
      data: {
        resumeMatch: expect.objectContaining({ score: 82, band: 'strong' }),
        resumeMatchAt: expect.any(Date),
      },
    });
  });

  it('maps a not-configured provider to 503', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'j1', userId: 'u1' });
    prisma.user.findUnique.mockResolvedValue({ resumeText: 'a résumé' });
    provider.matchResume.mockRejectedValue(new PrepUnavailableError());
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('maps a generation failure to 502', async () => {
    prisma.job.findFirst.mockResolvedValue({ id: 'j1', userId: 'u1' });
    prisma.user.findUnique.mockResolvedValue({ resumeText: 'a résumé' });
    provider.matchResume.mockRejectedValue(new PrepGenerationError());
    await expect(service.generate('j1', 'u1')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });
});
