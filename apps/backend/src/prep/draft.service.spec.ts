import { Test, TestingModule } from '@nestjs/testing';
import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DraftService } from './draft.service';
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

const JOB = {
  id: 'j1',
  userId: 'u1',
  title: 'Backend Engineer',
  company: 'Acme',
  status: 'Interview',
  notes: 'Spoke with Priya about the data platform.',
  contactName: 'Priya Shah',
  nextAction: 'Send a thank-you note',
};

describe('DraftService', () => {
  let service: DraftService;
  let prisma: PrismaMock;
  let provider: jest.Mocked<PrepProvider>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    provider = {
      isConfigured: jest.fn().mockReturnValue(true),
      generate: jest.fn(),
      extractJob: jest.fn(),
      matchResume: jest.fn(),
      draftMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DraftService,
        prismaMockProvider(prisma),
        { provide: PREP_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get(DraftService);
  });

  it("404s for a job that isn't the user's", async () => {
    prisma.job.findFirst.mockResolvedValue(null);
    await expect(
      service.generate('j1', 'u1', 'follow-up'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(provider.draftMessage).not.toHaveBeenCalled();
  });

  it('drafts a follow-up from the job and the sender, without the résumé', async () => {
    prisma.job.findFirst.mockResolvedValue(JOB);
    prisma.user.findUnique.mockResolvedValue({
      firstName: 'Alex',
      resumeText: 'a long résumé',
    });
    provider.draftMessage.mockResolvedValue({ subject: 's', body: 'b' });

    const result = await service.generate('j1', 'u1', 'follow-up');

    expect(result).toEqual({ subject: 's', body: 'b' });
    expect(provider.draftMessage).toHaveBeenCalledWith({
      kind: 'follow-up',
      title: 'Backend Engineer',
      company: 'Acme',
      status: 'Interview',
      notes: JOB.notes,
      contactName: 'Priya Shah',
      nextAction: 'Send a thank-you note',
      senderName: 'Alex',
      // not needed for a follow-up, so it never leaves the server
      resumeText: null,
    });
  });

  it('refuses a cover letter when no résumé is uploaded', async () => {
    prisma.job.findFirst.mockResolvedValue(JOB);
    prisma.user.findUnique.mockResolvedValue({
      firstName: 'Alex',
      resumeText: null,
    });

    await expect(
      service.generate('j1', 'u1', 'cover-letter'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(provider.draftMessage).not.toHaveBeenCalled();
  });

  it('passes the résumé through for a cover letter', async () => {
    prisma.job.findFirst.mockResolvedValue(JOB);
    prisma.user.findUnique.mockResolvedValue({
      firstName: 'Alex',
      resumeText: 'a long résumé',
    });
    provider.draftMessage.mockResolvedValue({ subject: 's', body: 'b' });

    await service.generate('j1', 'u1', 'cover-letter');

    expect(provider.draftMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'cover-letter',
        resumeText: 'a long résumé',
      }),
    );
  });

  it('maps a not-configured provider to 503', async () => {
    prisma.job.findFirst.mockResolvedValue(JOB);
    prisma.user.findUnique.mockResolvedValue({ firstName: 'A' });
    provider.draftMessage.mockRejectedValue(new PrepUnavailableError());
    await expect(
      service.generate('j1', 'u1', 'thank-you'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('maps a generation failure to 502', async () => {
    prisma.job.findFirst.mockResolvedValue(JOB);
    prisma.user.findUnique.mockResolvedValue({ firstName: 'A' });
    provider.draftMessage.mockRejectedValue(new PrepGenerationError());
    await expect(
      service.generate('j1', 'u1', 'thank-you'),
    ).rejects.toBeInstanceOf(BadGatewayException);
  });
});
