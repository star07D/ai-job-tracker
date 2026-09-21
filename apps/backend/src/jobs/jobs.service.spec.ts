import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

describe('JobsService', () => {
  let service: JobsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsService, prismaMockProvider(prisma)],
    }).compile();

    service = module.get(JobsService);
  });

  describe('create', () => {
    it('connects the job to the owning user and forwards appliedDate', async () => {
      prisma.job.create.mockResolvedValue({ id: 'j1' });

      await service.create('u1', {
        title: 'Dev',
        company: 'Acme',
        status: 'Applied',
        appliedDate: '2026-01-02T00:00:00.000Z',
        nextAction: 'Email the recruiter',
        nextActionDue: '2026-01-09T00:00:00.000Z',
        contactName: 'Priya',
        contactEmail: 'priya@acme.com',
        contactLinkedin: 'linkedin.com/in/priya',
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Dev',
          company: 'Acme',
          appliedDate: '2026-01-02T00:00:00.000Z',
          statusChangedAt: '2026-01-02T00:00:00.000Z',
          nextAction: 'Email the recruiter',
          nextActionDue: '2026-01-09T00:00:00.000Z',
          contactName: 'Priya',
          contactEmail: 'priya@acme.com',
          contactLinkedin: 'linkedin.com/in/priya',
          user: { connect: { id: 'u1' } },
        }),
      });
    });

    it('records the first history row alongside the job', async () => {
      prisma.job.create.mockResolvedValue({ id: 'j1' });

      await service.create('u1', {
        title: 'Dev',
        company: 'Acme',
        status: 'Interview',
        appliedDate: '2026-01-02T00:00:00.000Z',
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          statusEvents: {
            create: {
              fromStatus: null,
              toStatus: 'Interview',
              at: '2026-01-02T00:00:00.000Z',
            },
          },
        }),
      });
    });

    it('normalizes tags: trims, drops blanks, dedupes case-insensitively', async () => {
      prisma.job.create.mockResolvedValue({ id: 'j1' });

      await service.create('u1', {
        title: 'Dev',
        company: 'Acme',
        status: 'Applied',
        tags: [' Remote ', 'remote', 'Backend', '', '  '],
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tags: ['Remote', 'Backend'] }),
      });
    });

    it('defaults tags to an empty array when omitted', async () => {
      prisma.job.create.mockResolvedValue({ id: 'j1' });

      await service.create('u1', {
        title: 'Dev',
        company: 'Acme',
        status: 'Applied',
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ tags: [] }),
      });
    });
  });

  describe('findAll', () => {
    it('scopes the query to the authenticated user', async () => {
      prisma.job.findMany.mockResolvedValue([]);
      await service.findAll('u1');
      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { appliedDate: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('throws 404 when the job is not owned by the user', async () => {
      prisma.job.findFirst.mockResolvedValue(null);
      await expect(service.findOne('j1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.job.findFirst).toHaveBeenCalledWith({
        where: { id: 'j1', userId: 'u1' },
      });
    });
  });

  describe('update', () => {
    it('checks ownership before updating', async () => {
      prisma.job.findFirst.mockResolvedValue(null);
      await expect(
        service.update('j1', 'u1', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.job.update).not.toHaveBeenCalled();
    });

    it('updates once ownership is confirmed', async () => {
      prisma.job.findFirst.mockResolvedValue({ id: 'j1', userId: 'u1' });
      prisma.job.update.mockResolvedValue({ id: 'j1', title: 'x' });
      await service.update('j1', 'u1', { title: 'x' });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { title: 'x' },
      });
    });

    it('stamps statusChangedAt when the status actually changes', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { status: 'Interview' });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: {
          status: 'Interview',
          statusChangedAt: expect.any(Date),
          statusEvents: {
            create: {
              fromStatus: 'Applied',
              toStatus: 'Interview',
              at: expect.any(Date),
            },
          },
        },
      });
    });

    it('records no history row when the status is unchanged', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { status: 'Applied', title: 'x' });
      const { data } = prisma.job.update.mock.calls[0][0];
      expect(data.statusEvents).toBeUndefined();
      expect(data.statusChangedAt).toBeUndefined();
    });

    it('leaves statusChangedAt alone for a non-status edit', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { status: 'Applied', notes: 'hi' });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { status: 'Applied', notes: 'hi' },
      });
    });

    it('normalizes tags when tags are part of the update', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
        archived: false,
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { tags: [' Remote ', 'remote', ''] });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { tags: ['Remote'] },
      });
    });

    it('stamps archivedAt when archiving', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
        archived: false,
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { archived: true });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { archived: true, archivedAt: expect.any(Date) },
      });
    });

    it('clears archivedAt when unarchiving', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
        archived: true,
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { archived: false });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { archived: false, archivedAt: null },
      });
    });

    it('leaves archivedAt alone when archived is unchanged', async () => {
      prisma.job.findFirst.mockResolvedValue({
        id: 'j1',
        userId: 'u1',
        status: 'Applied',
        archived: false,
      });
      prisma.job.update.mockResolvedValue({ id: 'j1' });
      await service.update('j1', 'u1', { archived: false, notes: 'hi' });
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 'j1' },
        data: { archived: false, notes: 'hi' },
      });
    });
  });

  describe('remove', () => {
    it('checks ownership before deleting', async () => {
      prisma.job.findFirst.mockResolvedValue(null);
      await expect(service.remove('j1', 'u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.job.delete).not.toHaveBeenCalled();
    });
  });
});
