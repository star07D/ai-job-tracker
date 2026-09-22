import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildResumeMatch } from './match.calc';
import {
  PREP_PROVIDER,
  PrepGenerationError,
  PrepUnavailableError,
} from './prep.types';
import type { PrepProvider } from './prep.types';

@Injectable()
export class MatchService {
  constructor(
    private prisma: PrismaService,
    @Inject(PREP_PROVIDER) private provider: PrepProvider,
  ) {}

  async generate(jobId: string, userId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { resumeText: true },
    });

    if (!user?.resumeText) {
      throw new BadRequestException(
        'Upload your résumé in Settings before checking a match',
      );
    }

    try {
      const result = await this.provider.matchResume({
        title: job.title,
        company: job.company,
        notes: job.notes,
        resumeText: user.resumeText,
      });
      const resumeMatch = buildResumeMatch(result);

      return this.prisma.job.update({
        where: { id: jobId },
        data: {
          resumeMatch: resumeMatch as unknown as Prisma.InputJsonValue,
          resumeMatchAt: new Date(),
        },
      });
    } catch (err) {
      if (err instanceof PrepUnavailableError) {
        throw new ServiceUnavailableException(err.message);
      }
      if (err instanceof PrepGenerationError) {
        throw new BadGatewayException(
          `Match generation failed (${err.message}). Check GEMINI_API_KEY / GEMINI_MODEL, then try again.`,
        );
      }
      throw err;
    }
  }
}
