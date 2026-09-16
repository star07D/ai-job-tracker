import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicService } from './public.service';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

describe('PublicService', () => {
  let service: PublicService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [PublicService, prismaMockProvider(prisma)],
    }).compile();

    service = module.get(PublicService);
  });

  it('throws 404 for an unknown or disabled token', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getShare('nope')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.job.findMany).not.toHaveBeenCalled();
  });

  it('only queries non-archived jobs for the token owner', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada' });
    prisma.job.findMany.mockResolvedValue([]);

    await service.getShare('tok');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { shareToken: 'tok' },
    });
    expect(prisma.job.findMany).toHaveBeenCalledWith({
      where: { userId: 'u1', archived: false },
      select: expect.objectContaining({
        title: true,
        company: true,
        status: true,
      }),
      orderBy: { appliedDate: 'desc' },
    });
  });

  it('never selects salary, notes, or contact fields', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada' });
    prisma.job.findMany.mockResolvedValue([]);

    await service.getShare('tok');

    const select = prisma.job.findMany.mock.calls[0][0].select;
    expect(select).not.toHaveProperty('salary');
    expect(select).not.toHaveProperty('notes');
    expect(select).not.toHaveProperty('contactName');
    expect(select).not.toHaveProperty('contactEmail');
    expect(select).not.toHaveProperty('nextAction');
  });

  it('falls back to a generic display name when firstName is unset', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: null });
    prisma.job.findMany.mockResolvedValue([]);

    const result = await service.getShare('tok');

    expect(result.displayName).toBe('A Rolio user');
    expect(result.trackingSince).toBeNull();
  });

  it('reports trackingSince as the earliest appliedDate among shared jobs', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', firstName: 'Ada' });
    const older = new Date('2026-01-01');
    const newer = new Date('2026-06-01');
    prisma.job.findMany.mockResolvedValue([
      {
        title: 'B',
        company: 'Y',
        status: 'Applied',
        appliedDate: newer,
        tags: [],
      },
      {
        title: 'A',
        company: 'X',
        status: 'Applied',
        appliedDate: older,
        tags: [],
      },
    ]);

    const result = await service.getShare('tok');

    expect(result.trackingSince).toBe(older);
    expect(result.jobs).toHaveLength(2);
  });
});
