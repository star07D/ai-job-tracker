import {
  Controller,
  ForbiddenException,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DigestService } from './digest.service';

/**
 * Machine-to-machine endpoint — a scheduled job (GitHub Actions cron) calls
 * this once a day. No user JWT here; a shared secret header stands in for it.
 */
@Controller('internal')
export class DigestController {
  constructor(
    private readonly digestService: DigestService,
    private readonly config: ConfigService,
  ) {}

  @Post('digest')
  @HttpCode(HttpStatus.OK)
  trigger(@Headers('x-digest-secret') provided?: string) {
    const expected = this.config.get<string>('DIGEST_SECRET');
    if (!expected) {
      throw new ServiceUnavailableException(
        'Digest is not configured (DIGEST_SECRET unset)',
      );
    }
    if (provided !== expected) {
      throw new ForbiddenException('Invalid digest secret');
    }

    return this.digestService.run();
  }
}
