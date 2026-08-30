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
import { PrepService } from './prep.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class PrepController {
  constructor(private readonly prepService: PrepService) {}

  // Generating prep is an external LLM call — keep it well below the global limit.
  @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post(':id/prep')
  @HttpCode(HttpStatus.OK)
  generate(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.prepService.generate(id, req.user.userId);
  }
}
