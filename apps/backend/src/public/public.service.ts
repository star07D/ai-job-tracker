import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PublicJob {
  title: string;
  company: string;
  status: string;
  location: string | null;
  appliedDate: Date;
  tags: string[];
}

export interface PublicShare {
  displayName: string;
  /** Earliest appliedDate among the shared jobs — not the account's signup
   * date, so this reflects the job search itself rather than when Rolio was
   * first set up. Null when there's nothing to share yet. */
  trackingSince: Date | null;
  jobs: PublicJob[];
}

// Deliberately excludes salary, notes, contact details, and the next-step
// fields — those stay private even when sharing is on.
const PUBLIC_JOB_FIELDS = {
  title: true,
  company: true,
  status: true,
  location: true,
  appliedDate: true,
  tags: true,
} as const;

@Injectable()
export class PublicService {
  constructor(private prisma: PrismaService) {}

  async getShare(token: string): Promise<PublicShare> {
    const user = await this.prisma.user.findUnique({
      where: { shareToken: token },
    });

    if (!user) {
      throw new NotFoundException(
        'This share link is invalid or has been turned off',
      );
    }

    const jobs = await this.prisma.job.findMany({
      where: { userId: user.id, archived: false },
      select: PUBLIC_JOB_FIELDS,
      orderBy: { appliedDate: 'desc' },
    });

    return {
      displayName: user.firstName || 'A Rolio user',
      trackingSince:
        jobs.length > 0
          ? jobs.reduce(
              (earliest, job) =>
                job.appliedDate < earliest ? job.appliedDate : earliest,
              jobs[0].appliedDate,
            )
          : null,
      jobs,
    };
  }
}
