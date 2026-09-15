import { Test, TestingModule } from '@nestjs/testing';
// @nestjs/config@12 ships ESM-only; Jest's CJS transform can't parse its dist
// file directly. A minimal stub is all DI needs to wire the token by identity.
jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));
import { ConfigService } from '@nestjs/config';
import { DigestService } from './digest.service';
import { EMAIL_PROVIDER } from './digest.types';
import type { EmailProvider } from './digest.types';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

const NOW = new Date('2026-09-20T12:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);
const daysFromNow = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

function job(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'j1',
    title: 'Staff Engineer',
    company: 'Kensho',
    status: 'Applied',
    statusChangedAt: daysAgo(1),
    nextActionDue: null,
    ...overrides,
  };
}

describe('DigestService', () => {
  let service: DigestService;
  let prisma: PrismaMock;
  let email: jest.Mocked<EmailProvider>;

  beforeEach(async () => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma = createPrismaMock();
    email = { isConfigured: jest.fn().mockReturnValue(true), send: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DigestService,
        prismaMockProvider(prisma),
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: EMAIL_PROVIDER, useValue: email },
      ],
    }).compile();

    service = module.get(DigestService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('skips the run entirely when no email provider is configured', async () => {
    email.isConfigured.mockReturnValue(false);
    const result = await service.run();

    expect(result).toEqual({ usersChecked: 0, emailsSent: 0 });
    expect(prisma.user.findMany).not.toHaveBeenCalled();
  });

  it('only looks at opted-in users', async () => {
    prisma.user.findMany.mockResolvedValue([]);
    await service.run();
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { emailDigestEnabled: true },
      include: { jobs: true },
    });
  });

  it('emails a user with an overdue follow-up', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        email: 'a@example.com',
        jobs: [job({ nextActionDue: daysAgo(2) })],
      },
    ]);

    const result = await service.run();

    expect(email.send).toHaveBeenCalledTimes(1);
    const sent = email.send.mock.calls[0][0];
    expect(sent.to).toBe('a@example.com');
    expect(sent.subject).toContain('follow-up');
    expect(sent.html).toContain('Staff Engineer');
    expect(sent.html).toContain('2 days overdue');
    expect(result).toEqual({ usersChecked: 1, emailsSent: 1 });
  });

  it('emails a user with a job that has gone quiet', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        email: 'b@example.com',
        jobs: [job({ status: 'Applied', statusChangedAt: daysAgo(30) })],
      },
    ]);

    await service.run();

    const sent = email.send.mock.calls[0][0];
    expect(sent.subject).toContain('gone quiet');
    expect(sent.html).toContain('in Applied');
  });

  it('does not treat a stale job as quiet once a follow-up is scheduled', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        email: 'c@example.com',
        jobs: [
          job({
            status: 'Applied',
            statusChangedAt: daysAgo(60),
            nextActionDue: daysFromNow(5),
          }),
        ],
      },
    ]);

    const result = await service.run();

    expect(email.send).not.toHaveBeenCalled();
    expect(result.emailsSent).toBe(0);
  });

  it('ignores archived jobs even if they are stale or overdue', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        email: 'e@example.com',
        jobs: [
          job({ nextActionDue: daysAgo(2), archived: true }),
          job({
            status: 'Applied',
            statusChangedAt: daysAgo(30),
            archived: true,
          }),
        ],
      },
    ]);

    const result = await service.run();

    expect(email.send).not.toHaveBeenCalled();
    expect(result).toEqual({ usersChecked: 1, emailsSent: 0 });
  });

  it('skips a user with nothing due or stale', async () => {
    prisma.user.findMany.mockResolvedValue([
      { email: 'd@example.com', jobs: [job({ statusChangedAt: daysAgo(1) })] },
    ]);

    const result = await service.run();

    expect(email.send).not.toHaveBeenCalled();
    expect(result).toEqual({ usersChecked: 1, emailsSent: 0 });
  });

  it('logs and continues if one user email fails', async () => {
    prisma.user.findMany.mockResolvedValue([
      { email: 'fail@example.com', jobs: [job({ nextActionDue: daysAgo(1) })] },
      { email: 'ok@example.com', jobs: [job({ nextActionDue: daysAgo(1) })] },
    ]);
    email.send
      .mockRejectedValueOnce(new Error('bounced'))
      .mockResolvedValueOnce(undefined);

    const result = await service.run();

    expect(result).toEqual({ usersChecked: 2, emailsSent: 1 });
  });
});
