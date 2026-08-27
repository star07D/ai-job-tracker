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
      });

      expect(prisma.job.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Dev',
          company: 'Acme',
          appliedDate: '2026-01-02T00:00:00.000Z',
          user: { connect: { id: 'u1' } },
        }),
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
