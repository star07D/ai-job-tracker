import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { computeInsights } from './insights.calc';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async forUser(userId: string, now: Date = new Date()) {
    // archived jobs stay in: they're history, and history is what this measures
    const jobs = await this.prisma.job.findMany({
      where: { userId },
      select: {
        status: true,
        appliedDate: true,
        statusChangedAt: true,
        tags: true,
        archived: true,
        statusEvents: {
          select: { fromStatus: true, toStatus: true, at: true },
        },
      },
    });
    return computeInsights(jobs, now);
  }
}
