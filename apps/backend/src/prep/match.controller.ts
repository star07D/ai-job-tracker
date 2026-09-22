import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  // Scoring is an external LLM call — keep it well below the global limit.
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post(':id/match')
  @HttpCode(HttpStatus.OK)
  generate(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.matchService.generate(id, req.user.userId);
  }
}
