import {
  BadGatewayException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  PREP_PROVIDER,
  PrepGenerationError,
  PrepUnavailableError,
} from './prep.types';
import type { PrepProvider } from './prep.types';

@Injectable()
export class PrepService {
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

    try {
      const prep = await this.provider.generate({
        title: job.title,
        company: job.company,
        status: job.status,
        location: job.location,
        salary: job.salary,
        notes: job.notes,
      });

      return this.prisma.job.update({
        where: { id: jobId },
        data: {
          prep: prep as unknown as Prisma.InputJsonValue,
          prepGeneratedAt: new Date(),
        },
      });
    } catch (err) {
      if (err instanceof PrepUnavailableError) {
        throw new ServiceUnavailableException(err.message);
      }
      if (err instanceof PrepGenerationError) {
        throw new BadGatewayException(
          `Prep generation failed (${err.message}). Check GEMINI_API_KEY / GEMINI_MODEL, then try again.`,
        );
      }
      throw err;
    }
  }
}
