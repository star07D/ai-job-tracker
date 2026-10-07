import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DraftKind,
  PREP_PROVIDER,
  PrepGenerationError,
  PrepUnavailableError,
} from './prep.types';
import type { PrepProvider } from './prep.types';

@Injectable()
export class DraftService {
  constructor(
    private prisma: PrismaService,
    @Inject(PREP_PROVIDER) private provider: PrepProvider,
  ) {}

  /** Generates a draft on demand. Nothing is stored — the user edits and copies
   * it, so there's no schema to maintain and a regenerate is always fresh. */
  async generate(jobId: string, userId: string, kind: DraftKind) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, resumeText: true },
    });

    // A cover letter with nothing to draw on would be generic filler (or
    // invented experience) — the other two need only the job itself.
    if (kind === 'cover-letter' && !user?.resumeText) {
      throw new BadRequestException(
        'Upload your résumé in Settings before drafting a cover letter',
      );
    }

    try {
      return await this.provider.draftMessage({
        kind,
        title: job.title,
        company: job.company,
        status: job.status,
        notes: job.notes,
        contactName: job.contactName,
        nextAction: job.nextAction,
        senderName: user?.firstName,
        resumeText: kind === 'cover-letter' ? user?.resumeText : null,
      });
    } catch (err) {
      if (err instanceof PrepUnavailableError) {
        throw new ServiceUnavailableException(err.message);
      }
      if (err instanceof PrepGenerationError) {
        throw new BadGatewayException(
          `Draft generation failed (${err.message}). Check GEMINI_API_KEY / GEMINI_MODEL, then try again.`,
        );
      }
      throw err;
    }
  }
}
