import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';

/**
 * Unauthenticated — anyone with the link can view it. No JwtAuthGuard here
 * by design; PublicService only ever returns the trimmed, non-sensitive
 * fields a user opted to share.
 */
@Throttle({ default: { ttl: 60_000, limit: 30 } })
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('share/:token')
  getShare(@Param('token') token: string) {
    return this.publicService.getShare(token);
  }
}
