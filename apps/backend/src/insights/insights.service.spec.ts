import { Test } from '@nestjs/testing';
import { InsightsService } from './insights.service';
import {
  createPrismaMock,
  prismaMockProvider,
  PrismaMock,
} from '../test/prisma.mock';

describe('InsightsService', () => {
  let service: InsightsService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const module = await Test.createTestingModule({
      providers: [InsightsService, prismaMockProvider(prisma)],
    }).compile();
    service = module.get(InsightsService);
  });

  it("only ever reads the requesting user's jobs", async () => {
    prisma.job.findMany.mockResolvedValue([]);

    const r = await service.forUser('u1', new Date('2026-09-21T12:00:00Z'));

    expect(prisma.job.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u1' } }),
    );
    expect(r.total).toBe(0);
    expect(r.weekly).toHaveLength(8);
  });
});
